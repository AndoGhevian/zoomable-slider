import React, {
  PropsWithRef,
  forwardRef,
  useEffect,
  useRef,
  useLayoutEffect,
  useState,
} from 'react';
import { animated, useSpring } from '@react-spring/web';
import { useGesture } from '@use-gesture/react';
import usePrevValue from '../hooks/usePrevValue';
import "./ZoomableSlider.css"

export type ZoomableSliderProps = {
  className?: string;
  /**
   * _step_ is a granularity number that specifies the labled units
   * 
   * NOTE: _max_ value will be also labeled.
   */
  step: number;
  /**_max_ is a number that specifies the granularity of slider */
  max: number;
  /**Pass this for two way binding */
  value?: number;
  /**If `false` will move pointer smoothle else will hang on each granular step.
   * 
   * NOTE: You can give a _max_ value something very big and set this to `true`, in this case it will also look like smooth pointer
   */
  discrete?: boolean;
  /**If `true` will fix final values(also pointer) to nearest unit with _step_ granularty: see @property step for more details*/
  fixToStep?: boolean;
  /**
   * Need to pass this property when you want to handle window resize effects:
   * On window resize you need to pass _ref_ to component and set _width_ attribute manually.
   */
  width?: number;
  /**
   * Put Some JSX inside lable
   * @param offset - granularity offset of unit
   * @param index - index of unit
   */
  mapLabel?: (offset: number, index: number) => React.ReactElement
  /**
   * Fire on each granular step change, also on finish change i.e. release of pointer.
   * 
   * NOTE: Slider with Two way binding is some other sort of discret slider,
   * because onChange fires only on granular changes
   * but if discrete property is set to false it will change value smoothle
   * @param value - Nearest granularty value: takes in to account also fixToStep and discrete values
   * @param finish - change finish indicator: takes in to account also fixToStep and discrete values
   */
  onChange?: (value: number, finish: boolean) => void
}

/**
 * Zoomable Controlable/Uncontrolable Slider Component for General Pourpose
 * 
 * NOTE: On window resize you need to pass _ref_ to component and set _width_ attribute manually
 */
const ZoomableSlider = forwardRef(function ZoomableSlider(props: PropsWithRef<ZoomableSliderProps>, ref: any) {
  const {
    className,
    step,
    max,
    value,
    width,
    onChange = () => void 0,
    discrete = false,
    fixToStep = false,
    mapLabel,
  } = props
  const sliderRef = useRef<HTMLDivElement>(null)
  const [rangeValue, setRangeValue] = useState(0)
  const [lastFixedWidth, setLastFixedWidth] = useState<number>()

  const lastChangeValueRef = useRef<number | null>(value || rangeValue)

  const prevRef = usePrevValue(ref)
  useEffect(() => {
    if (prevRef && prevRef !== ref) {
      if (typeof ref === 'function') {
        ref(sliderRef.current)
      } else if (ref) {
        ref.current = sliderRef.current
      }
    }
  })

  useLayoutEffect(() => {
    if (sliderRef.current) {
      const boxSizing = getComputedStyle(sliderRef.current).boxSizing
      console.log(boxSizing)
      if (!width) {
        // Fix Css Width
        console.log(sliderRef.current.offsetWidth, sliderRef.current.clientWidth);
        setLastFixedWidth(boxSizing === 'border-box' ? sliderRef.current.offsetWidth : sliderRef.current.clientWidth)
      }
    }
  }, [width])

  const currentWidth = width ? width : lastFixedWidth

  const reminderSteps = max % step
  const unitsCount = (max - reminderSteps) / step
  const labelsCount = unitsCount + (reminderSteps ? 2 : 1)
  const labels = [...Array(labelsCount)].map((_, index) => {
    let offset = index * step
    if (reminderSteps && index === labelsCount - 1) {
      offset -= step - reminderSteps
    }

    return {
      offset,
    }
  })

  const [pointerSpring, pointerSpringApi] = useSpring(
    () => ({
      from: { left: 0 },
      // to: { left: 0 },
    }),
    []
  )

  // Use this because inability to call setState from useDrag hook.
  const bind = useGesture({
    onDrag: ({ down, offset }) => {
      const pointerPureOffsetX = offset[0]
      const offsetX = pointerPureOffsetX * max / currentWidth!

      const microStepValue = Math.round(offsetX)
      let newValue = microStepValue
      const endStepIndex = labels.findIndex(({ offset }) => newValue <= offset)

      if (fixToStep) {
        if (endStepIndex !== 0) {
          newValue = Math.abs(
            offsetX - labels[endStepIndex].offset
          ) > Math.abs(
            offsetX - labels[endStepIndex - 1].offset
          )
            ? labels[endStepIndex - 1].offset
            : labels[endStepIndex].offset
        } else {
          newValue = labels[endStepIndex].offset
        }
      }
      const newValueOffsetX = newValue * currentWidth! / max
      const microStepOffsetX = microStepValue * currentWidth! / max

      if (value === undefined) {
        if (!discrete) {
          if (down) {
            pointerSpringApi.start({ left: pointerPureOffsetX })
          } else {
            pointerSpringApi.start({ left: newValueOffsetX, })
          }
        } else {
          if (down) {
            pointerSpringApi.start({
              left: microStepOffsetX,
              immediate: true,
              // onChange: () => onChange(microStepValue, down)
            })
          } else {
            pointerSpringApi.start({ left: newValueOffsetX, immediate: true })
          }
        }
      }

      const finished = !down
      if (down) {
        if (lastChangeValueRef.current !== microStepValue) {
          onChange(microStepValue, finished)
        }
        lastChangeValueRef.current = microStepValue
      } else {
        onChange(newValue, finished)
        setRangeValue(newValue)
        lastChangeValueRef.current = newValue
      }
    }
  }, {
    drag: {
      from: (_) => [pointerSpring.left.get(), 0],
      axis: 'x', bounds: (gestureState) => {
        if (gestureState) {
          const { target } = gestureState
          // const centeringOffset = (target as HTMLElement).offsetHeight / 2
          return {
            left: 0,
            right: sliderRef.current!.clientWidth /* - centeringOffset */
          }
        }
        return { left: 0, right: 0 }
      }
    }
  })

  const prevValue = usePrevValue(value)

  useEffect(() => {
    let newValue: number
    if (value !== undefined) {
      newValue = value
    } else {
      newValue = rangeValue
      if (prevValue !== undefined) {
        setRangeValue(prevValue)
      }
    }
    lastChangeValueRef.current = newValue

    const newValueOffsetX = currentWidth ? newValue * currentWidth / max : 0
    if (!discrete) {
      pointerSpringApi.start({ left: newValueOffsetX })
    } else {
      pointerSpringApi.start({ left: newValueOffsetX, immediate: true })
    }
  }, [rangeValue, value])

  return (
    <div
      className={className ? `${className} ZoomableSlider-Slider` : "ZoomableSlider-Slider"}
      style={{ width: currentWidth }}
      ref={sliderRef}
    >
      <div className="ZoomableSlider-Ruler">
        {labels.map((label, index) => (
          <div
            key={label.offset}
            className="ZoomableSlider-Unit"
            style={{
              left: currentWidth ? label.offset * currentWidth / max : 0,
            }}
          >
            <div className="ZoomableSlider-Label">{mapLabel ? mapLabel(label.offset, index) : null}</div>
          </div>
        ))}
      </div>
      <animated.div
        {...bind()}
        className="ZoomableSlider-PointerContainer"
        style={{
          // left: currentWidth ? rangeValue * currentWidth / max : 0,
          ...pointerSpring,
        }}
      >
        <div className="ZoomableSlider-Pointer Triangle"></div>
      </animated.div>
    </div>
  )
})

export default ZoomableSlider;

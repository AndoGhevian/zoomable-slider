import { animated, useSpring } from '@react-spring/web';
import { useDrag, useGesture } from '@use-gesture/react';
import React, {
  PropsWithRef,
  forwardRef,
  useEffect,
  useRef,
  useLayoutEffect,
  useState,
} from 'react';
import usePrevValue from './hooks/usePrevValue';
import './App.css';

function App() {
  return (
    <div className="App">
      Zoomable Slider
      <div>
        <ZoomableSlider
          step={3}
          max={10}
          // value={85}
          width={700}
          // discrete
          // fixToStep
          onChange={(val, finish) => console.log(val, finish)}
        />
      </div>
    </div>
  );
}

type ZoomableSliderProps = {
  className?: string;
  step: number;
  max: number;
  value?: number; // make this as in two way binding
  discrete?: boolean;
  fixToStep?: boolean;
  /**
   * Need to pass this property when you want to handle resize effects
  */
  width?: number;
  mapLabel?: (...props: any) => any
  onChange?: (value: number, finish: boolean) => void
}

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
    if (value) {
      newValue = value
    } else {
      newValue = rangeValue
      if (value === undefined && prevValue !== undefined) {
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
            <div className="ZoomableSlider-Label">{mapLabel ? mapLabel(label, index) : null}</div>
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

export default App;

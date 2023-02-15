import React, { PropsWithChildren, PropsWithRef, forwardRef, useEffect, useRef, useLayoutEffect, useState } from 'react';
import './App.css';
import usePrevValue from './hooks/usePrevValue';

function App() {
  return (
    <div className="App">
      Zoomable Slider
      <div>
        <ZoomableSlider
          step={10}
          max={100}
          value={85}
        // width={100}
        />
      </div>
    </div>
  );
}

type ZoomableSliderProps = {
  className?: string;
  step: number;
  max: number;
  value: number; // make this as in two way binding
  discrete?: boolean;
  /**
   * Need to pass this property when you want to handle resize effects
  */
  width?: number;
  mapLabel?: (...props: any) => any
  onChange?: (value: number) => void
}

const ZoomableSlider = forwardRef(function ZoomableSlider(props: PropsWithRef<ZoomableSliderProps>, ref: any) {
  const {
    className,
    step,
    max,
    value,
    width,
    mapLabel,
  } = props
  const sliderRef = useRef<HTMLDivElement>(null)
  const prevRef = usePrevValue(ref)
  const [lastFixedWidth, setLastFixedWidth] = useState<number>()

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
      <div
        className="ZoomableSlider-Pointer Triangle"
        style={{
          left: currentWidth ? value * currentWidth / max : 0
        }}
      ></div>
    </div>
  )
})

export default App;

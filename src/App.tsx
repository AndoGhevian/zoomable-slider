import React, { PropsWithChildren, PropsWithRef, forwardRef, useEffect, useRef, useLayoutEffect, useState } from 'react';
import './App.css';
import usePrevValue from './hooks/usePrevValue';

function App() {
  return (
    <div className="App">
      Zoomable Slider
      <div>
        <ZoomableSlider
          unit={10}
          maxValue={100}
        // width={100}
        />
      </div>
    </div>
  );
}

type ZoomableSliderProps = {
  className?: string;
  unit: number;
  maxValue: number;
  /**
   * Need to pass this property when you want to handle resize effects
   */
  width?: number;
  mapLabel?: (...props: any) => any
}

const ZoomableSlider = forwardRef(function ZoomableSlider(props: PropsWithRef<ZoomableSliderProps>, ref: any) {
  const {
    className,
    unit,
    maxValue,
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

  const reminderSteps = maxValue % unit
  const unitsCount = (maxValue - reminderSteps) / unit
  const labelsCount = unitsCount + (reminderSteps ? 2 : 1)
  const labels = [...Array(labelsCount)].map((_, index) => {
    let offset = index * unit
    if(reminderSteps && index === labelsCount - 1) {
      offset -= unit - reminderSteps
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
        {labels.map((value, index) => (
          <div className="ZoomableSlider-Unit"
            style={{
              left: currentWidth ? value.offset * currentWidth / maxValue : 0,
            }}
            key={value.offset}
          >
            <div className="ZoomableSlider-Label">{mapLabel ? mapLabel(value, index) : null}</div>
          </div>
        ))}
      </div>
      <div className="ZoomableSlider-Pointer"></div>
    </div>
  )
})

export default App;

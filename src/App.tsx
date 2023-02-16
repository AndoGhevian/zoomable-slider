import React, { useState } from 'react';
import ZoomableSlider from './ZoomableSlider/ZoomableSlider'
import "./App.css"

function App() {
  const [value, setValue] = useState(0)

  return (
    <div className="App">
      <h1>Zoomable Slider</h1>
      <div className="Example">
        <ZoomableSlider
          step={4}
          max={10}
          value={value}
          onChange={(val, finish) => {
            /**
             * Slider with Two way binding is some other sort of discret slider,
             * because onChange fires only on granular changes
             * but if discrete property is set to false it will change value smoothle
             */
            setValue(val)
            console.log('Controled 1', val, finish)
          }}
        />
      </div>
      <div className="Example">
        <ZoomableSlider
          step={3}
          max={10}
          onChange={(val, finish) => {
            console.log('Uncontroled 1', val, finish)
          }}
        />
      </div>
      <div className="Example">
        <ZoomableSlider
          step={2}
          max={10}
          discrete // Discretization with granularity
          // fixToStep
          onChange={(val, finish) => {
            console.log('Uncontroled 2', val, finish)
          }}
        />
      </div>
      <div className="Example">
        <ZoomableSlider
          step={3}
          max={10}
          discrete // Discretization with granularity
          fixToStep // Fix to Labeld units
          onChange={(val, finish) => {
            console.log('Uncontroled 3', val, finish)
          }}
        />
      </div>
    </div>
  );
}

export default App;

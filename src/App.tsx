import React from 'react';
import ZoomableSlider from './ZoomableSlider/ZoomableSlider'

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

export default App;

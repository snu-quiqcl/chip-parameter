import { TargetSpecs } from '../utils/ionTrapOptimizer';
import * as Slider from '@radix-ui/react-slider';
import { Play } from 'lucide-react';
import './ParameterControls.css';

interface ParameterControlsProps {
  targetSpecs: TargetSpecs;
  onSpecsChange: (specs: TargetSpecs) => void;
  onCalculate: () => void;
  isCalculating: boolean;
}

export function ParameterControls({ 
  targetSpecs, 
  onSpecsChange, 
  onCalculate,
  isCalculating 
}: ParameterControlsProps) {
  const handleChange = (key: keyof TargetSpecs, value: number) => {
    onSpecsChange({
      ...targetSpecs,
      [key]: value
    });
  };

  return (
    <div className="parameter-controls">
      <h2>Target Specifications</h2>
      
      <div className="control-group">
        <label>
          <span>Secular Frequency</span>
          <span className="value">{targetSpecs.secular_freq.toFixed(1)} MHz</span>
        </label>
        <Slider.Root
          className="slider-root"
          value={[targetSpecs.secular_freq]}
          onValueChange={([value]) => handleChange('secular_freq', value)}
          min={0.5}
          max={5}
          step={0.1}
        >
          <Slider.Track className="slider-track">
            <Slider.Range className="slider-range" />
          </Slider.Track>
          <Slider.Thumb className="slider-thumb" />
        </Slider.Root>
      </div>

      <div className="control-group">
        <label>
          <span>Max q-parameter</span>
          <span className="value">{targetSpecs.q_max.toFixed(2)}</span>
        </label>
        <Slider.Root
          className="slider-root"
          value={[targetSpecs.q_max]}
          onValueChange={([value]) => handleChange('q_max', value)}
          min={0.1}
          max={0.5}
          step={0.01}
        >
          <Slider.Track className="slider-track">
            <Slider.Range className="slider-range" />
          </Slider.Track>
          <Slider.Thumb className="slider-thumb" />
        </Slider.Root>
      </div>

      <div className="control-group">
        <label>
          <span>Max RF Voltage</span>
          <span className="value">{targetSpecs.V_rf_max.toFixed(0)} V</span>
        </label>
        <Slider.Root
          className="slider-root"
          value={[targetSpecs.V_rf_max]}
          onValueChange={([value]) => handleChange('V_rf_max', value)}
          min={100}
          max={500}
          step={10}
        >
          <Slider.Track className="slider-track">
            <Slider.Range className="slider-range" />
          </Slider.Track>
          <Slider.Thumb className="slider-thumb" />
        </Slider.Root>
      </div>

      <div className="control-group">
        <label>
          <span>Trap Depth Range</span>
          <span className="value">{targetSpecs.depth_min.toFixed(2)} - {targetSpecs.depth_max.toFixed(2)} eV</span>
        </label>
        <div className="double-slider">
          <Slider.Root
            className="slider-root"
            value={[targetSpecs.depth_min]}
            onValueChange={([value]) => handleChange('depth_min', value)}
            min={0.01}
            max={0.2}
            step={0.01}
          >
            <Slider.Track className="slider-track">
              <Slider.Range className="slider-range" />
            </Slider.Track>
            <Slider.Thumb className="slider-thumb" />
          </Slider.Root>
          
          <Slider.Root
            className="slider-root"
            value={[targetSpecs.depth_max]}
            onValueChange={([value]) => handleChange('depth_max', value)}
            min={0.01}
            max={0.2}
            step={0.01}
          >
            <Slider.Track className="slider-track">
              <Slider.Range className="slider-range" />
            </Slider.Track>
            <Slider.Thumb className="slider-thumb" />
          </Slider.Root>
        </div>
      </div>

      <button 
        className="calculate-button"
        onClick={onCalculate}
        disabled={isCalculating}
      >
        <Play size={20} />
        {isCalculating ? 'Calculating...' : 'Calculate'}
      </button>
    </div>
  );
}
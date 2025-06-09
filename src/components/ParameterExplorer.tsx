import { useState, useEffect } from 'react';
import { IonTrapOptimizer, TargetSpecs } from '../utils/ionTrapOptimizer';
import * as Slider from '@radix-ui/react-slider';
import './ParameterExplorer.css';

interface ParameterExplorerProps {
  optimizer: IonTrapOptimizer;
  targetSpecs: TargetSpecs;
  globalRanges: {
    a: { min: number; max: number };
    b: { min: number; max: number };
    V_rf: { min: number; max: number };
    F_rf: { min: number; max: number };
  };
}

export function ParameterExplorer({ optimizer, targetSpecs, globalRanges }: ParameterExplorerProps) {
  const [a, setA] = useState(50);
  const [b, setB] = useState(80);
  const [V_rf, setV_rf] = useState(200);
  const [F_rf, setF_rf] = useState(20);
  
  // Use global ranges
  const ranges = globalRanges;
  
  const [trapParams, setTrapParams] = useState({
    q: 0,
    depth: 0,
    height: 0,
    secular_freq: 0,
    meets_criteria: false
  });

  useEffect(() => {
    // Ensure b is always greater than a
    if (b <= a) {
      setB(a + 5);
    }
  }, [a, b]);

  useEffect(() => {
    // Calculate trap parameters in real-time
    const q = optimizer.calculateQParameter(a, b, V_rf, F_rf);
    const depth = optimizer.calculateTrapDepth(a, b, V_rf, F_rf);
    const height = optimizer.calculateTrapHeight(a, b);
    const secular_freq = optimizer.calculateSecularFrequency(a, b, V_rf, F_rf);
    
    const meets_criteria = 
      b > a &&
      q <= targetSpecs.q_max &&
      V_rf <= targetSpecs.V_rf_max &&
      depth >= targetSpecs.depth_min &&
      depth <= targetSpecs.depth_max &&
      secular_freq >= targetSpecs.secular_freq;

    setTrapParams({
      q,
      depth,
      height,
      secular_freq,
      meets_criteria
    });
  }, [a, b, V_rf, F_rf, optimizer, targetSpecs]);

  return (
    <div className="parameter-explorer">
      <h2>Parameter Explorer</h2>
      <p>Adjust parameters in real-time to see how trap properties change</p>
      
      <div className="explorer-grid">
        <div className="controls-panel">
          <h3>Input Parameters</h3>
          
          <div className="control-group">
            <label>
              <span>a(center-innerDC)</span>
              <span className="value">{a.toFixed(1)} μm</span>
            </label>
            <Slider.Root
              className="slider-root"
              value={[a]}
              onValueChange={([value]) => setA(value)}
              min={ranges.a.min}
              max={ranges.a.max}
              step={0.5}
            >
              <Slider.Track className="slider-track">
                <Slider.Range className="slider-range" />
              </Slider.Track>
              <Slider.Thumb className="slider-thumb" />
            </Slider.Root>
          </div>

          <div className="control-group">
            <label>
              <span>b(center-RF)</span>
              <span className="value">{b.toFixed(1)} μm</span>
            </label>
            <Slider.Root
              className="slider-root"
              value={[b]}
              onValueChange={([value]) => setB(value)}
              min={Math.max(ranges.b.min, a + 1)}
              max={ranges.b.max}
              step={0.5}
            >
              <Slider.Track className="slider-track">
                <Slider.Range className="slider-range" />
              </Slider.Track>
              <Slider.Thumb className="slider-thumb" />
            </Slider.Root>
          </div>

          <div className="control-group">
            <label>
              <span>V_RF (RF voltage)</span>
              <span className="value">{V_rf.toFixed(0)} V</span>
            </label>
            <Slider.Root
              className="slider-root"
              value={[V_rf]}
              onValueChange={([value]) => setV_rf(value)}
              min={ranges.V_rf.min}
              max={ranges.V_rf.max}
              step={1}
            >
              <Slider.Track className="slider-track">
                <Slider.Range className="slider-range" />
              </Slider.Track>
              <Slider.Thumb className="slider-thumb" />
            </Slider.Root>
          </div>

          <div className="control-group">
            <label>
              <span>F_RF (RF frequency)</span>
              <span className="value">{F_rf.toFixed(1)} MHz</span>
            </label>
            <Slider.Root
              className="slider-root"
              value={[F_rf]}
              onValueChange={([value]) => setF_rf(value)}
              min={ranges.F_rf.min}
              max={ranges.F_rf.max}
              step={0.01}
            >
              <Slider.Track className="slider-track">
                <Slider.Range className="slider-range" />
              </Slider.Track>
              <Slider.Thumb className="slider-thumb" />
            </Slider.Root>
          </div>
        </div>

        <div className="results-panel">
          <h3>Calculated Parameters</h3>
          
          <div className={`param-card ${trapParams.meets_criteria ? 'feasible' : 'infeasible'}`}>
            <div className="param-header">
              <span className="param-status">
                {trapParams.meets_criteria ? '✓ Feasible' : '✗ Infeasible'}
              </span>
            </div>
            
            <div className="param-grid">
              <div className="param-item">
                <span className="param-label">q-parameter</span>
                <span className="param-value">{trapParams.q.toFixed(4)}</span>
                <span className="param-target">
                  (target: ≤ {targetSpecs.q_max})
                </span>
              </div>
              
              <div className="param-item">
                <span className="param-label">Trap Depth</span>
                <span className="param-value">{trapParams.depth.toFixed(4)} eV</span>
                <span className="param-target">
                  (target: {targetSpecs.depth_min.toFixed(2)} - {targetSpecs.depth_max.toFixed(2)} eV)
                </span>
              </div>
              
              <div className="param-item">
                <span className="param-label">Trap Height</span>
                <span className="param-value">{trapParams.height.toFixed(2)} μm</span>
                <span className="param-target">
                  (geometry dependent)
                </span>
              </div>
              
              <div className="param-item">
                <span className="param-label">Secular Frequency</span>
                <span className="param-value">{trapParams.secular_freq.toFixed(3)} MHz</span>
                <span className="param-target">
                  (target: ≥ {targetSpecs.secular_freq.toFixed(1)} MHz)
                </span>
              </div>
            </div>
          </div>
          
          <div className="constraints-summary">
            <h4>Constraint Check</h4>
            <div className="constraint-list">
              <div className={`constraint-item ${b > a ? 'pass' : 'fail'}`}>
                <span>b &gt; a (geometric)</span>
                <span>{b > a ? '✓' : '✗'}</span>
              </div>
              <div className={`constraint-item ${trapParams.q <= targetSpecs.q_max ? 'pass' : 'fail'}`}>
                <span>q ≤ {targetSpecs.q_max}</span>
                <span>{trapParams.q <= targetSpecs.q_max ? '✓' : '✗'}</span>
              </div>
              <div className={`constraint-item ${V_rf <= targetSpecs.V_rf_max ? 'pass' : 'fail'}`}>
                <span>V_RF ≤ {targetSpecs.V_rf_max}V</span>
                <span>{V_rf <= targetSpecs.V_rf_max ? '✓' : '✗'}</span>
              </div>
              <div className={`constraint-item ${trapParams.depth >= targetSpecs.depth_min && trapParams.depth <= targetSpecs.depth_max ? 'pass' : 'fail'}`}>
                <span>Depth in range</span>
                <span>{trapParams.depth >= targetSpecs.depth_min && trapParams.depth <= targetSpecs.depth_max ? '✓' : '✗'}</span>
              </div>
              <div className={`constraint-item ${trapParams.secular_freq >= targetSpecs.secular_freq ? 'pass' : 'fail'}`}>
                <span>Freq ≥ {targetSpecs.secular_freq.toFixed(1)}MHz</span>
                <span>{trapParams.secular_freq >= targetSpecs.secular_freq ? '✓' : '✗'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
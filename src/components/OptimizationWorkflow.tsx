import { useState, useEffect } from 'react';
import { IonTrapOptimizer, TargetSpecs } from '../utils/ionTrapOptimizer';
import * as Slider from '@radix-ui/react-slider';
import './OptimizationWorkflow.css';

interface OptimizationWorkflowProps {
  optimizer: IonTrapOptimizer;
  targetSpecs: TargetSpecs;
  globalRanges: {
    a: { min: number; max: number };
    b: { min: number; max: number };
    V_rf: { min: number; max: number };
    F_rf: { min: number; max: number };
  };
  onTargetSpecsChange: (specs: TargetSpecs) => void;
}

interface ParameterPoint {
  a: number;
  b: number;
  V_rf?: number;
  F_rf?: number;
  q?: number;
  depth?: number;
  secular_freq?: number;
}

export function OptimizationWorkflow({ optimizer, targetSpecs, globalRanges, onTargetSpecsChange }: OptimizationWorkflowProps) {
  // Step 1: Target height selection
  const [targetHeight, setTargetHeight] = useState(80);
  const [heightRange] = useState({ min: 50, max: 150 });
  
  // Step 2: a-b tradeoff for fixed height
  const [abTradeoff, setABTradeoff] = useState<ParameterPoint[]>([]);
  const [abIndex, setAbIndex] = useState(0);
  const [selectedAB, setSelectedAB] = useState<{ a: number; b: number } | null>(null);
  
  // Step 3: Parameter fixing mode
  const [fixingMode, setFixingMode] = useState<'q' | 'V_rf' | 'F_rf' | null>(null);
  const [fixedValue, setFixedValue] = useState(0.2);
  
  // Step 4: Parameter sweep results
  const [sweepResults, setSweepResults] = useState<ParameterPoint[]>([]);
  const [showOnlyFeasible, setShowOnlyFeasible] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Calculate a-b tradeoff for current target height
  useEffect(() => {
    const points: ParameterPoint[] = [];
    
    // For fixed height h = slot_correction_factor * sqrt(a*b), we have b = (h/slot_correction_factor)²/a
    const corrected_h_squared = (targetHeight / optimizer.slot_correction_factor) ** 2;
    
    for (let a = 20; a <= 100; a += 0.1) {
      const b = corrected_h_squared / a;
      if (b > a + 5 && b <= 200) { // Ensure b > a constraint and reasonable bounds
        points.push({ a, b });
      }
    }
    
    setABTradeoff(points);
    
    // Reset index if out of bounds
    if (abIndex >= points.length) {
      setAbIndex(0);
    }
    
    // Set selected point based on current index
    if (points.length > 0) {
      const validIndex = Math.min(abIndex, points.length - 1);
      setSelectedAB(points[validIndex]);
    }
  }, [targetHeight, abIndex, optimizer.slot_correction_factor]);
  
  // Manual parameter sweep calculation
  const calculateParameterSweep = async () => {
    if (!selectedAB || !fixingMode) {
      setSweepResults([]);
      return;
    }
    
    setIsCalculating(true);
    
    // Use setTimeout to allow UI to update
    setTimeout(() => {
      const { a, b } = selectedAB;
      const points: ParameterPoint[] = [];
      
      if (fixingMode === 'q') {
        // Fix q-parameter, sweep V_rf and F_rf
        for (let V_rf = globalRanges.V_rf.min; V_rf <= globalRanges.V_rf.max; V_rf += 1) {
          for (let F_rf = globalRanges.F_rf.min; F_rf <= globalRanges.F_rf.max; F_rf += 0.05) {
            const q = optimizer.calculateQParameter(a, b, V_rf, F_rf);
            if (Math.abs(q - fixedValue) < 0.001) { // Close to fixed value
              const depth = optimizer.calculateTrapDepth(a, b, V_rf, F_rf);
              const secular_freq = optimizer.calculateSecularFrequency(a, b, V_rf, F_rf);
              points.push({ a, b, V_rf, F_rf, q, depth, secular_freq });
            }
          }
        }
      } else if (fixingMode === 'V_rf') {
        // Fix V_rf, sweep F_rf
        const V_rf = fixedValue;
        for (let F_rf = globalRanges.F_rf.min; F_rf <= globalRanges.F_rf.max; F_rf += 0.05) {
          const q = optimizer.calculateQParameter(a, b, V_rf, F_rf);
          const depth = optimizer.calculateTrapDepth(a, b, V_rf, F_rf);
          const secular_freq = optimizer.calculateSecularFrequency(a, b, V_rf, F_rf);
          points.push({ a, b, V_rf, F_rf, q, depth, secular_freq });
        }
      } else if (fixingMode === 'F_rf') {
        // Fix F_rf, sweep V_rf
        const F_rf = fixedValue;
        for (let V_rf = globalRanges.V_rf.min; V_rf <= globalRanges.V_rf.max; V_rf += 1) {
          const q = optimizer.calculateQParameter(a, b, V_rf, F_rf);
          const depth = optimizer.calculateTrapDepth(a, b, V_rf, F_rf);
          const secular_freq = optimizer.calculateSecularFrequency(a, b, V_rf, F_rf);
          points.push({ a, b, V_rf, F_rf, q, depth, secular_freq });
        }
      }
      
      setSweepResults(points);
      setIsCalculating(false);
    }, 100);
  };

  return (
    <div className="optimization-workflow">
      <div className="workflow-3column">
        {/* Column 1: Steps 1-3 */}
        <div className="workflow-column column-1">
          <h2>Optimization Steps</h2>
          
          {/* Target Specifications */}
          <div className="target-specifications">
            <h3>Target Specifications</h3>
            <div className="specs-grid">
              <div className="spec-item">
                <label>q-parameter must be lower than</label>
                <input
                  type="number"
                  value={targetSpecs.q_max}
                  onChange={(e) => onTargetSpecsChange({...targetSpecs, q_max: Number(e.target.value)})}
                  step="0.01"
                  min="0.1"
                  max="0.5"
                />
              </div>
              <div className="spec-item">
                <label>RF voltage must be lower than (V)</label>
                <input
                  type="number"
                  value={targetSpecs.V_rf_max}
                  onChange={(e) => onTargetSpecsChange({...targetSpecs, V_rf_max: Number(e.target.value)})}
                  step="10"
                  min="100"
                  max="1000"
                />
              </div>
              <div className="spec-item">
                <label>Trap depth must be higher than (eV)</label>
                <input
                  type="number"
                  value={targetSpecs.depth_min}
                  onChange={(e) => onTargetSpecsChange({...targetSpecs, depth_min: Number(e.target.value)})}
                  step="0.01"
                  min="0.01"
                  max="0.5"
                />
              </div>
              <div className="spec-item">
                <label>Trap depth must be lower than (eV)</label>
                <input
                  type="number"
                  value={targetSpecs.depth_max}
                  onChange={(e) => onTargetSpecsChange({...targetSpecs, depth_max: Number(e.target.value)})}
                  step="0.01"
                  min="0.01"
                  max="0.5"
                />
              </div>
              <div className="spec-item">
                <label>Secular frequency must be higher than (MHz)</label>
                <input
                  type="number"
                  value={targetSpecs.secular_freq}
                  onChange={(e) => onTargetSpecsChange({...targetSpecs, secular_freq: Number(e.target.value)})}
                  step="0.1"
                  min="0.5"
                  max="5"
                />
              </div>
            </div>
          </div>
          
          {/* Step 1: Target Height */}
          <div className="workflow-step">
            <h3>Step 1: Set Target Height</h3>
            <div className="height-control">
              <label>
                <span>Target Height: {targetHeight.toFixed(1)} μm</span>
                <span className="constraint-note">
                  (h = Slot Correction Factor*√(a×b))
                </span>
              </label>
              <Slider.Root
                className="slider-root"
                value={[targetHeight]}
                onValueChange={([value]) => setTargetHeight(value)}
                min={heightRange.min}
                max={heightRange.max}
                step={1}
              >
                <Slider.Track className="slider-track">
                  <Slider.Range className="slider-range" />
                </Slider.Track>
                <Slider.Thumb className="slider-thumb" />
              </Slider.Root>
            </div>
          </div>

          {/* Step 2: a-b Tradeoff */}
          <div className="workflow-step">
            <h3>Step 2: Choose a-b Combination</h3>
            <div className="ab-tradeoff-section">
              <div className="ab-plot">
                <h4>a-b Tradeoff (Fixed Height = {targetHeight.toFixed(1)} μm)</h4>
                <div className="plot-area">
                  <svg width="350" height="250" viewBox="0 0 350 250">
                    {/* Grid lines */}
                    <defs>
                      <pattern id="grid" width="35" height="25" patternUnits="userSpaceOnUse">
                        <path d="M 35 0 L 0 0 0 25" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                      </pattern>
                    </defs>
                    <rect width="350" height="250" fill="url(#grid)" />
                    
                    {/* Axes */}
                    <line x1="40" y1="200" x2="310" y2="200" stroke="#374151" strokeWidth="2"/>
                    <line x1="40" y1="200" x2="40" y2="40" stroke="#374151" strokeWidth="2"/>
                    
                    {/* Axis labels */}
                    <text x="175" y="230" textAnchor="middle" className="axis-label">a(center-innerDC) (μm)</text>
                    <text x="15" y="120" textAnchor="middle" className="axis-label" transform="rotate(-90 15 120)">b(center-RF) (μm)</text>
                    
                    {/* Plot curve */}
                    {abTradeoff.length > 1 && (
                      <path
                        d={abTradeoff.map((point, i) => {
                          const x = 40 + (point.a - 20) * 270 / 80;
                          const y = 200 - (point.b - 50) * 160 / 150;
                          return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
                        }).join(' ')}
                        stroke="#3b82f6"
                        strokeWidth="2"
                        fill="none"
                      />
                    )}
                    
                    {/* Selected point */}
                    {selectedAB && (
                      <circle
                        cx={40 + (selectedAB.a - 20) * 270 / 80}
                        cy={200 - (selectedAB.b - 50) * 160 / 150}
                        r={5}
                        fill="#dc2626"
                        stroke="#991b1b"
                        strokeWidth="2"
                      />
                    )}
                  </svg>
                </div>
                
                {/* a-b selection slider */}
                <div className="ab-slider-control">
                  <label>
                    <span>Select a-b combination ({abIndex + 1} of {abTradeoff.length})</span>
                  </label>
                  <Slider.Root
                    className="slider-root"
                    value={[abIndex]}
                    onValueChange={([value]) => setAbIndex(value)}
                    min={0}
                    max={Math.max(0, abTradeoff.length - 1)}
                    step={1}
                  >
                    <Slider.Track className="slider-track">
                      <Slider.Range className="slider-range" />
                    </Slider.Track>
                    <Slider.Thumb className="slider-thumb" />
                  </Slider.Root>
                </div>
              </div>
              
              {selectedAB && (
                <div className="ab-selection-info">
                  <h4>Selected Geometry</h4>
                  <div className="geometry-params">
                    <div className="param-row">
                      <span>a(center-innerDC):</span>
                      <span>{selectedAB.a.toFixed(1)} μm</span>
                    </div>
                    <div className="param-row">
                      <span>b(center-RF):</span>
                      <span>{selectedAB.b.toFixed(1)} μm</span>
                    </div>
                    <div className="param-row">
                      <span>Height:</span>
                      <span>{optimizer.calculateTrapHeight(selectedAB.a, selectedAB.b).toFixed(1)} μm</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Parameter Fixing */}
          {selectedAB && (
            <div className="workflow-step">
              <h3>Step 3: Fix One Parameter</h3>
              <div className="fixing-controls">
                <div className="fixing-mode-selector">
                  <label>
                    <input
                      type="radio"
                      name="fixingMode"
                      checked={fixingMode === 'q'}
                      onChange={() => setFixingMode('q')}
                    />
                    Fix q-parameter
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="fixingMode"
                      checked={fixingMode === 'V_rf'}
                      onChange={() => setFixingMode('V_rf')}
                    />
                    Fix V_RF
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="fixingMode"
                      checked={fixingMode === 'F_rf'}
                      onChange={() => setFixingMode('F_rf')}
                    />
                    Fix F_RF
                  </label>
                </div>
                
                {fixingMode && (
                  <div className="fixed-value-control">
                    <label>
                      Fixed value ({
                        fixingMode === 'q' ? '' : 
                        fixingMode === 'V_rf' ? 'V' : 'MHz'
                      })
                    </label>
                    <input
                      type="number"
                      value={fixedValue}
                      onChange={(e) => setFixedValue(Number(e.target.value))}
                      min={fixingMode === 'q' ? 0.05 : fixingMode === 'V_rf' ? globalRanges.V_rf.min : globalRanges.F_rf.min}
                      max={fixingMode === 'q' ? 0.5 : fixingMode === 'V_rf' ? globalRanges.V_rf.max : globalRanges.F_rf.max}
                      step={fixingMode === 'q' ? 0.001 : fixingMode === 'V_rf' ? 1 : 0.01}
                      className="fixed-value-input"
                    />
                    <button 
                      onClick={calculateParameterSweep}
                      className="calculate-button"
                      disabled={isCalculating}
                    >
                      {isCalculating ? 'Calculating...' : 'Calculate Parameter Sweep'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Column 2: Step 4 */}
        <div className="workflow-column column-2">
          {(sweepResults.length > 0 || isCalculating) && (
            <div className="workflow-step">
              <h3>Step 4: Parameter Relationships</h3>
              <div className="sweep-results">
                <div className="results-plot">
                  <h4>
                    {fixingMode === 'q' ? 'V_RF vs F_RF (Fixed q=' + fixedValue.toFixed(3) + ')' :
                     fixingMode === 'V_rf' ? 'Parameter vs F_RF (Fixed V_RF=' + fixedValue.toFixed(0) + 'V)' :
                     'Parameter vs V_RF (Fixed F_RF=' + fixedValue.toFixed(2) + 'MHz)'}
                  </h4>
                  
                  {fixingMode === 'q' && (
                    <div className="dual-plot">
                      <h5>V_RF vs F_RF Relationship</h5>
                      <svg width="450" height="300" viewBox="0 0 450 300">
                        {/* Grid lines */}
                        <defs>
                          <pattern id="grid-vrf-frf" width="45" height="30" patternUnits="userSpaceOnUse">
                            <path d="M 45 0 L 0 0 0 30" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                          </pattern>
                        </defs>
                        <rect width="450" height="300" fill="url(#grid-vrf-frf)" />
                        
                        {/* Axes */}
                        <line x1="50" y1="240" x2="400" y2="240" stroke="#374151" strokeWidth="2"/>
                        <line x1="50" y1="240" x2="50" y2="50" stroke="#374151" strokeWidth="2"/>
                        
                        {/* Axis labels */}
                        <text x="225" y="270" textAnchor="middle" className="axis-label" fontSize="12">F_RF (MHz)</text>
                        <text x="20" y="145" textAnchor="middle" className="axis-label" fontSize="12" transform="rotate(-90 20 145)">V_RF (V)</text>
                        
                        {/* Data points */}
                        {sweepResults.map((point, i) => {
                          if (!point.V_rf || !point.F_rf) return null;
                          const x = 50 + (point.F_rf - globalRanges.F_rf.min) * 350 / (globalRanges.F_rf.max - globalRanges.F_rf.min);
                          const y = 240 - (point.V_rf - globalRanges.V_rf.min) * 190 / (globalRanges.V_rf.max - globalRanges.V_rf.min);
                          
                          const feasible = 
                            (point.q || 0) <= targetSpecs.q_max &&
                            (point.V_rf || 0) <= targetSpecs.V_rf_max &&
                            (point.depth || 0) >= targetSpecs.depth_min &&
                            (point.depth || 0) <= targetSpecs.depth_max;
                          
                          return (
                            <circle
                              key={i}
                              cx={x}
                              cy={y}
                              r={3}
                              fill={feasible ? "#16a34a" : "#dc2626"}
                              stroke={feasible ? "#15803d" : "#991b1b"}
                              strokeWidth="1"
                            />
                          );
                        })}
                      </svg>
                    </div>
                  )}
                  
                  <div className="parameter-plots">
                    <div className="plot-container">
                      <h5>Trap Depth vs {fixingMode === 'V_rf' ? 'F_RF' : fixingMode === 'F_rf' ? 'V_RF' : 'V_RF-F_RF Points'}</h5>
                      <svg width="350" height="200" viewBox="0 0 350 200">
                        {/* Grid */}
                        <defs>
                          <pattern id="grid-depth" width="35" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 35 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                          </pattern>
                        </defs>
                        <rect width="350" height="200" fill="url(#grid-depth)" />
                        
                        {/* Axes */}
                        <line x1="40" y1="160" x2="310" y2="160" stroke="#374151" strokeWidth="2"/>
                        <line x1="40" y1="160" x2="40" y2="40" stroke="#374151" strokeWidth="2"/>
                        
                        {/* Axis labels */}
                        <text x="175" y="185" textAnchor="middle" className="axis-label" fontSize="10">
                          {fixingMode === 'V_rf' ? 'F_RF (MHz)' : fixingMode === 'F_rf' ? 'V_RF (V)' : 'Point Index'}
                        </text>
                        <text x="15" y="100" textAnchor="middle" className="axis-label" fontSize="10" transform="rotate(-90 15 100)">Depth (eV)</text>
                        
                        {/* Data points and line */}
                        {sweepResults.length > 1 && (
                          <>
                            <path
                              d={sweepResults.map((point, i) => {
                                if (!point.depth) return '';
                                const x = 40 + i * 270 / (sweepResults.length - 1);
                                const maxDepth = Math.max(...sweepResults.map(p => p.depth || 0));
                                const minDepth = Math.min(...sweepResults.map(p => p.depth || 0));
                                const y = 160 - (point.depth - minDepth) / (maxDepth - minDepth) * 120;
                                return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
                              }).join(' ')}
                              stroke="#dc2626"
                              strokeWidth="2"
                              fill="none"
                            />
                            
                            {sweepResults.map((point, i) => {
                              if (!point.depth) return null;
                              const x = 40 + i * 270 / (sweepResults.length - 1);
                              const maxDepth = Math.max(...sweepResults.map(p => p.depth || 0));
                              const minDepth = Math.min(...sweepResults.map(p => p.depth || 0));
                              const y = 160 - (point.depth - minDepth) / (maxDepth - minDepth) * 120;
                              
                              const feasible = 
                                (point.q || 0) <= targetSpecs.q_max &&
                                (point.V_rf || 0) <= targetSpecs.V_rf_max &&
                                (point.depth || 0) >= targetSpecs.depth_min &&
                                (point.depth || 0) <= targetSpecs.depth_max;
                              
                              return (
                                <circle
                                  key={i}
                                  cx={x}
                                  cy={y}
                                  r={2}
                                  fill={feasible ? "#16a34a" : "#dc2626"}
                                  stroke={feasible ? "#15803d" : "#991b1b"}
                                  strokeWidth="1"
                                />
                              );
                            })}
                          </>
                        )}
                      </svg>
                    </div>
                    
                    <div className="plot-container">
                      <h5>Secular Frequency vs {fixingMode === 'V_rf' ? 'F_RF' : fixingMode === 'F_rf' ? 'V_RF' : 'V_RF-F_RF Points'}</h5>
                      <svg width="350" height="200" viewBox="0 0 350 200">
                        {/* Grid */}
                        <rect width="350" height="200" fill="url(#grid-depth)" />
                        
                        {/* Axes */}
                        <line x1="40" y1="160" x2="310" y2="160" stroke="#374151" strokeWidth="2"/>
                        <line x1="40" y1="160" x2="40" y2="40" stroke="#374151" strokeWidth="2"/>
                        
                        {/* Axis labels */}
                        <text x="175" y="185" textAnchor="middle" className="axis-label" fontSize="10">
                          {fixingMode === 'V_rf' ? 'F_RF (MHz)' : fixingMode === 'F_rf' ? 'V_RF (V)' : 'Point Index'}
                        </text>
                        <text x="15" y="100" textAnchor="middle" className="axis-label" fontSize="10" transform="rotate(-90 15 100)">Sec. Freq (MHz)</text>
                        
                        {/* Data points and line */}
                        {sweepResults.length > 1 && (
                          <>
                            <path
                              d={sweepResults.map((point, i) => {
                                if (!point.secular_freq) return '';
                                const x = 40 + i * 270 / (sweepResults.length - 1);
                                const maxFreq = Math.max(...sweepResults.map(p => p.secular_freq || 0));
                                const minFreq = Math.min(...sweepResults.map(p => p.secular_freq || 0));
                                const y = 160 - (point.secular_freq - minFreq) / (maxFreq - minFreq) * 120;
                                return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
                              }).join(' ')}
                              stroke="#059669"
                              strokeWidth="2"
                              fill="none"
                            />
                            
                            {sweepResults.map((point, i) => {
                              if (!point.secular_freq) return null;
                              const x = 40 + i * 270 / (sweepResults.length - 1);
                              const maxFreq = Math.max(...sweepResults.map(p => p.secular_freq || 0));
                              const minFreq = Math.min(...sweepResults.map(p => p.secular_freq || 0));
                              const y = 160 - (point.secular_freq - minFreq) / (maxFreq - minFreq) * 120;
                              
                              const feasible = 
                                (point.q || 0) <= targetSpecs.q_max &&
                                (point.V_rf || 0) <= targetSpecs.V_rf_max &&
                                (point.depth || 0) >= targetSpecs.depth_min &&
                                (point.depth || 0) <= targetSpecs.depth_max;
                              
                              return (
                                <circle
                                  key={i}
                                  cx={x}
                                  cy={y}
                                  r={2}
                                  fill={feasible ? "#16a34a" : "#059669"}
                                  stroke={feasible ? "#15803d" : "#047857"}
                                  strokeWidth="1"
                                />
                              );
                            })}
                          </>
                        )}
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="results-table">
                  <div className="results-header">
                    <h4>Sample Results</h4>
                    <label className="filter-checkbox">
                      <input 
                        type="checkbox" 
                        checked={showOnlyFeasible}
                        onChange={(e) => setShowOnlyFeasible(e.target.checked)}
                      />
                      Show only feasible results
                    </label>
                  </div>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          {fixingMode !== 'V_rf' && <th>V_RF (V)</th>}
                          {fixingMode !== 'F_rf' && <th>F_RF (MHz)</th>}
                          {fixingMode !== 'q' && <th>q-param</th>}
                          <th>Depth (eV)</th>
                          <th>Sec. Freq (MHz)</th>
                          <th>Feasible</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isCalculating ? (
                          <tr>
                            <td colSpan={6} className="loading-cell">
                              <div className="loading-indicator">
                                <div className="loading-spinner"></div>
                                Calculating parameter sweep...
                              </div>
                            </td>
                          </tr>
                        ) : (() => {
                          const filteredResults = showOnlyFeasible 
                            ? sweepResults.filter(point => {
                                return (point.q || 0) <= targetSpecs.q_max &&
                                       (point.V_rf || 0) <= targetSpecs.V_rf_max &&
                                       (point.depth || 0) >= targetSpecs.depth_min &&
                                       (point.depth || 0) <= targetSpecs.depth_max;
                              })
                            : sweepResults;
                          
                          return filteredResults.map((point, i) => {
                          const feasible = 
                            (point.q || 0) <= targetSpecs.q_max &&
                            (point.V_rf || 0) <= targetSpecs.V_rf_max &&
                            (point.depth || 0) >= targetSpecs.depth_min &&
                            (point.depth || 0) <= targetSpecs.depth_max;
                          
                          return (
                            <tr key={i} className={feasible ? 'feasible-row' : 'infeasible-row'}>
                              {fixingMode !== 'V_rf' && <td>{point.V_rf?.toFixed(0)}</td>}
                              {fixingMode !== 'F_rf' && <td>{point.F_rf?.toFixed(2)}</td>}
                              {fixingMode !== 'q' && <td>{point.q?.toFixed(3)}</td>}
                              <td>{point.depth?.toFixed(4)}</td>
                              <td>{point.secular_freq?.toFixed(3)}</td>
                              <td>{feasible ? '✓' : '✗'}</td>
                            </tr>
                          );
                        });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
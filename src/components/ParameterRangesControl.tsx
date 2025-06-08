import { useState, useEffect } from 'react';
import './ParameterRangesControl.css';

interface ParameterRangesControlProps {
  globalRanges: {
    a: { min: number; max: number };
    b: { min: number; max: number };
    V_rf: { min: number; max: number };
    F_rf: { min: number; max: number };
  };
  onRangesChange: (ranges: {
    a: { min: number; max: number };
    b: { min: number; max: number };
    V_rf: { min: number; max: number };
    F_rf: { min: number; max: number };
  }) => void;
}

export function ParameterRangesControl({ globalRanges, onRangesChange }: ParameterRangesControlProps) {
  const [tempRanges, setTempRanges] = useState(globalRanges);
  
  // Sync tempRanges when globalRanges changes
  useEffect(() => {
    setTempRanges(globalRanges);
  }, [globalRanges]);

  const applyRanges = () => {
    // Validate and fix ranges before applying
    const fixedRanges = {
      a: {
        min: Math.max(5, tempRanges.a.min),
        max: Math.max(tempRanges.a.min + 5, Math.min(150, tempRanges.a.max))
      },
      b: {
        min: Math.max(20, tempRanges.b.min),
        max: Math.max(tempRanges.b.min + 10, Math.min(300, tempRanges.b.max))
      },
      V_rf: {
        min: Math.max(10, tempRanges.V_rf.min),
        max: Math.max(tempRanges.V_rf.min + 20, Math.min(1000, tempRanges.V_rf.max))
      },
      F_rf: {
        min: Math.max(1, tempRanges.F_rf.min),
        max: Math.max(tempRanges.F_rf.min + 2, Math.min(100, tempRanges.F_rf.max))
      }
    };
    
    onRangesChange(fixedRanges);
    setTempRanges(fixedRanges);
  };

  const resetRanges = () => {
    const defaultRanges = {
      a: { min: 30, max: 80 },
      b: { min: 70, max: 200 },
      V_rf: { min: 100, max: 400 },
      F_rf: { min: 10, max: 40 }
    };
    setTempRanges(defaultRanges);
  };

  return (
    <div className="parameter-ranges-control">
      <h3>Parameter Ranges</h3>
      <p>Global ranges for all calculations</p>
      
      <div className="ranges-grid">
        <div className="range-group">
          <label className="range-label">a (μm)</label>
          <div className="range-inputs">
            <input
              type="number"
              className="range-input"
              value={tempRanges.a.min}
              onChange={(e) => {
                const value = Number(e.target.value);
                setTempRanges(prev => ({ ...prev, a: { ...prev.a, min: value } }));
              }}
              step={1}
              placeholder="Min"
            />
            <span className="range-separator">-</span>
            <input
              type="number"
              className="range-input"
              value={tempRanges.a.max}
              onChange={(e) => {
                const value = Number(e.target.value);
                setTempRanges(prev => ({ ...prev, a: { ...prev.a, max: value } }));
              }}
              step={1}
              placeholder="Max"
            />
          </div>
        </div>

        <div className="range-group">
          <label className="range-label">b (μm)</label>
          <div className="range-inputs">
            <input
              type="number"
              className="range-input"
              value={tempRanges.b.min}
              onChange={(e) => {
                const value = Number(e.target.value);
                setTempRanges(prev => ({ ...prev, b: { ...prev.b, min: value } }));
              }}
              step={1}
              placeholder="Min"
            />
            <span className="range-separator">-</span>
            <input
              type="number"
              className="range-input"
              value={tempRanges.b.max}
              onChange={(e) => {
                const value = Number(e.target.value);
                setTempRanges(prev => ({ ...prev, b: { ...prev.b, max: value } }));
              }}
              step={1}
              placeholder="Max"
            />
          </div>
        </div>

        <div className="range-group">
          <label className="range-label">V_RF (V)</label>
          <div className="range-inputs">
            <input
              type="number"
              className="range-input"
              value={tempRanges.V_rf.min}
              onChange={(e) => {
                const value = Number(e.target.value);
                setTempRanges(prev => ({ ...prev, V_rf: { ...prev.V_rf, min: value } }));
              }}
              step={5}
              placeholder="Min"
            />
            <span className="range-separator">-</span>
            <input
              type="number"
              className="range-input"
              value={tempRanges.V_rf.max}
              onChange={(e) => {
                const value = Number(e.target.value);
                setTempRanges(prev => ({ ...prev, V_rf: { ...prev.V_rf, max: value } }));
              }}
              step={5}
              placeholder="Max"
            />
          </div>
        </div>

        <div className="range-group">
          <label className="range-label">F_RF (MHz)</label>
          <div className="range-inputs">
            <input
              type="number"
              className="range-input"
              value={tempRanges.F_rf.min}
              onChange={(e) => {
                const value = Number(e.target.value);
                setTempRanges(prev => ({ ...prev, F_rf: { ...prev.F_rf, min: value } }));
              }}
              step={0.5}
              placeholder="Min"
            />
            <span className="range-separator">-</span>
            <input
              type="number"
              className="range-input"
              value={tempRanges.F_rf.max}
              onChange={(e) => {
                const value = Number(e.target.value);
                setTempRanges(prev => ({ ...prev, F_rf: { ...prev.F_rf, max: value } }));
              }}
              step={0.5}
              placeholder="Max"
            />
          </div>
        </div>
      </div>
      
      <div className="ranges-buttons">
        <button 
          className="reset-ranges-button"
          onClick={resetRanges}
        >
          Reset
        </button>
        <button 
          className="apply-ranges-button"
          onClick={applyRanges}
        >
          Apply Ranges
        </button>
      </div>
    </div>
  );
}
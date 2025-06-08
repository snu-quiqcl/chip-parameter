import { useState } from 'react';
import { IonTrapOptimizer } from '../utils/ionTrapOptimizer';
import './SlotCorrectionControl.css';

interface SlotCorrectionControlProps {
  optimizer: IonTrapOptimizer;
  onFactorChange: () => void; // Callback to trigger recalculation
}

export function SlotCorrectionControl({ optimizer, onFactorChange }: SlotCorrectionControlProps) {
  const [tempFactor, setTempFactor] = useState(optimizer.slot_correction_factor);

  const applyFactor = () => {
    // Validate and clamp the factor between 0.5 and 1.5
    const clampedFactor = Math.max(0.5, Math.min(1.5, tempFactor));
    optimizer.slot_correction_factor = clampedFactor;
    setTempFactor(clampedFactor);
    onFactorChange(); // Trigger recalculation
  };

  const resetToDefault = () => {
    setTempFactor(0.95);
  };

  return (
    <div className="slot-correction-control">
      <h3>Slot Correction Factor</h3>
      <p>Heuristic correction for slot geometry (0.5 - 1.5)</p>
      
      <div className="correction-input-group">
        <label className="correction-label">
          <span>Correction Factor</span>
          <span className="current-value">Current: {optimizer.slot_correction_factor.toFixed(3)}</span>
        </label>
        
        <div className="correction-controls">
          <input
            type="number"
            className="correction-input"
            value={tempFactor}
            onChange={(e) => setTempFactor(Number(e.target.value))}
            min={0.5}
            max={1.5}
            step={0.01}
            placeholder="0.950"
          />
          
          <div className="correction-buttons">
            <button 
              className="reset-button"
              onClick={resetToDefault}
            >
              Reset to 0.95
            </button>
            <button 
              className="apply-correction-button"
              onClick={applyFactor}
            >
              Apply
            </button>
          </div>
        </div>
      </div>
      
      <div className="correction-info">
        <div className="info-item">
          <span className="info-label">Default (0.95):</span>
          <span className="info-desc">Standard slot correction</span>
        </div>
        <div className="info-item">
          <span className="info-label">Range:</span>
          <span className="info-desc">0.5 (deep slots) - 1.5 (no slots)</span>
        </div>
        <div className="info-item">
          <span className="info-label">Effect:</span>
          <span className="info-desc">Lower values reduce calculated trap height</span>
        </div>
      </div>
    </div>
  );
}
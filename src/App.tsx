import { useState } from 'react';
import { IonTrapOptimizer, TargetSpecs } from './utils/ionTrapOptimizer';
import { ParameterExplorer } from './components/ParameterExplorer';
import { OptimizationWorkflow } from './components/OptimizationWorkflow';
import { SlotCorrectionControl } from './components/SlotCorrectionControl';
import { ParameterRangesControl } from './components/ParameterRangesControl';
import './App.css';

function App() {
  const [optimizer] = useState(() => new IonTrapOptimizer());
  const [targetSpecs, setTargetSpecs] = useState<TargetSpecs>(optimizer.target_specs);
  const [correctionUpdateKey, setCorrectionUpdateKey] = useState(0);
  
  // Global parameter ranges
  const [globalRanges, setGlobalRanges] = useState({
    a: { min: 30, max: 80 },
    b: { min: 70, max: 200 },
    V_rf: { min: 100, max: 400 },
    F_rf: { min: 10, max: 40 }
  });

  const handleCorrectionFactorChange = () => {
    // Force ParameterExplorer to recalculate by updating key
    setCorrectionUpdateKey(prev => prev + 1);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-main">
          <div className="header-text">
            <h1>Ion Trap Parameter Optimizer</h1>
            <p>Interactive tool for optimizing ion trap parameters</p>
          </div>
          <div className="header-controls">
            <SlotCorrectionControl 
              optimizer={optimizer} 
              onFactorChange={handleCorrectionFactorChange}
            />
            <ParameterRangesControl 
              globalRanges={globalRanges}
              onRangesChange={setGlobalRanges}
            />
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="main-layout">
          <div className="workflow-section">
            <OptimizationWorkflow 
              key={`workflow-${correctionUpdateKey}`}
              optimizer={optimizer} 
              targetSpecs={targetSpecs}
              globalRanges={globalRanges}
              onTargetSpecsChange={setTargetSpecs}
            />
          </div>
          
          <div className="explorer-section">
            <ParameterExplorer 
              key={`explorer-${correctionUpdateKey}`}
              optimizer={optimizer} 
              targetSpecs={targetSpecs}
              globalRanges={globalRanges}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
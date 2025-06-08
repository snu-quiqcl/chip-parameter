import { useState } from 'react';
import { IonTrapOptimizer, TargetSpecs } from './utils/ionTrapOptimizer';
import { ParameterControls } from './components/ParameterControls';
import { ParameterExplorer } from './components/ParameterExplorer';
import { SlotCorrectionControl } from './components/SlotCorrectionControl';
import { VisualizationTabs } from './components/VisualizationTabs';
import { ResultsSummary } from './components/ResultsSummary';
import './App.css';

function App() {
  const [optimizer] = useState(() => new IonTrapOptimizer());
  const [targetSpecs, setTargetSpecs] = useState<TargetSpecs>(optimizer.target_specs);
  const [isCalculating, setIsCalculating] = useState(false);
  const [correctionUpdateKey, setCorrectionUpdateKey] = useState(0);
  const [results, setResults] = useState<{
    a70Results: ReturnType<IonTrapOptimizer['analyzeA70Limitations']>;
    smallAResults: ReturnType<IonTrapOptimizer['analyzeParameterSpace']>;
  } | null>(null);

  const handleCalculate = async () => {
    setIsCalculating(true);
    
    // Update optimizer with new target specs
    optimizer.target_specs = targetSpecs;
    
    // Simulate async calculation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const a70Results = optimizer.analyzeA70Limitations();
    const smallAResults = optimizer.analyzeParameterSpace();
    
    setResults({
      a70Results,
      smallAResults
    });
    
    setIsCalculating(false);
  };

  const handleCorrectionFactorChange = () => {
    // Force ParameterExplorer to recalculate by updating key
    setCorrectionUpdateKey(prev => prev + 1);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Ion Trap Parameter Optimizer</h1>
        <p>Interactive tool for optimizing ion trap parameters</p>
      </header>

      <main className="app-main">
        <div className="controls-section">
          <ParameterControls
            targetSpecs={targetSpecs}
            onSpecsChange={setTargetSpecs}
            onCalculate={handleCalculate}
            isCalculating={isCalculating}
          />
          
          <SlotCorrectionControl 
            optimizer={optimizer} 
            onFactorChange={handleCorrectionFactorChange}
          />
          
          <ParameterExplorer 
            key={correctionUpdateKey}
            optimizer={optimizer} 
            targetSpecs={targetSpecs} 
          />
          
          {results && (
            <ResultsSummary
              a70Results={results.a70Results}
              smallAResults={results.smallAResults}
            />
          )}
        </div>

        {results && (
          <div className="visualization-section">
            <VisualizationTabs
              a70Results={results.a70Results}
              smallAResults={results.smallAResults}
              targetSpecs={targetSpecs}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
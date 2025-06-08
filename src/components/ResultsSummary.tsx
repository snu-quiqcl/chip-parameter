import { Solution } from '../utils/ionTrapOptimizer';
import './ResultsSummary.css';

interface ResultsSummaryProps {
  a70Results: Solution[];
  smallAResults: { all_results: Solution[]; feasible_results: Solution[] };
}

export function ResultsSummary({ a70Results, smallAResults }: ResultsSummaryProps) {
  const a70Feasible = a70Results.filter(r => r.meets_criteria).length;
  const smallAFeasible = smallAResults.feasible_results.length;
  
  const bestSolution = smallAResults.feasible_results[0];
  
  return (
    <div className="results-summary">
      <h2>Results Summary</h2>
      
      <div className="summary-stats">
        <div className="stat-card">
          <h3>a = 70 μm</h3>
          <div className="stat-value">{a70Feasible}/{a70Results.length}</div>
          <div className="stat-label">Feasible Solutions</div>
          <div className="stat-percentage">
            {((a70Feasible / a70Results.length) * 100).toFixed(1)}%
          </div>
        </div>
        
        <div className="stat-card">
          <h3>a &lt; 70 μm</h3>
          <div className="stat-value">{smallAFeasible}/{smallAResults.all_results.length}</div>
          <div className="stat-label">Feasible Solutions</div>
          <div className="stat-percentage">
            {((smallAFeasible / smallAResults.all_results.length) * 100).toFixed(1)}%
          </div>
        </div>
      </div>
      
      {bestSolution && (
        <div className="best-solution">
          <h3>Best Solution (Lowest V_rf)</h3>
          <div className="solution-details">
            <div className="detail-row">
              <span>Geometry:</span>
              <span>a={bestSolution.a.toFixed(1)}μm, b={bestSolution.b.toFixed(1)}μm</span>
            </div>
            <div className="detail-row">
              <span>RF Parameters:</span>
              <span>V_rf={bestSolution.V_rf_required.toFixed(0)}V, F_rf={bestSolution.F_rf.toFixed(1)}MHz</span>
            </div>
            <div className="detail-row">
              <span>Performance:</span>
              <span>q={bestSolution.q.toFixed(3)}, depth={bestSolution.depth.toFixed(3)}eV</span>
            </div>
            <div className="detail-row">
              <span>Height:</span>
              <span>{bestSolution.height.toFixed(1)}μm</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
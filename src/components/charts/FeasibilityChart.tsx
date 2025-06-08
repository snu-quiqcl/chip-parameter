import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Solution } from '../../utils/ionTrapOptimizer';

interface FeasibilityChartProps {
  smallAResults: Solution[];
  feasibleResults: Solution[];
}

export function FeasibilityChart({ smallAResults, feasibleResults }: FeasibilityChartProps) {
  // Prepare feasible and infeasible data
  const feasibleData = feasibleResults.map(r => ({
    a: r.a,
    b: r.b,
    V_rf: r.V_rf_required,
    q: r.q,
    depth: r.depth
  }));

  const infeasibleData = smallAResults
    .filter(r => !r.meets_criteria)
    .filter((_, i) => i % 5 === 0) // Sample for performance
    .map(r => ({
      a: r.a,
      b: r.b,
      V_rf: r.V_rf_required,
      q: r.q,
      depth: r.depth
    }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p><strong>a = {data.a.toFixed(1)} μm</strong></p>
          <p><strong>b = {data.b.toFixed(1)} μm</strong></p>
          <p>V_rf = {data.V_rf.toFixed(0)} V</p>
          <p>q = {data.q.toFixed(3)}</p>
          <p>depth = {data.depth.toFixed(3)} eV</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-container">
      <div className="chart-grid">
        <div className="chart-item">
          <h3>Feasibility Map: a vs b Parameter Space</h3>
          <ResponsiveContainer width="100%" height={500}>
            <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                type="number"
                dataKey="a" 
                name="a"
                label={{ value: "a (μm)", position: 'insideBottom', offset: -10 }}
                domain={['dataMin - 2', 'dataMax + 2']}
              />
              <YAxis 
                type="number"
                dataKey="b" 
                name="b"
                label={{ value: "b (μm)", angle: -90, position: 'insideLeft' }}
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Scatter 
                name="Infeasible" 
                data={infeasibleData} 
                fill="#e53e3e"
                fillOpacity={0.3}
                shape="circle"
              />
              <Scatter 
                name="Feasible" 
                data={feasibleData} 
                fill="#48bb78"
                fillOpacity={0.8}
                shape="circle"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-item">
          <h3>V_rf Requirements in 3D Space</h3>
          <ResponsiveContainer width="100%" height={500}>
            <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                type="number"
                dataKey="a" 
                name="a"
                label={{ value: "a (μm)", position: 'insideBottom', offset: -10 }}
                domain={['dataMin - 2', 'dataMax + 2']}
              />
              <YAxis 
                type="number"
                dataKey="V_rf" 
                name="V_rf"
                label={{ value: "V_rf (V)", angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Scatter 
                name="Solutions" 
                data={feasibleData} 
                fill="#667eea"
                fillOpacity={0.8}
                shape="circle"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <style>{`
        .custom-tooltip {
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid #ddd;
          padding: 10px;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .custom-tooltip p {
          margin: 2px 0;
          font-size: 12px;
        }
        .chart-container {
          width: 100%;
        }
        .chart-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }
        .chart-item {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .chart-item h3 {
          margin-bottom: 1rem;
          color: #333;
          font-size: 1.2rem;
        }
        @media (max-width: 1200px) {
          .chart-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (prefers-color-scheme: dark) {
          .chart-item {
            background: #2d2d2d;
          }
          .chart-item h3 {
            color: #e2e8f0;
          }
          .custom-tooltip {
            background: rgba(45, 45, 45, 0.95);
            border-color: #4a5568;
            color: #e2e8f0;
          }
        }
      `}</style>
    </div>
  );
}
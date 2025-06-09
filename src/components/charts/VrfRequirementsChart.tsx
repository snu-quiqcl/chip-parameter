import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from 'recharts';
import { Solution, TargetSpecs } from '../../utils/ionTrapOptimizer';

interface VrfRequirementsChartProps {
  a70Results: Solution[];
  smallAResults: Solution[];
  targetSpecs: TargetSpecs;
}

export function VrfRequirementsChart({ a70Results, smallAResults, targetSpecs }: VrfRequirementsChartProps) {
  // Prepare data for a=70
  const a70Data = a70Results
    .filter((_, i) => i % 10 === 0) // Sample every 10th point for performance
    .map(r => ({
      b: r.b,
      V_rf: r.V_rf_required,
      feasible: r.V_rf_feasible
    }));

  // Prepare data for a<70 (average by a value)
  const smallAGrouped = smallAResults.reduce((acc, r) => {
    if (!acc[r.a]) {
      acc[r.a] = [];
    }
    acc[r.a].push(r.V_rf_required);
    return acc;
  }, {} as Record<number, number[]>);

  const smallAData = Object.entries(smallAGrouped).map(([a, values]) => ({
    a: parseFloat(a),
    V_rf_avg: values.reduce((sum, v) => sum + v, 0) / values.length,
    V_rf_min: Math.min(...values),
    V_rf_max: Math.max(...values)
  })).sort((a, b) => a.a - b.a);

  return (
    <div className="chart-container">
      <div className="chart-grid">
        <div className="chart-item">
          <h3>V_rf Requirements for a = 70 μm</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={a70Data} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="b" 
                label={{ value: "b (μm)", position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                label={{ value: 'Required V_rf (V)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value: number) => `${value.toFixed(1)} V`}
                labelFormatter={(label) => `b = ${label} μm`}
              />
              <Legend />
              <ReferenceLine 
                y={targetSpecs.V_rf_max} 
                label={`V_rf limit (${targetSpecs.V_rf_max}V)`}
                stroke="red" 
                strokeDasharray="5 5" 
              />
              <Line 
                type="monotone" 
                dataKey="V_rf" 
                stroke="#667eea" 
                strokeWidth={2}
                dot={{ fill: '#667eea', r: 3 }}
                name="Required V_rf"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-item">
          <h3>V_rf Requirements for a &lt; 70 μm</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={smallAData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="a" 
                label={{ value: "a (μm)", position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                label={{ value: 'Required V_rf (V)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value: number) => `${value.toFixed(1)} V`}
                labelFormatter={(label) => `a = ${label} μm`}
              />
              <Legend />
              <ReferenceLine 
                y={targetSpecs.V_rf_max} 
                label={`V_rf limit (${targetSpecs.V_rf_max}V)`}
                stroke="red" 
                strokeDasharray="5 5" 
              />
              <Line 
                type="monotone" 
                dataKey="V_rf_avg" 
                stroke="#764ba2" 
                strokeWidth={2}
                dot={{ fill: '#764ba2', r: 3 }}
                name="Average V_rf"
              />
              <Line 
                type="monotone" 
                dataKey="V_rf_min" 
                stroke="#48bb78" 
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
                name="Min V_rf"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from 'recharts';
import { Solution, TargetSpecs } from '../../utils/ionTrapOptimizer';

interface TrapDepthChartProps {
  a70Results: Solution[];
  smallAResults: Solution[];
  targetSpecs: TargetSpecs;
}

export function TrapDepthChart({ a70Results, smallAResults, targetSpecs }: TrapDepthChartProps) {
  // Prepare data for a=70
  const a70Data = a70Results
    .filter((_, i) => i % 10 === 0)
    .map(r => ({
      b: r.b,
      depth: r.depth,
      feasible: r.depth_feasible
    }));

  // Prepare data for a<70
  const smallAGrouped = smallAResults.reduce((acc, r) => {
    if (!acc[r.a]) {
      acc[r.a] = [];
    }
    acc[r.a].push(r.depth);
    return acc;
  }, {} as Record<number, number[]>);

  const smallAData = Object.entries(smallAGrouped).map(([a, values]) => ({
    a: parseFloat(a),
    depth_avg: values.reduce((sum, v) => sum + v, 0) / values.length,
    depth_min: Math.min(...values),
    depth_max: Math.max(...values)
  })).sort((a, b) => a.a - b.a);

  return (
    <div className="chart-container">
      <div className="chart-grid">
        <div className="chart-item">
          <h3>Trap Depth for a = 70 μm</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={a70Data} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="b" 
                label={{ value: "b (μm)", position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                label={{ value: 'Trap Depth (eV)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value: number) => `${value.toFixed(3)} eV`}
                labelFormatter={(label) => `b = ${label} μm`}
              />
              <Legend />
              <ReferenceLine 
                y={targetSpecs.depth_min} 
                stroke="#48bb78"
                strokeWidth={2}
                strokeDasharray="5 5"
                label="Min Target"
              />
              <Line 
                type="monotone" 
                dataKey="depth" 
                stroke="#667eea" 
                strokeWidth={2}
                dot={{ fill: '#667eea', r: 3 }}
                name="Trap Depth"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-item">
          <h3>Trap Depth for a &lt; 70 μm</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={smallAData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="a" 
                label={{ value: "a (μm)", position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                label={{ value: 'Trap Depth (eV)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value: number) => `${value.toFixed(3)} eV`}
                labelFormatter={(label) => `a = ${label} μm`}
              />
              <Legend />
              <ReferenceLine 
                y={targetSpecs.depth_min} 
                stroke="#48bb78"
                strokeWidth={2}
                strokeDasharray="5 5"
                label="Min Target"
              />
              <Line 
                type="monotone" 
                dataKey="depth_avg" 
                stroke="#764ba2" 
                strokeWidth={2}
                dot={{ fill: '#764ba2', r: 3 }}
                name="Average Depth"
              />
              <Line 
                type="monotone" 
                dataKey="depth_min" 
                stroke="#ed8936" 
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
                name="Min Depth"
              />
              <Line 
                type="monotone" 
                dataKey="depth_max" 
                stroke="#ed8936" 
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
                name="Max Depth"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
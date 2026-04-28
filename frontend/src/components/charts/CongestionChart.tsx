import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { congestionData } from '../../data/mockRiskData';

const PORTS = ['Los Angeles', 'Shanghai', 'Rotterdam', 'Singapore'];
const COLORS = ['#ef4444', '#f59e0b', '#22d3ee', '#a78bfa'];

export function CongestionChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={congestionData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false} axisLine={false} interval={3} />
        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ background: 'rgba(15,32,64,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
          labelStyle={{ color: '#94a3b8' }}
          itemStyle={{ color: '#e2e8f0' }}
        />
        <Legend wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }} />
        {PORTS.map((port, i) => (
          <Line
            key={port}
            type="monotone"
            dataKey={port}
            stroke={COLORS[i]}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

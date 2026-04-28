import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip
} from 'recharts';
import { routeEfficiencyData } from '../../data/mockRiskData';

const radarData = routeEfficiencyData.map((d) => ({
  route: d.route.split('-')[0],
  efficiency: d.efficiency,
  volume: d.volume,
}));

export function RouteEfficiencyChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={radarData}>
        <PolarGrid stroke="rgba(255,255,255,0.08)" />
        <PolarAngleAxis dataKey="route" tick={{ fill: '#64748b', fontSize: 10 }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 9 }} />
        <Radar name="Efficiency" dataKey="efficiency" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.15} strokeWidth={2} />
        <Radar name="Volume" dataKey="volume" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.1} strokeWidth={2} />
        <Tooltip
          contentStyle={{ background: 'rgba(15,32,64,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
          labelStyle={{ color: '#94a3b8' }}
          itemStyle={{ color: '#e2e8f0' }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

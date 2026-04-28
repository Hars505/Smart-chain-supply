import { TopBar } from '../components/layout/TopBar';
import { GlassCard } from '../components/ui/GlassCard';
import { RiskTrendChart } from '../components/charts/RiskTrendChart';
import { DelayForecastChart } from '../components/charts/DelayForecastChart';
import { CongestionChart } from '../components/charts/CongestionChart';
import { RouteEfficiencyChart } from '../components/charts/RouteEfficiencyChart';
import { RiskDistributionChart } from '../components/charts/RiskDistributionChart';
import { carrierPerformanceData, routeEfficiencyData } from '../data/mockRiskData';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function CarrierBarChart() {
  const colors = ['#22d3ee', '#10b981', '#f59e0b', '#f97316', '#ef4444'];
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={carrierPerformanceData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="carrier" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ background: 'rgba(15,32,64,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
          labelStyle={{ color: '#94a3b8' }}
          itemStyle={{ color: '#e2e8f0' }}
        />
        <Bar dataKey="on_time" name="On-Time %" radius={[4, 4, 0, 0]}>
          {carrierPerformanceData.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} opacity={0.8} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function RouteVolumeChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={routeEfficiencyData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
        <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis dataKey="route" type="category" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} width={80} />
        <Tooltip
          contentStyle={{ background: 'rgba(15,32,64,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
          labelStyle={{ color: '#94a3b8' }}
          itemStyle={{ color: '#e2e8f0' }}
        />
        <Bar dataKey="volume" name="Shipment Volume" fill="#a78bfa" radius={[0, 4, 4, 0]} opacity={0.8} />
        <Bar dataKey="efficiency" name="Efficiency %" fill="#22d3ee" radius={[0, 4, 4, 0]} opacity={0.8} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Analytics() {
  return (
    <div className="flex flex-col h-full">
      <TopBar title="Analytics" subtitle="Supply chain performance intelligence and forecasting" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Avg Delay Reduction', value: '2.3 days', sub: 'vs Q3 2025', color: 'text-emerald-400' },
            { label: 'Route Optimization', value: '18.4%', sub: 'cost savings', color: 'text-cyan-400' },
            { label: 'Prediction Accuracy', value: '91.2%', sub: 'disruption model', color: 'text-purple-400' },
            { label: 'Carbon Saved', value: '12.8T', sub: 'via rerouting', color: 'text-emerald-400' },
          ].map(({ label, value, sub, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4"
            >
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <GlassCard className="p-4">
            <h3 className="text-sm font-semibold text-white mb-1">Risk & On-Time Trend (30 days)</h3>
            <p className="text-xs text-slate-400 mb-3">Historical performance tracking</p>
            <RiskTrendChart />
          </GlassCard>

          <GlassCard className="p-4">
            <h3 className="text-sm font-semibold text-white mb-1">Delay Forecast (14 days)</h3>
            <p className="text-xs text-slate-400 mb-3">Predictive delay modeling with confidence bands</p>
            <DelayForecastChart />
          </GlassCard>

          <GlassCard className="p-4">
            <h3 className="text-sm font-semibold text-white mb-1">Port Congestion (24hr)</h3>
            <p className="text-xs text-slate-400 mb-3">Real-time congestion index by major port</p>
            <CongestionChart />
          </GlassCard>

          <GlassCard className="p-4">
            <h3 className="text-sm font-semibold text-white mb-1">Carrier On-Time Performance</h3>
            <p className="text-xs text-slate-400 mb-3">Reliability comparison across carriers</p>
            <CarrierBarChart />
          </GlassCard>

          <GlassCard className="p-4">
            <h3 className="text-sm font-semibold text-white mb-1">Route Efficiency Radar</h3>
            <p className="text-xs text-slate-400 mb-3">Efficiency vs volume by shipping lane</p>
            <RouteEfficiencyChart />
          </GlassCard>

          <GlassCard className="p-4">
            <h3 className="text-sm font-semibold text-white mb-1">Risk Distribution</h3>
            <p className="text-xs text-slate-400 mb-3">Fleet-wide risk level breakdown</p>
            <RiskDistributionChart />
          </GlassCard>

          <GlassCard className="p-4 xl:col-span-2">
            <h3 className="text-sm font-semibold text-white mb-1">Route Volume & Efficiency</h3>
            <p className="text-xs text-slate-400 mb-3">Shipment volume and efficiency score by lane</p>
            <RouteVolumeChart />
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

import { Package, AlertTriangle, TrendingUp, Clock, Shield, Activity } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { KPICard } from '../components/ui/KPICard';
import { GlassCard } from '../components/ui/GlassCard';
import { RiskTrendChart } from '../components/charts/RiskTrendChart';
import { RiskDistributionChart } from '../components/charts/RiskDistributionChart';
import { RouteEfficiencyChart } from '../components/charts/RouteEfficiencyChart';
import { ShipmentMap } from '../components/maps/ShipmentMap';
import { RiskBadge } from '../components/ui/RiskBadge';
import { StatusChip } from '../components/ui/StatusChip';
import { useShipmentStore } from '../store/useShipmentStore';
import { motion } from 'framer-motion';
import { carrierPerformanceData } from '../data/mockRiskData';

export function Dashboard() {
  const { kpis, shipments, alerts } = useShipmentStore();

  const topRiskShipments = [...shipments]
    .sort((a, b) => b.risk_score - a.risk_score)
    .slice(0, 5);

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Executive Control Tower"
        subtitle="Global supply chain intelligence — live"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <KPICard
            title="Total Shipments"
            value={kpis.total_shipments.toLocaleString()}
            subtitle="Active globally"
            icon={Package}
            color="cyan"
            index={0}
            trend={{ value: 4.2, label: 'vs last week' }}
          />
          <KPICard
            title="On-Time Rate"
            value={`${kpis.on_time_percentage}%`}
            subtitle="Delivery performance"
            icon={TrendingUp}
            color="emerald"
            index={1}
            trend={{ value: -1.8, label: 'vs last week' }}
          />
          <KPICard
            title="Avg Risk Score"
            value={kpis.avg_risk_score}
            subtitle="Fleet-wide average"
            icon={Shield}
            color="amber"
            index={2}
          />
          <KPICard
            title="Delayed"
            value={kpis.delayed_count}
            subtitle="Shipments behind schedule"
            icon={Clock}
            color="red"
            index={3}
            trend={{ value: 12.5, label: 'vs yesterday' }}
          />
          <KPICard
            title="Critical Alerts"
            value={alerts.filter((a) => a.severity === 'critical').length}
            subtitle="Require immediate action"
            icon={AlertTriangle}
            color="red"
            index={4}
          />
          <KPICard
            title="Resilience Score"
            value={`${kpis.resilience_score}`}
            subtitle="Supply chain health"
            icon={Activity}
            color="purple"
            index={5}
            trend={{ value: 2.1, label: 'vs last month' }}
          />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Map — spans 2 cols */}
          <GlassCard className="xl:col-span-2 p-0 overflow-hidden" style={{ height: '340px' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 dark:border-white/[0.06] transition-colors">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Live Shipment Map</h3>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Live</span>
              </div>
            </div>
            <div style={{ height: 'calc(100% - 49px)' }}>
              <ShipmentMap />
            </div>
          </GlassCard>

          {/* Risk Distribution */}
          <GlassCard className="p-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">Risk Distribution</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3">Fleet-wide risk breakdown</p>
            <RiskDistributionChart />
          </GlassCard>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <GlassCard className="p-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">Risk & On-Time Trend</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3">30-day performance history</p>
            <RiskTrendChart />
          </GlassCard>

          <GlassCard className="p-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">Route Efficiency Radar</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3">Efficiency vs volume by lane</p>
            <RouteEfficiencyChart />
          </GlassCard>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Top risk shipments */}
          <GlassCard className="p-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3">Highest Risk Shipments</h3>
            <div className="space-y-2">
              {topRiskShipments.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-black/5 dark:bg-white/[0.03] hover:bg-black/10 dark:hover:bg-white/[0.06] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-bold w-16">{s.id}</span>
                    <div>
                      <p className="text-xs text-slate-800 dark:text-white font-bold">{s.origin} → {s.destination}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{s.carrier}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusChip status={s.status} size="sm" />
                    <RiskBadge level={s.risk_level} score={s.risk_score} size="sm" pulse />
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>

          {/* Carrier performance */}
          <GlassCard className="p-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3">Carrier Performance</h3>
            <div className="space-y-3">
              {carrierPerformanceData.map((c) => (
                <div key={c.carrier} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-300 font-bold">{c.carrier}</span>
                    <span className="text-slate-500 dark:text-slate-400 font-medium">{c.on_time}% on-time</span>
                  </div>
                  <div className="h-1.5 bg-black/5 dark:bg-white/[0.06] rounded-full overflow-hidden transition-colors">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${c.on_time}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="h-full rounded-full"
                      style={{
                        background: c.on_time > 88 ? '#10b981' : c.on_time > 80 ? '#22d3ee' : '#f59e0b'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

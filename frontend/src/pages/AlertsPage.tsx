import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Zap, CloudRain, Anchor, Truck, Package, Clock, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { TopBar } from '../components/layout/TopBar';
import { GlassCard } from '../components/ui/GlassCard';
import { RiskBadge } from '../components/ui/RiskBadge';
import { useShipmentStore } from '../store/useShipmentStore';
import type { Alert, AlertSeverity } from '../types';
import clsx from 'clsx';

const alertIcons: Record<string, React.ElementType> = {
  high_risk_flag: AlertTriangle,
  anomaly_detected: Zap,
  weather_risk: CloudRain,
  port_strike: Anchor,
  road_closure: Truck,
  inventory_stockout: Package,
  reroute_recommendation: Zap,
  delay_warning: Clock,
  customs_delay: Package,
};

const alertTypeLabels: Record<string, string> = {
  high_risk_flag: 'High Risk Flag',
  anomaly_detected: 'Anomaly Detected',
  weather_risk: 'Weather Risk',
  port_strike: 'Port Strike',
  road_closure: 'Road Closure',
  inventory_stockout: 'Inventory Stockout',
  reroute_recommendation: 'Reroute Recommendation',
  delay_warning: 'Delay Warning',
  customs_delay: 'Customs Delay',
};

const severityConfig: Record<AlertSeverity, { bg: string; border: string; text: string; badge: string }> = {
  critical: { bg: 'bg-red-500/5', border: 'border-red-500/25', text: 'text-red-400', badge: 'bg-red-500/20 text-red-400 border-red-500/30' },
  high: { bg: 'bg-orange-500/5', border: 'border-orange-500/25', text: 'text-orange-400', badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  medium: { bg: 'bg-amber-500/5', border: 'border-amber-500/25', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  low: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/25', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
};

function AlertCard({ alert, index }: { alert: Alert; index: number }) {
  const Icon = alertIcons[alert.type] || AlertTriangle;
  const sc = severityConfig[alert.severity];
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={clsx('rounded-xl border p-4 transition-all', sc.bg, sc.border)}
    >
      <div className="flex items-start gap-3">
        <div className={clsx('h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0', sc.badge.split(' ').slice(0, 1).join(' '), 'bg-opacity-20')}>
          <Icon className={clsx('h-4 w-4', sc.text)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={clsx('text-[10px] font-bold uppercase tracking-wider border rounded px-1.5 py-0.5', sc.badge)}>
                  {alert.severity}
                </span>
                <span className="text-xs font-medium text-white">{alertTypeLabels[alert.type] || alert.type}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{alert.shipment_id}</p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 flex-shrink-0">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed mb-2">{alert.message}</p>

          <div className="flex items-center justify-between">
            <RiskBadge level={alert.severity} score={alert.risk_score} size="sm" />
            {alert.alternate_routes.length > 0 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                {expanded ? 'Hide' : 'View'} {alert.alternate_routes.length} alternate route{alert.alternate_routes.length > 1 ? 's' : ''}
              </button>
            )}
          </div>

          {expanded && alert.alternate_routes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 space-y-2"
            >
              {alert.alternate_routes.map((r) => (
                <div key={r.rank} className="bg-white/[0.04] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold text-cyan-400">Route {r.rank}</span>
                    <span className="text-[10px] text-slate-400">Risk: {r.composite_risk.toFixed(0)}/100</span>
                  </div>
                  <p className="text-xs text-slate-300">{r.path.join(' → ')}</p>
                  <div className="flex gap-4 mt-1.5 text-[10px] text-slate-400">
                    <span>${r.total_cost_usd.toLocaleString()}</span>
                    <span>{r.transit_days} days</span>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function AlertsPage() {
  const { alerts } = useShipmentStore();
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filtered = alerts.filter((a) => {
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    if (typeFilter !== 'all' && a.type !== typeFilter) return false;
    return true;
  });

  const counts = {
    critical: alerts.filter((a) => a.severity === 'critical').length,
    high: alerts.filter((a) => a.severity === 'high').length,
    medium: alerts.filter((a) => a.severity === 'medium').length,
    low: alerts.filter((a) => a.severity === 'low').length,
  };

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Alert Intelligence Center" subtitle={`${alerts.length} active alerts across your network`} />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Severity summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(Object.entries(counts) as [AlertSeverity, number][]).map(([sev, count]) => {
            const sc = severityConfig[sev];
            return (
              <button
                key={sev}
                onClick={() => setSeverityFilter(severityFilter === sev ? 'all' : sev)}
                className={clsx(
                  'rounded-xl border p-4 text-left transition-all',
                  sc.bg, sc.border,
                  severityFilter === sev && 'ring-1 ring-offset-0',
                  severityFilter === sev && sc.text.replace('text-', 'ring-')
                )}
              >
                <p className={clsx('text-2xl font-bold', sc.text)}>{count}</p>
                <p className="text-xs text-slate-400 capitalize mt-0.5">{sev}</p>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <GlassCard className="p-3">
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none"
            >
              <option value="all">All Severity</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="port_strike">Port Strike</option>
              <option value="weather_risk">Weather Risk</option>
              <option value="customs_delay">Customs Delay</option>
              <option value="anomaly_detected">Anomaly</option>
              <option value="high_risk_flag">High Risk</option>
              <option value="delay_warning">Delay Warning</option>
            </select>
            <span className="text-xs text-slate-400 ml-auto">{filtered.length} alerts shown</span>
          </div>
        </GlassCard>

        {/* Alert cards */}
        <div className="space-y-3">
          {filtered.map((a, i) => <AlertCard key={a.id} alert={a} index={i} />)}
          {filtered.length === 0 && (
            <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
              No alerts match your filters
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

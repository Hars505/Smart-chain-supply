import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Zap, CloudRain, Anchor, Truck, Package } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import { useShipmentStore } from '../../store/useShipmentStore';
import { useUIStore } from '../../store/useUIStore';
import type { Alert } from '../../types';

const alertIcons: Record<string, React.ElementType> = {
  high_risk_flag: AlertTriangle,
  anomaly_detected: Zap,
  weather_risk: CloudRain,
  port_strike: Anchor,
  road_closure: Truck,
  inventory_stockout: Package,
  reroute_recommendation: Zap,
  delay_warning: AlertTriangle,
  customs_delay: Package,
};

const severityBorder: Record<string, string> = {
  critical: 'border-l-red-500',
  high: 'border-l-orange-500',
  medium: 'border-l-amber-500',
  low: 'border-l-emerald-500',
};

const severityText: Record<string, string> = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-amber-400',
  low: 'text-emerald-400',
};

function AlertItem({ alert }: { alert: Alert }) {
  const Icon = alertIcons[alert.type] || AlertTriangle;
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={clsx(
        'border-l-2 bg-white/[0.03] rounded-r-lg p-3 hover:bg-white/[0.05] transition-colors cursor-pointer',
        severityBorder[alert.severity]
      )}
    >
      <div className="flex items-start gap-2">
        <Icon className={clsx('h-3.5 w-3.5 mt-0.5 flex-shrink-0', severityText[alert.severity])} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className={clsx('text-[10px] font-bold uppercase tracking-wider', severityText[alert.severity])}>
              {alert.severity}
            </span>
            <span className="text-[10px] text-slate-500">
              {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{alert.message}</p>
          <p className="text-[10px] text-slate-500 mt-1">{alert.shipment_id}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function AlertPanel() {
  const { alerts } = useShipmentStore();
  const { toggleAlertPanel } = useUIStore();

  const critical = alerts.filter((a) => a.severity === 'critical');
  const others = alerts.filter((a) => a.severity !== 'critical');

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 280, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col h-full bg-navy-900/80 border-l border-white/[0.06] backdrop-blur-xl overflow-hidden flex-shrink-0"
    >
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.06]">
        <div>
          <h3 className="text-sm font-semibold text-white">Alert Feed</h3>
          <p className="text-[10px] text-slate-400">{alerts.length} active alerts</p>
        </div>
        <button
          onClick={toggleAlertPanel}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {critical.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wider mb-2 px-1">
              Critical ({critical.length})
            </p>
            <div className="space-y-2">
              <AnimatePresence>
                {critical.map((a) => <AlertItem key={a.id} alert={a} />)}
              </AnimatePresence>
            </div>
          </div>
        )}

        {others.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1 mt-3">
              Other Alerts ({others.length})
            </p>
            <div className="space-y-2">
              {others.map((a) => <AlertItem key={a.id} alert={a} />)}
            </div>
          </div>
        )}

        {alerts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-slate-500">
            <p className="text-xs">No active alerts</p>
          </div>
        )}
      </div>
    </motion.aside>
  );
}

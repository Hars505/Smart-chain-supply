import { Bell, Wifi, WifiOff, RefreshCw, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { useUIStore } from '../../store/useUIStore';
import { useShipmentStore } from '../../store/useShipmentStore';
import { useState, useEffect } from 'react';

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { wsConnected, toggleAlertPanel } = useUIStore();
  const { alerts, fetchShipments, fetchAlerts } = useShipmentStore();
  const [time, setTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchShipments(), fetchAlerts()]);
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/[0.06] bg-white/80 dark:bg-navy-900/60 backdrop-blur-xl flex-shrink-0 transition-colors">
      <div>
        <h1 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Live clock */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-black/5 dark:bg-white/[0.04] border border-black/5 dark:border-white/[0.06] rounded-lg px-3 py-1.5">
          <Clock className="h-3 w-3" />
          <span className="font-mono">{time.toUTCString().slice(17, 25)} UTC</span>
        </div>

        {/* WS status */}
        <div className={clsx(
          'flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 border transition-colors',
          wsConnected
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            : 'bg-slate-500/10 border-slate-500/20 text-slate-500 dark:text-slate-400'
        )}>
          {wsConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          <span className="hidden sm:inline">{wsConnected ? 'Live' : 'Offline'}</span>
        </div>

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          className="p-2 rounded-lg bg-black/5 dark:bg-white/[0.04] border border-black/5 dark:border-white/[0.06] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/[0.07] transition-all"
        >
          <RefreshCw className={clsx('h-4 w-4', refreshing && 'animate-spin')} />
        </button>

        {/* Alerts bell */}
        <button
          onClick={toggleAlertPanel}
          className="relative p-2 rounded-lg bg-black/5 dark:bg-white/[0.04] border border-black/5 dark:border-white/[0.06] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/[0.07] transition-all"
        >
          <Bell className="h-4 w-4" />
          {criticalCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center"
            >
              {criticalCount}
            </motion.span>
          )}
        </button>
      </div>
    </header>
  );
}

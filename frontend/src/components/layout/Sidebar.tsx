import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Map, Package, Zap, GitBranch,
  Bell, BarChart3, ChevronLeft, ChevronRight, Activity,
  Shield, PlusCircle
} from 'lucide-react';
import clsx from 'clsx';
import { useUIStore } from '../../store/useUIStore';
import { useShipmentStore } from '../../store/useShipmentStore';
import { useThemeStore } from '../../store/useThemeStore';
import { Sun, Moon } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Control Tower', exact: true },
  { to: '/command-center', icon: Map, label: 'Map Command' },
  { to: '/shipments', icon: Package, label: 'Shipments' },
  { to: '/new-shipment', icon: PlusCircle, label: 'Add Shipment' },
  { to: '/disruption-engine', icon: Zap, label: 'Disruption Engine' },
  { to: '/rerouting', icon: GitBranch, label: 'Auto Rerouting' },
  { to: '/alerts', icon: Bell, label: 'Alert Intelligence' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { alerts } = useShipmentStore();
  const { theme, toggleTheme } = useThemeStore();
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 64 : 220 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="relative flex flex-col h-full bg-white/80 dark:bg-navy-900/80 border-r border-black/5 dark:border-white/[0.06] backdrop-blur-xl overflow-hidden flex-shrink-0 transition-colors"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-black/5 dark:border-white/[0.06] transition-colors">
        <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
          <Shield className="h-4 w-4 text-cyan-400" />
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <p className="text-sm font-bold text-slate-800 dark:text-white whitespace-nowrap">LogiSense</p>
              <p className="text-[10px] text-cyan-600 dark:text-cyan-400/70 whitespace-nowrap">Intelligence Platform</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 group relative',
                isActive
                  ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.05]'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative flex-shrink-0">
                  <Icon className={clsx('h-4 w-4', isActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white')} />
                  {label === 'Alert Intelligence' && criticalCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </div>
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-white dark:bg-navy-800 border border-black/10 dark:border-white/10 rounded text-xs text-slate-800 dark:text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    {label}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Live indicator & Theme toggle */}
      <div className="px-3 py-3 border-t border-black/5 dark:border-white/[0.06] flex flex-col gap-2 transition-colors">
        <button
          onClick={toggleTheme}
          className={clsx(
            'flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-all duration-150',
            'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.05]',
            sidebarCollapsed && 'justify-center'
          )}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 flex-shrink-0" /> : <Moon className="h-4 w-4 flex-shrink-0" />}
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="whitespace-nowrap overflow-hidden"
              >
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <div className={clsx('flex items-center gap-2 px-2', sidebarCollapsed && 'justify-center')}>
          <Activity className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-emerald-400 whitespace-nowrap"
              >
                Live Feed Active
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-white dark:bg-navy-800 border border-black/10 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors z-10"
      >
        {sidebarCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </motion.aside>
  );
}

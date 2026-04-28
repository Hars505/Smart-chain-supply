import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { GlassCard } from '../components/ui/GlassCard';
import { RiskBadge } from '../components/ui/RiskBadge';
import { StatusChip } from '../components/ui/StatusChip';
import { useShipmentStore } from '../store/useShipmentStore';
import type { Shipment, RiskLevel, ShipmentStatus } from '../types';

type SortKey = keyof Shipment;

function ExpandedRow({ shipment }: { shipment: Shipment }) {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <td colSpan={8} className="px-4 pb-4">
        <div className="bg-white/[0.03] rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Position</p>
            <p className="text-xs font-mono text-slate-300">{shipment.lat.toFixed(4)}°, {shipment.lng.toFixed(4)}°</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Speed</p>
            <p className="text-xs text-white">{shipment.speed_kmh} km/h</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Progress</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${shipment.progress * 100}%` }} />
              </div>
              <span className="text-xs text-slate-300">{Math.round(shipment.progress * 100)}%</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Anomaly</p>
            <p className={`text-xs font-medium ${shipment.is_anomaly ? 'text-amber-400' : 'text-emerald-400'}`}>
              {shipment.is_anomaly ? '⚠ Detected' : '✓ Normal'}
            </p>
          </div>
          <div className="col-span-2 md:col-span-4">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">Risk Factors</p>
            <div className="flex flex-wrap gap-1.5">
              {shipment.top_risk_factors.length > 0
                ? shipment.top_risk_factors.map((f) => (
                    <span key={f} className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 rounded px-2 py-0.5">
                      {f.replace(/_/g, ' ')}
                    </span>
                  ))
                : <span className="text-xs text-slate-500">No significant risk factors</span>
              }
            </div>
          </div>
        </div>
      </td>
    </motion.tr>
  );
}

export function Shipments() {
  const { shipments } = useShipmentStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('risk_score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = [...shipments];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.id.toLowerCase().includes(q) ||
          s.origin.toLowerCase().includes(q) ||
          s.destination.toLowerCase().includes(q) ||
          s.carrier.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') result = result.filter((s) => s.status === statusFilter);
    if (riskFilter !== 'all') result = result.filter((s) => s.risk_level === riskFilter);
    result.sort((a, b) => {
      const av = a[sortKey] as number | string;
      const bv = b[sortKey] as number | string;
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return result;
  }, [shipments, search, statusFilter, riskFilter, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : null;

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Shipment Monitor" subtitle={`${filtered.length} of ${shipments.length} shipments`} />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Filters */}
        <GlassCard className="p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search shipments, carriers, routes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.06]"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50"
              >
                <option value="all">All Status</option>
                <option value="in_transit">In Transit</option>
                <option value="at_port">At Port</option>
                <option value="delayed">Delayed</option>
                <option value="customs_hold">Customs Hold</option>
              </select>

              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50"
              >
                <option value="all">All Risk</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
        </GlassCard>

        {/* Table */}
        <GlassCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {[
                    { key: 'id', label: 'Shipment ID' },
                    { key: 'origin', label: 'Route' },
                    { key: 'carrier', label: 'Carrier' },
                    { key: 'status', label: 'Status' },
                    { key: 'risk_score', label: 'Risk' },
                    { key: 'eta_days', label: 'ETA' },
                    { key: 'value_usd', label: 'Value' },
                    { key: null, label: '' },
                  ].map(({ key, label }) => (
                    <th
                      key={label}
                      onClick={() => key && handleSort(key as SortKey)}
                      className={`px-4 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider ${key ? 'cursor-pointer hover:text-white' : ''}`}
                    >
                      <div className="flex items-center gap-1">
                        {label}
                        {key && <SortIcon k={key as SortKey} />}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <>
                    <motion.tr
                      key={s.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-cyan-400">{s.id}</span>
                        {s.is_anomaly && (
                          <span className="ml-2 text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded px-1 py-0.5">
                            ANOMALY
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-white">{s.origin}</p>
                        <p className="text-[10px] text-slate-500">→ {s.destination}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-300">{s.carrier}</td>
                      <td className="px-4 py-3"><StatusChip status={s.status} size="sm" /></td>
                      <td className="px-4 py-3"><RiskBadge level={s.risk_level} score={s.risk_score} size="sm" pulse /></td>
                      <td className="px-4 py-3 text-xs text-slate-300">{s.eta_days ? `${s.eta_days}d` : '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-300">${(s.value_usd / 1000).toFixed(0)}K</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                        >
                          {expandedId === s.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                      </td>
                    </motion.tr>
                    <AnimatePresence>
                      {expandedId === s.id && <ExpandedRow key={`exp-${s.id}`} shipment={s} />}
                    </AnimatePresence>
                  </>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
                No shipments match your filters
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

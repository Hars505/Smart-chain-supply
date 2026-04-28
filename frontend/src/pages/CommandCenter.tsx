import { AnimatePresence } from 'framer-motion';
import { TopBar } from '../components/layout/TopBar';
import { ShipmentMap, ShipmentDetailDrawer } from '../components/maps/ShipmentMap';
import { useShipmentStore } from '../store/useShipmentStore';
import { RiskBadge } from '../components/ui/RiskBadge';
import { StatusChip } from '../components/ui/StatusChip';
import { GlassCard } from '../components/ui/GlassCard';

export function CommandCenter() {
  const { shipments, selectedShipment, selectShipment } = useShipmentStore();

  const criticalShipments = shipments.filter((s) => s.risk_level === 'critical');

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Map Command Center"
        subtitle="Live global shipment tracking with risk overlays"
      />

      <div className="flex flex-1 overflow-hidden gap-0">
        {/* Left panel — shipment list */}
        <div className="w-64 flex-shrink-0 border-r border-white/[0.06] overflow-y-auto bg-navy-900/40">
          <div className="p-3 border-b border-white/[0.06]">
            <p className="text-xs font-semibold text-white">Active Vessels</p>
            <p className="text-[10px] text-slate-400">{shipments.length} tracked</p>
          </div>

          {criticalShipments.length > 0 && (
            <div className="p-2 border-b border-white/[0.06]">
              <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wider px-1 mb-1.5">
                Critical ({criticalShipments.length})
              </p>
              {criticalShipments.map((s) => (
                <button
                  key={s.id}
                  onClick={() => selectShipment(s)}
                  className={`w-full text-left p-2 rounded-lg mb-1 transition-colors ${
                    selectedShipment?.id === s.id
                      ? 'bg-cyan-500/15 border border-cyan-500/20'
                      : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-mono text-white">{s.id}</span>
                    <RiskBadge level={s.risk_level} score={s.risk_score} size="sm" pulse />
                  </div>
                  <p className="text-[10px] text-slate-400">{s.origin} → {s.destination}</p>
                </button>
              ))}
            </div>
          )}

          <div className="p-2">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1 mb-1.5">
              All Vessels
            </p>
            {shipments.map((s) => (
              <button
                key={s.id}
                onClick={() => selectShipment(s)}
                className={`w-full text-left p-2 rounded-lg mb-1 transition-colors ${
                  selectedShipment?.id === s.id
                    ? 'bg-cyan-500/15 border border-cyan-500/20'
                    : 'hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-mono text-white">{s.id}</span>
                  <RiskBadge level={s.risk_level} size="sm" />
                </div>
                <p className="text-[10px] text-slate-400">{s.origin} → {s.destination}</p>
                <StatusChip status={s.status} size="sm" />
              </button>
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative overflow-hidden">
          <ShipmentMap />
          <AnimatePresence>
            {selectedShipment && <ShipmentDetailDrawer />}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

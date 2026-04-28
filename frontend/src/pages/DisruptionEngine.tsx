import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, AlertTriangle, Play, RotateCcw } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { GlassCard } from '../components/ui/GlassCard';
import { mockDisruptions } from '../data/mockRiskData';
import type { DisruptionPrediction } from '../types';

function ProbabilityBar({ value }: { value: number }) {
  const color = value > 0.75 ? '#ef4444' : value > 0.55 ? '#f97316' : value > 0.35 ? '#f59e0b' : '#10b981';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <span className="text-sm font-bold w-12 text-right" style={{ color }}>
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}

function DisruptionCard({ d, index }: { d: DisruptionPrediction; index: number }) {
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<string | null>(null);

  const handleSimulate = () => {
    setSimulating(true);
    setSimResult(null);
    setTimeout(() => {
      setSimulating(false);
      setSimResult(
        `Simulation complete: ${d.affected_routes.length} routes affected. Estimated ${d.estimated_delay_days} day delay. Recommend activating ${d.affected_routes.length > 1 ? 'multi-route' : 'single-route'} contingency plan.`
      );
    }, 1800);
  };

  const severityColor = d.probability > 0.75 ? 'border-red-500/30 bg-red-500/5' :
    d.probability > 0.55 ? 'border-orange-500/30 bg-orange-500/5' :
    d.probability > 0.35 ? 'border-amber-500/30 bg-amber-500/5' :
    'border-emerald-500/30 bg-emerald-500/5';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`rounded-xl border p-5 ${severityColor}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">{d.type}</h3>
          </div>
          <p className="text-xs text-slate-400">{d.scenario}</p>
        </div>
        <div className="text-right flex-shrink-0 ml-4">
          <p className="text-[10px] text-slate-400">Confidence</p>
          <p className="text-sm font-bold text-cyan-400">{Math.round(d.confidence * 100)}%</p>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1.5">Disruption Probability</p>
        <ProbabilityBar value={d.probability} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-white/[0.04] rounded-lg p-2.5">
          <p className="text-[10px] text-slate-400 mb-1">Est. Delay</p>
          <p className="text-sm font-bold text-white">{d.estimated_delay_days} days</p>
        </div>
        <div className="bg-white/[0.04] rounded-lg p-2.5">
          <p className="text-[10px] text-slate-400 mb-1">Routes Affected</p>
          <p className="text-sm font-bold text-white">{d.affected_routes.length}</p>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1.5">Risk Signals</p>
        <div className="flex flex-wrap gap-1.5">
          {d.signals.map((s) => (
            <span key={s} className="text-[10px] bg-white/[0.05] text-slate-300 border border-white/[0.08] rounded px-2 py-0.5">
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1.5">Affected Routes</p>
        {d.affected_routes.map((r) => (
          <p key={r} className="text-xs text-slate-300 flex items-center gap-1.5 mb-1">
            <span className="h-1 w-1 rounded-full bg-amber-400" />
            {r}
          </p>
        ))}
      </div>

      <button
        onClick={handleSimulate}
        disabled={simulating}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-cyan-500/15 border border-cyan-500/25 text-cyan-400 text-xs font-medium hover:bg-cyan-500/25 transition-colors disabled:opacity-50"
      >
        {simulating ? (
          <>
            <RotateCcw className="h-3.5 w-3.5 animate-spin" />
            Simulating...
          </>
        ) : (
          <>
            <Play className="h-3.5 w-3.5" />
            Run "What-If" Simulation
          </>
        )}
      </button>

      {simResult && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg"
        >
          <p className="text-xs text-emerald-400">{simResult}</p>
        </motion.div>
      )}
    </motion.div>
  );
}

export function DisruptionEngine() {
  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Predictive Disruption Engine"
        subtitle="AI-powered disruption forecasting and scenario simulation"
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Header stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Active Predictions', value: mockDisruptions.length, color: 'text-cyan-400' },
            { label: 'High Probability', value: mockDisruptions.filter((d) => d.probability > 0.65).length, color: 'text-red-400' },
            { label: 'Avg Confidence', value: `${Math.round(mockDisruptions.reduce((a, d) => a + d.confidence, 0) / mockDisruptions.length * 100)}%`, color: 'text-amber-400' },
            { label: 'Routes at Risk', value: mockDisruptions.reduce((a, d) => a + d.affected_routes.length, 0), color: 'text-orange-400' },
          ].map(({ label, value, color }) => (
            <GlassCard key={label} className="p-4">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </GlassCard>
          ))}
        </div>

        {/* Disruption cards */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {mockDisruptions.map((d, i) => (
            <DisruptionCard key={d.id} d={d} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

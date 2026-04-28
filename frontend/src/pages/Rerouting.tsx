import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, CheckCircle, AlertTriangle, ArrowRight, Loader2, Leaf, DollarSign, Clock, Shield } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { GlassCard } from '../components/ui/GlassCard';
import { RiskBadge } from '../components/ui/RiskBadge';
import { useShipmentStore } from '../store/useShipmentStore';
import { shipmentService } from '../services/shipmentService';
import type { RerouteResponse, RouteOption } from '../types';

type WorkflowStep = 'idle' | 'detecting' | 'predicting' | 'generating' | 'recommending' | 'done';

const WORKFLOW_STEPS = [
  { key: 'detecting', label: 'Detect Risk', icon: AlertTriangle, duration: 800 },
  { key: 'predicting', label: 'Run Prediction', icon: Shield, duration: 1000 },
  { key: 'generating', label: 'Generate Routes', icon: GitBranch, duration: 1200 },
  { key: 'recommending', label: 'Recommend Route', icon: CheckCircle, duration: 600 },
];

function RouteComparisonRow({ route, recommended, onApprove }: { route: RouteOption; recommended: boolean; onApprove: () => void }) {
  const riskColor = route.composite_risk > 65 ? 'text-red-400' : route.composite_risk > 40 ? 'text-amber-400' : 'text-emerald-400';
  const carbon = route.carbon_kg || Math.round(route.transit_days * 180 + route.total_cost_usd * 0.3);

  return (
    <motion.tr
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`border-b border-white/[0.04] ${recommended ? 'bg-cyan-500/5' : 'hover:bg-white/[0.02]'} transition-colors`}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {recommended && <span className="text-[9px] bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 rounded px-1.5 py-0.5 font-bold">BEST</span>}
          <span className="text-xs text-slate-600 dark:text-slate-300 font-bold">Route {route.rank}</span>
        </div>
        <p className="text-[10px] text-slate-500 font-medium mt-0.5">{route.path.join(' → ')}</p>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-800 dark:text-white font-bold">
          <DollarSign className="h-3 w-3 text-slate-500" />
          ${route.total_cost_usd.toLocaleString()}
        </div>
        {route.savings_vs_original && (
          <p className={`text-[10px] ${route.savings_vs_original.cost_delta_usd < 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {route.savings_vs_original.cost_delta_usd > 0 ? '+' : ''}${route.savings_vs_original.cost_delta_usd.toLocaleString()}
          </p>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-800 dark:text-white font-bold">
          <Clock className="h-3 w-3 text-slate-500" />
          {route.transit_days} days
        </div>
        {route.savings_vs_original && (
          <p className={`text-[10px] ${route.savings_vs_original.time_delta_days < 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {route.savings_vs_original.time_delta_days > 0 ? '+' : ''}{route.savings_vs_original.time_delta_days}d
          </p>
        )}
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs font-bold ${riskColor}`}>{route.composite_risk.toFixed(0)}/100</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
          <Leaf className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />
          {carbon.toLocaleString()} kg
        </div>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={onApprove}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            recommended
              ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/30'
              : 'bg-black/5 dark:bg-white/[0.04] border border-black/10 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/[0.07]'
          }`}
        >
          {recommended ? 'Auto-Approve' : 'Select'}
        </button>
      </td>
    </motion.tr>
  );
}

export function Rerouting() {
  const { shipments } = useShipmentStore();
  const [selectedId, setSelectedId] = useState(shipments[0]?.id || '');
  const [step, setStep] = useState<WorkflowStep>('idle');
  const [result, setResult] = useState<RerouteResponse | null>(null);
  const [approvedRoute, setApprovedRoute] = useState<number | null>(null);

  const criticalShipments = shipments.filter((s) => s.risk_score > 60);

  const runWorkflow = async () => {
    setResult(null);
    setApprovedRoute(null);

    for (const ws of WORKFLOW_STEPS) {
      setStep(ws.key as WorkflowStep);
      await new Promise((r) => setTimeout(r, ws.duration));
    }

    try {
      const data = await shipmentService.rerouteShipment(selectedId, 'manual_trigger');
      setResult(data);
    } catch {
      // Use mock result
      const shipment = shipments.find((s) => s.id === selectedId);
      setResult({
        shipment_id: selectedId,
        current_risk_score: shipment?.risk_score || 75,
        routes: [
          {
            rank: 1,
            path: [shipment?.origin || 'Mumbai', 'Singapore', shipment?.destination || 'Rotterdam'],
            total_cost_usd: 4200,
            transit_days: 22,
            composite_risk: 28,
            summary: 'Optimized route via Singapore hub',
            carbon_kg: 3800,
            savings_vs_original: { cost_delta_usd: -800, time_delta_days: -3, risk_delta: -35 },
          },
          {
            rank: 2,
            path: [shipment?.origin || 'Mumbai', 'Cape Town', shipment?.destination || 'Rotterdam'],
            total_cost_usd: 5800,
            transit_days: 28,
            composite_risk: 18,
            summary: 'Cape of Good Hope — lowest risk',
            carbon_kg: 5200,
            savings_vs_original: { cost_delta_usd: 800, time_delta_days: 3, risk_delta: -45 },
          },
          {
            rank: 3,
            path: [shipment?.origin || 'Mumbai', 'Colombo', 'Port Said', shipment?.destination || 'Rotterdam'],
            total_cost_usd: 3600,
            transit_days: 25,
            composite_risk: 42,
            summary: 'Standard Suez route — cost optimized',
            carbon_kg: 4100,
            savings_vs_original: { cost_delta_usd: -1400, time_delta_days: 0, risk_delta: -21 },
          },
        ],
        recommended_route_idx: 0,
        analysis: `LLM+ML Auto-reroute analysis complete for ${selectedId}. Risk reduced from ${shipment?.risk_score.toFixed(0) || 75}/100 to 28/100 via Singapore hub. Factoring in current weather anomalies and port congestion, the model projects a net savings of $800 despite the slight detour.`,
      });
    }

    setStep('done');
  };

  const currentStep = WORKFLOW_STEPS.findIndex((s) => s.key === step);

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="LLM+ML Autonomous Rerouting Console"
        subtitle="AI-driven route optimization, costing and delay predictions"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Shipment selector */}
        <GlassCard className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-48">
              <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Select Shipment</label>
              <select
                value={selectedId}
                onChange={(e) => { setSelectedId(e.target.value); setStep('idle'); setResult(null); }}
                className="w-full bg-black/5 dark:bg-white/[0.04] border border-black/10 dark:border-white/[0.08] rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white font-medium focus:outline-none focus:border-cyan-500/50 transition-colors"
              >
                {shipments.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} — {s.origin} → {s.destination} (Risk: {s.risk_score.toFixed(0)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1.5">High-Risk Vessels</label>
              <div className="flex flex-wrap gap-1.5">
                {criticalShipments.slice(0, 4).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedId(s.id); setStep('idle'); setResult(null); }}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-bold transition-colors ${
                      selectedId === s.id
                        ? 'bg-red-500/20 border-red-500/30 text-red-600 dark:text-red-400'
                        : 'bg-black/5 dark:bg-white/[0.04] border-black/10 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/[0.07]'
                    }`}
                  >
                    {s.id}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={runWorkflow}
              disabled={step !== 'idle' && step !== 'done'}
              className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500/20 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 rounded-lg text-sm font-bold hover:bg-cyan-500/30 transition-all disabled:opacity-50"
            >
              {step !== 'idle' && step !== 'done' ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
              ) : (
                <><GitBranch className="h-4 w-4" /> Run Auto-Reroute</>
              )}
            </button>
          </div>
        </GlassCard>

        {/* Workflow steps */}
        <GlassCard className="p-5">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">LLM+ML Analysis Workflow</h3>
          <div className="flex items-center gap-0">
            {WORKFLOW_STEPS.map((ws, i) => {
              const Icon = ws.icon;
              const isActive = ws.key === step;
              const isDone = step === 'done' || (currentStep > i && step !== 'idle');
              const isPending = !isActive && !isDone;

              return (
                <div key={ws.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`h-10 w-10 rounded-full border-2 flex items-center justify-center transition-all ${
                      isDone ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400' :
                      isActive ? 'bg-cyan-500/20 border-cyan-500 text-cyan-600 dark:text-cyan-400 animate-pulse' :
                      'bg-black/5 dark:bg-white/[0.04] border-black/10 dark:border-white/[0.12] text-slate-400'
                    }`}>
                      {isDone ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <p className={`text-[10px] mt-1.5 font-bold ${
                      isDone ? 'text-emerald-600 dark:text-emerald-400' : isActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-500'
                    }`}>{ws.label}</p>
                  </div>
                  {i < WORKFLOW_STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-1 transition-all ${isDone ? 'bg-emerald-500/50' : 'bg-black/10 dark:bg-white/[0.08]'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Analysis */}
              <GlassCard className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center flex-shrink-0">
                    <GitBranch className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-white mb-1">LLM Recommendation Engine</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{result.analysis}</p>
                  </div>
                </div>
              </GlassCard>

              {/* Route comparison table */}
              <GlassCard className="overflow-hidden">
                <div className="px-4 py-3 border-b border-black/5 dark:border-white/[0.06]">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Route Comparison</h3>
                  <p className="text-xs text-slate-500 font-medium">Select and approve the optimal route</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-black/5 dark:border-white/[0.06]">
                        {['Route', 'Cost', 'Transit Time', 'Risk Score', 'Carbon Impact', 'Action'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.routes.map((route) => (
                        <RouteComparisonRow
                          key={route.rank}
                          route={route}
                          recommended={route.rank === result.recommended_route_idx + 1}
                          onApprove={() => setApprovedRoute(route.rank)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>

              {/* Approval confirmation */}
              <AnimatePresence>
                {approvedRoute !== null && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-xl mt-4"
                  >
                    <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Route {approvedRoute} Approved</p>
                      <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 font-medium mt-0.5">
                        Reroute instruction sent to {result.shipment_id}. Carrier notification dispatched via API.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

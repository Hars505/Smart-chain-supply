import type { DisruptionPrediction, KPIData } from '../types';

export const mockKPIs: KPIData = {
  total_shipments: 247,
  on_time_percentage: 78.4,
  avg_risk_score: 52.3,
  delayed_count: 31,
  critical_alerts: 5,
  resilience_score: 71.2,
};

export const mockDisruptions: DisruptionPrediction[] = [
  {
    id: 'PRED-001',
    type: 'Port Congestion',
    probability: 0.87,
    affected_routes: ['Shanghai → Los Angeles', 'Shenzhen → Long Beach'],
    estimated_delay_days: 4.5,
    confidence: 0.91,
    signals: ['Vessel queue +340%', 'Berth utilization 98%', 'Labor shortage reported'],
    scenario: 'Port congestion at Los Angeles expected to peak in 72 hours due to vessel backlog.',
  },
  {
    id: 'PRED-002',
    type: 'Weather Disruption',
    probability: 0.73,
    affected_routes: ['Singapore → Rotterdam', 'Dubai → Antwerp'],
    estimated_delay_days: 3.2,
    confidence: 0.85,
    signals: ['Tropical storm Cat-2 forming', 'Wind speed 85 knots', 'NWS advisory issued'],
    scenario: 'Tropical storm tracking toward Indian Ocean shipping lanes. 73% probability of route impact.',
  },
  {
    id: 'PRED-003',
    type: 'Geopolitical Risk',
    probability: 0.61,
    affected_routes: ['Mumbai → Rotterdam via Suez', 'Dubai → Hamburg'],
    estimated_delay_days: 7.0,
    confidence: 0.78,
    signals: ['Red Sea incident reports +45%', 'Naval advisory issued', 'Insurance premium spike'],
    scenario: 'Elevated piracy and conflict risk in Red Sea corridor. Recommend Cape of Good Hope reroute.',
  },
  {
    id: 'PRED-004',
    type: 'Labor Strike',
    probability: 0.54,
    affected_routes: ['All Pacific routes via LA/LB'],
    estimated_delay_days: 5.0,
    confidence: 0.72,
    signals: ['Union contract expiry in 14 days', 'Negotiation breakdown reported', 'Historical pattern match'],
    scenario: 'ILWU contract negotiations at critical stage. Strike probability elevated based on historical patterns.',
  },
  {
    id: 'PRED-005',
    type: 'Customs Bottleneck',
    probability: 0.42,
    affected_routes: ['China → EU routes'],
    estimated_delay_days: 2.8,
    confidence: 0.68,
    signals: ['New EU import regulations', 'Documentation backlog +120%', 'Inspection rate increase'],
    scenario: 'New EU customs regulations effective next week. Documentation compliance gap detected in 34% of shipments.',
  },
];

// Time series data for charts
export const riskTrendData = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  risk_score: Math.round(40 + Math.sin(i * 0.4) * 20 + Math.random() * 15),
  on_time: Math.round(75 + Math.cos(i * 0.3) * 10 + Math.random() * 8),
  disruptions: Math.round(2 + Math.random() * 5),
}));

export const routeEfficiencyData = [
  { route: 'Asia-Europe', efficiency: 82, avg_delay: 1.2, volume: 145 },
  { route: 'Trans-Pacific', efficiency: 71, avg_delay: 2.8, volume: 98 },
  { route: 'Asia-Americas', efficiency: 76, avg_delay: 1.9, volume: 67 },
  { route: 'Middle East-EU', efficiency: 68, avg_delay: 3.4, volume: 54 },
  { route: 'Intra-Asia', efficiency: 89, avg_delay: 0.8, volume: 112 },
];

export const congestionData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i.toString().padStart(2, '0')}:00`,
  'Los Angeles': Math.round(60 + Math.sin(i * 0.5) * 25 + Math.random() * 10),
  'Shanghai': Math.round(70 + Math.cos(i * 0.4) * 20 + Math.random() * 10),
  'Rotterdam': Math.round(45 + Math.sin(i * 0.6) * 15 + Math.random() * 8),
  'Singapore': Math.round(55 + Math.cos(i * 0.5) * 18 + Math.random() * 10),
}));

export const delayForecastData = Array.from({ length: 14 }, (_, i) => ({
  day: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  predicted_delays: Math.round(8 + Math.sin(i * 0.7) * 5 + Math.random() * 4),
  confidence_upper: Math.round(14 + Math.sin(i * 0.7) * 5 + Math.random() * 4),
  confidence_lower: Math.round(4 + Math.sin(i * 0.7) * 3 + Math.random() * 2),
}));

export const riskDistributionData = [
  { name: 'Low Risk', value: 89, color: '#10b981' },
  { name: 'Medium Risk', value: 94, color: '#f59e0b' },
  { name: 'High Risk', value: 43, color: '#f97316' },
  { name: 'Critical', value: 21, color: '#ef4444' },
];

export const carrierPerformanceData = [
  { carrier: 'Maersk', on_time: 92, risk_score: 18, volume: 78 },
  { carrier: 'MSC', on_time: 87, risk_score: 24, volume: 65 },
  { carrier: 'CMA-CGM', on_time: 83, risk_score: 31, volume: 54 },
  { carrier: 'COSCO', on_time: 79, risk_score: 38, volume: 43 },
  { carrier: 'Evergreen', on_time: 75, risk_score: 42, volume: 37 },
];

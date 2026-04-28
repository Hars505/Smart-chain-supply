// ─── Core Domain Types ────────────────────────────────────────────────────────

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ShipmentStatus = 'in_transit' | 'at_port' | 'delayed' | 'customs_hold' | 'on-schedule' | 'in-transit' | 'at-port';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertType = 'high_risk_flag' | 'anomaly_detected' | 'reroute_recommendation' | 'delay_warning' | 'port_strike' | 'weather_risk' | 'customs_delay' | 'road_closure' | 'inventory_stockout';

export interface Shipment {
  id: string;
  origin: string;
  destination: string;
  carrier: string;
  lat: number;
  lng: number;
  status: ShipmentStatus;
  risk_score: number;
  risk_level: RiskLevel;
  is_anomaly: boolean;
  speed_kmh: number;
  progress: number;
  cargo_type: string;
  value_usd: number;
  eta_days: number | null;
  top_risk_factors: string[];
  last_updated: string;
}

export interface RouteOption {
  rank: number;
  path: string[];
  total_cost_usd: number;
  transit_days: number;
  composite_risk: number;
  carriers?: string[];
  summary: string;
  savings_vs_original?: {
    cost_delta_usd: number;
    time_delta_days: number;
    risk_delta: number;
  };
  carbon_kg?: number;
}

export interface Alert {
  id: string;
  shipment_id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  risk_score: number;
  alternate_routes: RouteOption[];
  created_at: string;
}

export interface RiskScore {
  shipment_id: string;
  risk_score: number;
  risk_level: RiskLevel;
  component_scores: {
    weather: number;
    port_congestion: number;
    carrier: number;
    geopolitical: number;
    anomaly: number;
    dwell: number;
  };
  top_risk_factors: string[];
  recommended_action: string;
}

export interface DisruptionPrediction {
  id: string;
  type: string;
  probability: number;
  affected_routes: string[];
  estimated_delay_days: number;
  confidence: number;
  signals: string[];
  scenario: string;
}

export interface RerouteResponse {
  shipment_id: string;
  current_risk_score: number;
  routes: RouteOption[];
  recommended_route_idx: number;
  analysis: string;
}

export interface KPIData {
  total_shipments: number;
  on_time_percentage: number;
  avg_risk_score: number;
  delayed_count: number;
  critical_alerts: number;
  resilience_score: number;
}

export interface WSMessage {
  event: string;
  data?: unknown;
  shipment_id?: string;
  risk_score?: number;
  risk_level?: RiskLevel;
  is_anomaly?: boolean;
  shipments?: Shipment[];
  timestamp?: string;
}

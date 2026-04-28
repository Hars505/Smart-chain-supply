# ml/risk_scorer.py
"""
Weighted risk scoring engine (0-100).
Combines weather, port congestion, carrier reliability, geopolitical risk,
anomaly score, and dwell time into a single risk index.
"""

from dataclasses import dataclass
from typing import Optional
import numpy as np


# ─── Geopolitical risk index per country/region (0-10, higher = riskier) ───
GEOPOLITICAL_RISK = {
    "India":        2.0,
    "Netherlands":  1.0,
    "China":        3.5,
    "USA":          2.0,
    "UAE":          2.5,
    "Singapore":    1.0,
    "Germany":      1.0,
    "Egypt":        5.5,   # Suez Canal
    "Somalia":      8.5,   # piracy
    "Yemen":        9.0,   # conflict
    "Russia":       8.0,
    "Iran":         8.5,
    "Taiwan Strait":7.0,
    "default":      4.0,
}

# ─── Port congestion index (simulated; in production: pull from MarineTraffic API) ───
PORT_CONGESTION = {
    "Mumbai":      5.5,
    "Rotterdam":   3.0,
    "Shanghai":    7.2,
    "Los Angeles": 6.8,
    "Singapore":   4.1,
    "Hamburg":     3.5,
    "Dubai":       4.8,
    "default":     5.0,
}

# ─── Carrier on-time rates (0-10 scale) ───
CARRIER_RELIABILITY = {
    "Maersk":    9.2,
    "MSC":       8.7,
    "CMA-CGM":   8.3,
    "COSCO":     7.9,
    "Evergreen": 7.5,
    "default":   7.0,
}


@dataclass
class RiskInput:
    shipment_id: str
    lat: float
    lng: float
    origin: str
    destination: str
    carrier: str
    transit_countries: list[str]
    weather_severity: float       # 0-10 (from weather API or simulation)
    speed_kmh: float
    dwell_time_hours: float
    hours_stationary: float
    anomaly_score: float          # 0-1 from Isolation Forest
    is_anomaly: bool
    current_port: Optional[str] = None


@dataclass
class RiskOutput:
    shipment_id: str
    risk_score: float             # 0-100
    risk_level: str               # low / medium / high / critical
    component_scores: dict
    top_risk_factors: list[str]
    recommended_action: str


class RiskScorer:
    """
    Production-grade risk scoring engine.
    Weights are tuned to match FourKites / project44-style risk indices.
    """

    WEIGHTS = {
        "weather":        0.22,
        "port_congestion":0.18,
        "carrier":        0.15,
        "geopolitical":   0.20,
        "anomaly":        0.15,
        "dwell":          0.10,
    }

    def score(self, inp: RiskInput) -> RiskOutput:
        components = self._compute_components(inp)
        raw_score = sum(
            self.WEIGHTS[k] * v for k, v in components.items()
        )
        risk_score = round(min(max(raw_score * 10, 0), 100), 2)

        risk_level = self._classify(risk_score)
        top_factors = self._top_factors(components, inp)
        action = self._recommend(risk_score, top_factors)

        return RiskOutput(
            shipment_id=inp.shipment_id,
            risk_score=risk_score,
            risk_level=risk_level,
            component_scores={k: round(v, 2) for k, v in components.items()},
            top_risk_factors=top_factors,
            recommended_action=action,
        )

    # ─── private helpers ───────────────────────────────────────────────────

    def _compute_components(self, inp: RiskInput) -> dict:
        # Weather: direct 0-10 from input
        weather = float(np.clip(inp.weather_severity, 0, 10))

        # Port congestion: average of origin + destination + current port
        ports = [inp.origin, inp.destination]
        if inp.current_port:
            ports.append(inp.current_port)
        port_scores = [PORT_CONGESTION.get(p, PORT_CONGESTION["default"]) for p in ports]
        port_congestion = float(np.mean(port_scores))

        # Carrier: invert (high reliability = low risk)
        carrier_rel = CARRIER_RELIABILITY.get(inp.carrier, CARRIER_RELIABILITY["default"])
        carrier_risk = 10.0 - carrier_rel

        # Geopolitical: max risk across transit countries
        geo_scores = [GEOPOLITICAL_RISK.get(c, GEOPOLITICAL_RISK["default"])
                      for c in inp.transit_countries]
        geopolitical = float(max(geo_scores)) if geo_scores else GEOPOLITICAL_RISK["default"]

        # Anomaly: scale 0-1 to 0-10
        anomaly = inp.anomaly_score * 10.0
        if inp.is_anomaly:
            anomaly = min(anomaly * 1.4, 10.0)  # boost confirmed anomalies

        # Dwell time: >24h gets escalating penalty
        if inp.dwell_time_hours <= 12:
            dwell = 1.0
        elif inp.dwell_time_hours <= 24:
            dwell = 4.0
        elif inp.dwell_time_hours <= 48:
            dwell = 6.5
        elif inp.dwell_time_hours <= 96:
            dwell = 8.5
        else:
            dwell = 10.0

        # Stationary bonus penalty
        if inp.hours_stationary > 14:
            dwell = min(dwell + 2.0, 10.0)

        return {
            "weather": weather,
            "port_congestion": port_congestion,
            "carrier": carrier_risk,
            "geopolitical": geopolitical,
            "anomaly": anomaly,
            "dwell": dwell,
        }

    @staticmethod
    def _classify(score: float) -> str:
        if score < 25:  return "low"
        if score < 50:  return "medium"
        if score < 75:  return "high"
        return "critical"

    @staticmethod
    def _top_factors(components: dict, inp: RiskInput) -> list[str]:
        sorted_c = sorted(components.items(), key=lambda x: x[1], reverse=True)
        factors = []
        for name, val in sorted_c[:3]:
            if val < 3:
                continue
            label_map = {
                "weather":        f"Severe weather (severity {val:.1f}/10) at current location",
                "port_congestion": f"High port congestion at {inp.destination}",
                "carrier":        f"Below-average carrier reliability for {inp.carrier}",
                "geopolitical":   f"Elevated geopolitical risk in transit region",
                "anomaly":        f"Anomalous movement pattern detected (score {val:.1f}/10)",
                "dwell":          f"Extended dwell time ({inp.dwell_time_hours:.0f}h at current stop)",
            }
            factors.append(label_map.get(name, name))
        return factors

    @staticmethod
    def _recommend(score: float, factors: list[str]) -> str:
        if score < 25:
            return "No action required. Shipment progressing normally."
        if score < 50:
            return "Monitor closely. Consider notifying consignee of potential minor delay."
        if score < 75:
            return "Escalate to operations team. Evaluate alternate routing options."
        return "CRITICAL: Initiate reroute protocol immediately. Contact carrier and consignee."

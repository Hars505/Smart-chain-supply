# ml/flask_ai_api.py
"""
Lightweight Flask API called by Firebase Cloud Functions.
Receives shipment features -> returns risk score + anomaly flag.
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, request, jsonify
from ML.anomaly_detector import ShipmentAnomalyDetector
from ML.risk_scorer import RiskScorer, RiskInput
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Load models once at startup
detector = ShipmentAnomalyDetector()
scorer = RiskScorer()


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "models": ["anomaly_detector", "risk_scorer"]}), 200


@app.route("/analyze", methods=["POST"])
def analyze_shipment():
    """
    Called by Firebase Cloud Function on every Firestore document update.
    
    Request body (JSON):
    {
        "shipment_id": "SHP-4421",
        "origin": "Mumbai",
        "destination": "Rotterdam",
        "carrier": "Maersk",
        "lat": 12.34,
        "lng": 56.78,
        "speed_kmh": 28.5,
        "dwell_time_hours": 4.0,
        "hours_stationary": 0.0,
        "weather_severity": 3.2,
        "transit_countries": ["India", "Egypt", "Netherlands"],
        "stops_count": 2,
        "on_time_rate": 0.92,
        "distance_km": 11000,
        "transit_days": 18.5,
        "speed_variance": 2.1
    }
    
    Returns:
    {
        "risk_score": 42.5,
        "risk_level": "medium",
        "is_anomaly": false,
        "anomaly_score": 0.23,
        "component_scores": {...},
        "top_risk_factors": [...],
        "recommended_action": "..."
    }
    """
    try:
        data = request.get_json(force=True)
        shipment_id = data.get("shipment_id", "UNKNOWN")
        logger.info(f"Analyzing shipment {shipment_id}")

        # 1. Anomaly detection
        is_anomaly, anomaly_score = detector.predict(data)

        # 2. Risk scoring
        risk_input = RiskInput(
            shipment_id=shipment_id,
            lat=float(data.get("lat", 0)),
            lng=float(data.get("lng", 0)),
            origin=data.get("origin", "unknown"),
            destination=data.get("destination", "unknown"),
            carrier=data.get("carrier", "default"),
            transit_countries=data.get("transit_countries", []),
            weather_severity=float(data.get("weather_severity", 5.0)),
            speed_kmh=float(data.get("speed_kmh", 20.0)),
            dwell_time_hours=float(data.get("dwell_time_hours", 0)),
            hours_stationary=float(data.get("hours_stationary", 0)),
            anomaly_score=anomaly_score,
            is_anomaly=is_anomaly,
            current_port=data.get("current_port"),
        )
        risk_output = scorer.score(risk_input)

        response = {
            "shipment_id": shipment_id,
            "risk_score": risk_output.risk_score,
            "risk_level": risk_output.risk_level,
            "is_anomaly": is_anomaly,
            "anomaly_score": anomaly_score,
            "component_scores": risk_output.component_scores,
            "top_risk_factors": risk_output.top_risk_factors,
            "recommended_action": risk_output.recommended_action,
        }
        logger.info(f"[{shipment_id}] risk={risk_output.risk_score} anomaly={is_anomaly}")
        return jsonify(response), 200

    except Exception as e:
        logger.exception(f"Error analyzing shipment: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False)

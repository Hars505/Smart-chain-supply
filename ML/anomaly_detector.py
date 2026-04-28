# ml/anomaly_detector.py
"""
Isolation Forest anomaly detector for shipment behavior.
Detects: stopped vessels, unusual dwell times, route deviations, speed spikes.
"""

import os
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, confusion_matrix
from typing import Tuple

# Determine model path relative to this file
_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.dirname(_THIS_DIR)
MODEL_PATH = os.path.join(_PROJECT_ROOT, "ML", "models", "anomaly_detector.pkl")

FEATURES = [
    "speed_kmh",
    "dwell_time_hours",
    "transit_days",
    "distance_km",
    "on_time_rate",
    "stops_count",
    "weather_severity",
    "port_congestion",
    "hours_stationary",
    "speed_variance",
]


class ShipmentAnomalyDetector:
    """
    Wraps an Isolation Forest pipeline with StandardScaler.
    contamination is set to ~9% (matching real-world disruption rates).
    """

    def __init__(self, contamination: float = 0.09) -> None:
        self.contamination = contamination
        self.pipeline: Pipeline | None = None
        self._load_or_init()

    def _load_or_init(self) -> None:
        if os.path.exists(MODEL_PATH):
            self.pipeline = joblib.load(MODEL_PATH)
            print(f"[AnomalyDetector] Loaded model from {MODEL_PATH}")
        else:
            print("[AnomalyDetector] No saved model — call .train() first.")

    def train(self, df: pd.DataFrame) -> dict:
        """
        Train on NORMAL records only (unsupervised).
        Returns evaluation metrics using the labeled test split.
        """
        normal_df = df[df["label"] == 0].copy()
        X_normal = normal_df[FEATURES].fillna(0).values

        self.pipeline = Pipeline([
            ("scaler", StandardScaler()),
            ("iso_forest", IsolationForest(
                n_estimators=200,
                contamination=self.contamination,
                max_samples="auto",
                random_state=42,
                n_jobs=-1,
            ))
        ])

        self.pipeline.fit(X_normal)
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        joblib.dump(self.pipeline, MODEL_PATH)
        print(f"[AnomalyDetector] Trained + saved to {MODEL_PATH}")

        # Evaluate on full dataset (normal + anomaly)
        X_all = df[FEATURES].fillna(0).values
        y_true = df["label"].values
        raw_preds = self.pipeline.predict(X_all)
        # Isolation Forest: -1 = anomaly, 1 = normal  =>  map to 1/0
        y_pred = np.where(raw_preds == -1, 1, 0)

        report = classification_report(y_true, y_pred, output_dict=True)
        print("\n--- Anomaly Detection Report ---")
        print(classification_report(y_true, y_pred, target_names=["normal", "anomaly"]))
        print("Confusion Matrix:\n", confusion_matrix(y_true, y_pred))
        return report

    def predict(self, shipment_features: dict) -> Tuple[bool, float]:
        """
        Returns (is_anomaly: bool, anomaly_score: float 0-1).
        anomaly_score closer to 1 = more anomalous.
        """
        if self.pipeline is None:
            raise RuntimeError("Model not trained. Call .train() first.")

        row = pd.DataFrame([{f: shipment_features.get(f, 0) for f in FEATURES}])
        X = row[FEATURES].fillna(0).values

        raw_pred = self.pipeline.predict(X)[0]        # -1 or 1
        raw_score = self.pipeline.score_samples(X)[0] # negative log-likelihood

        # Normalize score to 0-1 (lower score = more anomalous in IF)
        # Typical range: -0.7 to 0.1
        normalized = float(np.clip((raw_score + 0.7) / 0.8, 0, 1))
        anomaly_score = 1.0 - normalized  # invert: 1 = very anomalous

        is_anomaly = raw_pred == -1
        return is_anomaly, round(anomaly_score, 4)

    def predict_batch(self, df: pd.DataFrame) -> pd.DataFrame:
        X = df[FEATURES].fillna(0).values
        raw_preds = self.pipeline.predict(X)
        raw_scores = self.pipeline.score_samples(X)
        normalized = np.clip((raw_scores + 0.7) / 0.8, 0, 1)
        df = df.copy()
        df["is_anomaly"] = raw_preds == -1
        df["anomaly_score"] = (1.0 - normalized).round(4)
        return df

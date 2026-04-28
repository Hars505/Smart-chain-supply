# data/synthetic_training.py
"""
Generates realistic training data for the Isolation Forest anomaly detector.
Normal patterns + injected anomalies for validation.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import random

LANES = [
    {"name": "Mumbai-Rotterdam", "avg_speed_kmh": 28, "distance_km": 11_000, "avg_dwell_h": 18},
    {"name": "Shanghai-Los-Angeles", "avg_speed_kmh": 32, "distance_km": 10_200, "avg_dwell_h": 24},
    {"name": "Shenzhen-Hamburg", "avg_speed_kmh": 27, "distance_km": 20_300, "avg_dwell_h": 20},
    {"name": "Dubai-New-York", "avg_speed_kmh": 30, "distance_km": 12_700, "avg_dwell_h": 16},
    {"name": "Singapore-Sydney", "avg_speed_kmh": 35, "distance_km": 6_300, "avg_dwell_h": 12},
]

CARRIERS = {
    "MSC":       {"on_time_rate": 0.87, "reliability": 0.91},
    "Maersk":    {"on_time_rate": 0.92, "reliability": 0.95},
    "CMA-CGM":   {"on_time_rate": 0.83, "reliability": 0.88},
    "COSCO":     {"on_time_rate": 0.79, "reliability": 0.84},
    "Evergreen": {"on_time_rate": 0.75, "reliability": 0.80},
}


def generate_normal_record(lane: dict, carrier_name: str, carrier: dict) -> dict:
    speed = np.random.normal(lane["avg_speed_kmh"], lane["avg_speed_kmh"] * 0.12)
    dwell = np.random.normal(lane["avg_dwell_h"], lane["avg_dwell_h"] * 0.20)
    transit_days = lane["distance_km"] / max(speed, 1) / 24
    return {
        "lane": lane["name"],
        "carrier": carrier_name,
        "speed_kmh": max(0, speed),
        "dwell_time_hours": max(0, dwell),
        "transit_days": max(0, transit_days),
        "distance_km": lane["distance_km"],
        "on_time_rate": carrier["on_time_rate"] + np.random.normal(0, 0.03),
        "stops_count": int(np.random.poisson(3)),
        "weather_severity": np.random.beta(2, 5) * 10,
        "port_congestion": np.random.beta(3, 4) * 10,
        "hours_stationary": np.random.exponential(2),
        "speed_variance": abs(np.random.normal(0, 3)),
        "label": 0,  # normal
    }


def inject_anomaly(record: dict, anomaly_type: str) -> dict:
    r = record.copy()
    r["label"] = 1  # anomalous
    if anomaly_type == "stopped":
        r["speed_kmh"] = np.random.uniform(0, 0.5)
        r["hours_stationary"] = np.random.uniform(14, 72)
    elif anomaly_type == "speed_spike":
        r["speed_kmh"] = np.random.uniform(80, 120)
        r["speed_variance"] = np.random.uniform(25, 40)
    elif anomaly_type == "long_dwell":
        r["dwell_time_hours"] = np.random.uniform(72, 200)
    elif anomaly_type == "route_deviation":
        r["distance_km"] = r["distance_km"] * np.random.uniform(1.4, 2.0)
        r["transit_days"] = r["transit_days"] * 1.8
    return r


def generate_dataset(n_normal: int = 8000, n_anomaly: int = 800) -> pd.DataFrame:
    records = []

    # Normal records
    for _ in range(n_normal):
        lane = random.choice(LANES)
        carrier_name, carrier = random.choice(list(CARRIERS.items()))
        records.append(generate_normal_record(lane, carrier_name, carrier))

    # Anomalous records
    anomaly_types = ["stopped", "speed_spike", "long_dwell", "route_deviation"]
    for _ in range(n_anomaly):
        lane = random.choice(LANES)
        carrier_name, carrier = random.choice(list(CARRIERS.items()))
        base = generate_normal_record(lane, carrier_name, carrier)
        records.append(inject_anomaly(base, random.choice(anomaly_types)))

    df = pd.DataFrame(records)
    df = df.sample(frac=1).reset_index(drop=True)  # shuffle
    return df


if __name__ == "__main__":
    df = generate_dataset()
    df.to_csv("data/training_data.csv", index=False)
    print(f"Generated {len(df)} records  |  Normal: {(df.label==0).sum()}  |  Anomaly: {(df.label==1).sum()}")

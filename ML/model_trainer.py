# ml/model_trainer.py
"""
One-shot training pipeline.
Run: python -m ml.model_trainer
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pandas as pd
from data.synthetic_training import generate_dataset
from ml.anomaly_detector import ShipmentAnomalyDetector


def run_training():
    print("=== Supply Chain AI — Training Pipeline ===\n")

    # 1. Generate (or load) training data
    data_path = "data/training_data.csv"
    if os.path.exists(data_path):
        print(f"Loading existing dataset from {data_path}")
        df = pd.read_csv(data_path)
    else:
        print("Generating synthetic training dataset...")
        df = generate_dataset(n_normal=10000, n_anomaly=1000)
        os.makedirs("data", exist_ok=True)
        df.to_csv(data_path, index=False)
        print(f"Saved {len(df)} records to {data_path}")

    print(f"\nDataset shape: {df.shape}")
    print(f"Normal: {(df.label==0).sum()}  |  Anomaly: {(df.label==1).sum()}\n")

    # 2. Train anomaly detector
    print("--- Training Isolation Forest Anomaly Detector ---")
    detector = ShipmentAnomalyDetector(contamination=0.09)
    metrics = detector.train(df)

    print("\n--- Training Complete ---")
    print(f"Anomaly F1: {metrics.get('1', {}).get('f1-score', 'N/A'):.3f}")
    print(f"Normal F1:  {metrics.get('0', {}).get('f1-score', 'N/A'):.3f}")
    print("\nAll models saved to ML/models/")


if __name__ == "__main__":
    run_training()

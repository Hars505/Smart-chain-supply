import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export async function reportAnomaly(type, description, severityLevel) {
  try {
    const anomaliesRef = collection(db, "anomalies");

    await addDoc(anomaliesRef, {
      anomalyType: type, // e.g., "cost_spike", "route_delay"
      description: description,
      severity: severityLevel, // e.g., "high", "medium", "low"
      resolved: false,
      detectedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error reporting anomaly: ", error);
  }
}

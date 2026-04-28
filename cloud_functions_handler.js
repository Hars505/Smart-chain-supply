// firebase/functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

const AI_FLASK_URL = process.env.FLASK_AI_URL || "https://your-ai-api.run.app";
const FASTAPI_WEBHOOK = process.env.FASTAPI_URL || "https://your-fastapi.run.app";

/**
 * Fires on every Firestore shipment document update.
 * Calls the Flask AI API -> writes risk score back to Firestore.
 * Also notifies the FastAPI WebSocket layer via webhook.
 */
exports.onShipmentUpdated = functions
  .runWith({ timeoutSeconds: 30, memory: "256MB" })
  .firestore.document("shipments/{shipmentId}")
  .onWrite(async (change, context) => {
    const shipmentId = context.params.shipmentId;

    // Skip deletions
    if (!change.after.exists) return null;

    const data = change.after.data();

    // Avoid infinite loop: skip if only risk_score/is_anomaly changed
    const before = change.before.exists ? change.before.data() : {};
    const positionChanged =
      before.lat !== data.lat ||
      before.lng !== data.lng ||
      before.status !== data.status;

    if (!positionChanged) {
      console.log(`[${shipmentId}] Skipping — no position change.`);
      return null;
    }

    console.log(`[${shipmentId}] Position changed — calling AI API...`);

    try {
      // 1. Call Flask AI endpoint
      const aiPayload = {
        shipment_id: shipmentId,
        origin: data.origin,
        destination: data.destination,
        carrier: data.carrier,
        lat: data.lat,
        lng: data.lng,
        speed_kmh: data.speed_kmh || 20,
        dwell_time_hours: data.dwell_time_hours || 0,
        hours_stationary: data.hours_stationary || 0,
        weather_severity: data.weather_severity || 3,
        transit_countries: data.transit_countries || [],
        stops_count: data.stops_count || 0,
        on_time_rate: data.on_time_rate || 0.85,
        distance_km: data.distance_km || 11000,
        transit_days: data.transit_days || 18,
        speed_variance: data.speed_variance || 2,
      };

      const aiResponse = await axios.post(`${AI_FLASK_URL}/analyze`, aiPayload, {
        timeout: 15000,
        headers: { "Content-Type": "application/json" },
      });

      const aiResult = aiResponse.data;
      console.log(`[${shipmentId}] AI result: risk=${aiResult.risk_score} anomaly=${aiResult.is_anomaly}`);

      // 2. Write risk score back to Firestore
      await change.after.ref.update({
        risk_score: aiResult.risk_score,
        risk_level: aiResult.risk_level,
        is_anomaly: aiResult.is_anomaly,
        anomaly_score: aiResult.anomaly_score,
        top_risk_factors: aiResult.top_risk_factors,
        recommended_action: aiResult.recommended_action,
        ai_last_updated: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 3. Write to Realtime Database if anomaly or high risk
      if (aiResult.is_anomaly || aiResult.risk_score > 65) {
        const rtdb = admin.database();
        await rtdb.ref(`alerts/${shipmentId}`).set({
          shipment_id: shipmentId,
          risk_score: aiResult.risk_score,
          risk_level: aiResult.risk_level,
          is_anomaly: aiResult.is_anomaly,
          message: aiResult.recommended_action,
          top_risk_factors: aiResult.top_risk_factors,
          timestamp: new Date().toISOString(),
        });
        console.log(`[${shipmentId}] Alert written to RTDB.`);
      }

      // 4. Notify FastAPI WebSocket layer
      try {
        await axios.post(`${FASTAPI_WEBHOOK}/webhook/risk-update`, {
          shipment_id: shipmentId,
          risk_score: aiResult.risk_score,
          risk_level: aiResult.risk_level,
          is_anomaly: aiResult.is_anomaly,
          anomaly_score: aiResult.anomaly_score,
          top_risk_factors: aiResult.top_risk_factors,
          recommended_action: aiResult.recommended_action,
        }, { timeout: 5000 });
      } catch (wsErr) {
        console.warn(`[${shipmentId}] WebSocket webhook failed (non-critical): ${wsErr.message}`);
      }

      return { success: true, shipment_id: shipmentId, risk_score: aiResult.risk_score };

    } catch (error) {
      console.error(`[${shipmentId}] Error calling AI API: ${error.message}`);

      // Write error state to Firestore so dashboard knows
      await change.after.ref.update({
        ai_error: error.message,
        ai_last_updated: admin.firestore.FieldValue.serverTimestamp(),
      });

      return null;
    }
  });


/**
 * Scheduled function: re-score all active shipments every 5 minutes.
 * Catches any shipments that missed the onWrite trigger.
 */
exports.scheduledRescoring = functions
  .runWith({ timeoutSeconds: 540, memory: "512MB" })
  .pubsub.schedule("every 5 minutes")
  .onRun(async () => {
    const db = admin.firestore();
    const snapshot = await db
      .collection("shipments")
      .where("status", "in", ["in_transit", "at_port", "customs_hold"])
      .get();

    console.log(`[Scheduled] Rescoring ${snapshot.size} shipments...`);

    const batchPromises = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      // Reuse the same AI call logic
      batchPromises.push(
        axios.post(`${AI_FLASK_URL}/analyze`, {
          shipment_id: doc.id,
          ...data,
        }, { timeout: 15000 }).then(async (res) => {
          await doc.ref.update({
            risk_score: res.data.risk_score,
            risk_level: res.data.risk_level,
            is_anomaly: res.data.is_anomaly,
            ai_last_updated: admin.firestore.FieldValue.serverTimestamp(),
          });
        }).catch((err) => {
          console.error(`[Scheduled] Failed for ${doc.id}: ${err.message}`);
        })
      );
    });

    await Promise.allSettled(batchPromises);
    console.log("[Scheduled] Rescoring complete.");
    return null;
  });

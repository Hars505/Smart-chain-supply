import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export async function createShipment(
  orderId,
  carrierName,
  trackingNum,
  estimatedDeliveryDate,
) {
  try {
    const shipmentsRef = collection(db, "shipments");

    // Create the core shipment document
    const docRef = await addDoc(shipmentsRef, {
      orderId: orderId, // Crucial: This links the shipment back to the customer's order
      carrier: carrierName,
      trackingNumber: trackingNum,
      status: "dispatched",
      estimatedDelivery: estimatedDeliveryDate, // Standard JavaScript Date object works perfectly here
      createdAt: serverTimestamp(),
    });

    console.log("Shipment successfully created with ID: ", docRef.id);

    // Return the ID so your app can use it immediately
    return docRef.id;
  } catch (error) {
    console.error("Error creating shipment: ", error);
  }
}

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase"; // Adjust path to your firebase config file

export async function createNewOrder(customerId, orderTotal, items) {
  try {
    const ordersRef = collection(db, "orders");

    // addDoc automatically generates a unique ID for this order
    const docRef = await addDoc(ordersRef, {
      customerId: customerId,
      status: "processing",
      totalAmount: orderTotal,
      orderDate: serverTimestamp(), // Best practice for consistent timestamps

      // Store order items directly in the document as an array
      items: items,
    });

    console.log("Order created with ID: ", docRef.id);
  } catch (error) {
    console.error("Error adding order: ", error);
  }
}

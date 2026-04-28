import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "./firebase"; // Your config file

// This function takes a callback to update your React state
export function listenToShipments(callback) {
  // Query the shipments collection, ordering by creation date
  const shipmentsRef = collection(db, "shipments");
  const q = query(shipmentsRef, orderBy("createdAt", "desc"));

  // onSnapshot listens to the database. If anything changes, it runs again instantly.
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const shipments = [];
    querySnapshot.forEach((doc) => {
      shipments.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Pass the formatted data back to the React component
    callback(shipments);
  });

  // Return the unsubscribe function so we can stop listening when the user leaves the page
  return unsubscribe;
}

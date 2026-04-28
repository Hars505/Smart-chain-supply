// frontend/src/ui/CreateShipmentForm.tsx (Example)
import { useState, FormEvent } from "react";
import { createShipment } from "../../../firebase/shipments";

export function CreateShipmentForm() {
  const [orderId, setOrderId] = useState("");
  const [carrier, setCarrier] = useState("");

  const handleDispatch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 1. Call the Firebase function
    const newShipmentId = await createShipment(
      orderId,
      carrier,
      "TRACK123",
      new Date("2023-12-01"),
    );

    // 2. Update your UI
    alert(`Success! Shipment created with ID: ${newShipmentId}`);
  };

  return (
    <form onSubmit={handleDispatch}>
      {/* Your beautiful UI inputs here */}
      <button type="submit">Dispatch Freight</button>
    </form>
  );
}

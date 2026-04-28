import React, { useState, useEffect } from "react";
import { listenToShipments } from "../services/db-read";

export default function ShipmentDashboard() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Start listening to Firebase when the component loads
    const unsubscribe = listenToShipments((liveData) => {
      setShipments(liveData);
      setLoading(false);
    });

    // Cleanup: Stop listening when the component unmounts to save bandwidth
    return () => unsubscribe();
  }, []);

  if (loading) return <p>Loading live supply chain data...</p>;

  return (
    <div className="dashboard-container">
      <h2>Live Shipments</h2>

      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th>Tracking ID</th>
            <th>Carrier</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {shipments.map((shipment) => (
            <tr key={shipment.id}>
              <td>{shipment.trackingNumber}</td>
              <td>{shipment.carrier}</td>
              <td>
                <span className={`status ${shipment.status}`}>
                  {shipment.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

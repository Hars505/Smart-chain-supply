import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AlertPanel } from '../alerts/AlertPanel';
import { useUIStore } from '../../store/useUIStore';
import { useEffect } from 'react';
import { useShipmentStore } from '../../store/useShipmentStore';
import { wsService } from '../../services/websocketService';
import type { WSMessage } from '../../types';

export function AppLayout() {
  const { alertPanelOpen, setWsConnected } = useUIStore();
  const { fetchShipments, fetchAlerts, updateShipmentRisk, addAlert } = useShipmentStore();

  useEffect(() => {
    fetchShipments();
    fetchAlerts();

    // WebSocket connection
    wsService.connect('all');

    const unsub = wsService.subscribe((msg: WSMessage) => {
      if (msg.event === 'risk_updated' && msg.shipment_id && msg.risk_score !== undefined && msg.risk_level && msg.is_anomaly !== undefined) {
        updateShipmentRisk(msg.shipment_id, msg.risk_score, msg.risk_level, msg.is_anomaly);
      }
      if (msg.event === 'reroute_recommendation' && msg.data) {
        const d = msg.data as { shipment_id: string; type: string; severity: string; message: string; risk_score: number; alternate_routes: [] };
        addAlert({
          id: `WS-${Date.now()}`,
          shipment_id: d.shipment_id,
          type: d.type as never,
          severity: d.severity as never,
          message: d.message,
          risk_score: d.risk_score,
          alternate_routes: d.alternate_routes || [],
          created_at: new Date().toISOString(),
        });
      }
    });

    // Simulate WS connected after 1s (mock mode)
    const t = setTimeout(() => setWsConnected(true), 1000);

    return () => {
      unsub();
      wsService.disconnect();
      clearTimeout(t);
    };
  }, []);

  return (
    <div className="flex h-screen bg-transparent overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <main className="flex-1 overflow-hidden flex">
          <div className="flex-1 overflow-y-auto">
            <Outlet />
          </div>
          {alertPanelOpen && <AlertPanel />}
        </main>
      </div>
    </div>
  );
}

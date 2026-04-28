import { create } from 'zustand';
import type { Shipment, Alert, KPIData } from '../types';
import { shipmentService } from '../services/shipmentService';
import { mockKPIs } from '../data/mockRiskData';

interface ShipmentState {
  shipments: Shipment[];
  alerts: Alert[];
  kpis: KPIData;
  selectedShipment: Shipment | null;
  loading: boolean;
  alertsLoading: boolean;
  error: string | null;

  fetchShipments: () => Promise<void>;
  fetchAlerts: () => Promise<void>;
  selectShipment: (shipment: Shipment | null) => void;
  updateShipmentRisk: (id: string, risk_score: number, risk_level: Shipment['risk_level'], is_anomaly: boolean) => void;
  addAlert: (alert: Alert) => void;
}

export const useShipmentStore = create<ShipmentState>((set, get) => ({
  shipments: [],
  alerts: [],
  kpis: mockKPIs,
  selectedShipment: null,
  loading: false,
  alertsLoading: false,
  error: null,

  fetchShipments: async () => {
    set({ loading: true, error: null });
    try {
      const shipments = await shipmentService.getShipments();
      const total = shipments.length;
      const delayed = shipments.filter((s) => s.status === 'delayed' || s.status === 'customs_hold').length;
      const avgRisk = shipments.reduce((a, s) => a + s.risk_score, 0) / (total || 1);
      const onTime = shipments.filter((s) => s.status === 'in_transit' || s.status === 'in-transit').length;

      set({
        shipments,
        loading: false,
        kpis: {
          ...mockKPIs,
          total_shipments: total + 235,
          delayed_count: delayed,
          avg_risk_score: Math.round(avgRisk * 10) / 10,
          on_time_percentage: Math.round((onTime / (total || 1)) * 100 * 10) / 10,
        },
      });
    } catch (err) {
      set({ loading: false, error: String(err) });
    }
  },

  fetchAlerts: async () => {
    set({ alertsLoading: true });
    try {
      const alerts = await shipmentService.getAlerts();
      set({ alerts, alertsLoading: false });
    } catch {
      set({ alertsLoading: false });
    }
  },

  selectShipment: (shipment) => set({ selectedShipment: shipment }),

  updateShipmentRisk: (id, risk_score, risk_level, is_anomaly) => {
    set((state) => ({
      shipments: state.shipments.map((s) =>
        s.id === id ? { ...s, risk_score, risk_level, is_anomaly } : s
      ),
    }));
  },

  addAlert: (alert) => {
    set((state) => ({ alerts: [alert, ...state.alerts].slice(0, 50) }));
  },
}));

import { api } from './api';
import type { Shipment, Alert, RerouteResponse, RiskScore } from '../types';
import { mockShipments } from '../data/mockShipments';
import { mockAlerts } from '../data/mockAlerts';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export const shipmentService = {
  async getShipments(): Promise<Shipment[]> {
    if (USE_MOCK) return mockShipments;
    const res = await api.get<Shipment[]>('/shipments/live');
    return res.data;
  },

  async getShipment(id: string): Promise<Shipment> {
    if (USE_MOCK) {
      const s = mockShipments.find((s) => s.id === id);
      if (!s) throw new Error(`Shipment ${id} not found`);
      return s;
    }
    const res = await api.get<Shipment>(`/shipments/${id}`);
    return res.data;
  },

  async getAlerts(hours = 24): Promise<Alert[]> {
    if (USE_MOCK) return mockAlerts;
    const res = await api.get<Alert[]>(`/alerts?hours=${hours}`);
    return res.data;
  },

  async getRiskScore(shipmentId: string): Promise<RiskScore> {
    const res = await api.get<RiskScore>(`/risk-score/${shipmentId}`);
    return res.data;
  },

  async rerouteShipment(shipmentId: string, reason = 'manual'): Promise<RerouteResponse> {
    const res = await api.post<RerouteResponse>(`/reroute/${shipmentId}`, { reason });
    return res.data;
  },

  async predictETA(shipmentId: string): Promise<{ eta_days: number; confidence: number }> {
    const res = await api.get(`/predict-eta/${shipmentId}`);
    return res.data;
  },
};

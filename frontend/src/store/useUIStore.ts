import { create } from 'zustand';

interface UIState {
  sidebarCollapsed: boolean;
  alertPanelOpen: boolean;
  shipmentDrawerOpen: boolean;
  wsConnected: boolean;
  theme: 'dark';

  toggleSidebar: () => void;
  toggleAlertPanel: () => void;
  setShipmentDrawer: (open: boolean) => void;
  setWsConnected: (connected: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  alertPanelOpen: true,
  shipmentDrawerOpen: false,
  wsConnected: false,
  theme: 'dark',

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleAlertPanel: () => set((s) => ({ alertPanelOpen: !s.alertPanelOpen })),
  setShipmentDrawer: (open) => set({ shipmentDrawerOpen: open }),
  setWsConnected: (connected) => set({ wsConnected: connected }),
}));

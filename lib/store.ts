import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Device {
  imei: string;
  make?: string;
  model?: string;
  status: string;
  lastSeen?: Date;
}

interface Alert {
  id: string;
  imei: string;
  type: string;
  narrative?: string;
  read: boolean;
  ts: Date;
}

interface AppState {
  user: User | null;
  devices: Device[];
  alerts: Alert[];
  selectedDevice: string | null;
  setUser: (user: User | null) => void;
  setDevices: (devices: Device[]) => void;
  setAlerts: (alerts: Alert[]) => void;
  setSelectedDevice: (imei: string | null) => void;
  addAlert: (alert: Alert) => void;
  markAlertRead: (alertId: string) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  devices: [],
  alerts: [],
  selectedDevice: null,
  setUser: (user) => set({ user }),
  setDevices: (devices) => set({ devices }),
  setAlerts: (alerts) => set({ alerts }),
  setSelectedDevice: (imei) => set({ selectedDevice: imei }),
  addAlert: (alert) => set((state) => ({ alerts: [alert, ...state.alerts] })),
  markAlertRead: (alertId) =>
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === alertId ? { ...a, read: true } : a)),
    })),
}));

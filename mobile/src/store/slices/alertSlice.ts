// store/slices/alertSlice.ts - Alert state management
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Alert {
  id: string;
  deviceId: string;
  type: 'theft' | 'location' | 'panic' | 'cooperation' | 'recovery';
  message: string;
  timestamp: string;
  read: boolean;
}

interface AlertState {
  alerts: Alert[];
  unreadCount: number;
  loading: boolean;
}

const initialState: AlertState = {
  alerts: [],
  unreadCount: 0,
  loading: false,
};

const alertSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    addAlert: (state, action: PayloadAction<Alert>) => {
      state.alerts.unshift(action.payload);
      if (!action.payload.read) {
        state.unreadCount += 1;
      }
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const alert = state.alerts.find((a) => a.id === action.payload);
      if (alert && !alert.read) {
        alert.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: (state) => {
      state.alerts.forEach((alert) => {
        alert.read = true;
      });
      state.unreadCount = 0;
    },
    removeAlert: (state, action: PayloadAction<string>) => {
      const alert = state.alerts.find((a) => a.id === action.payload);
      if (alert && !alert.read) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.alerts = state.alerts.filter((a) => a.id !== action.payload);
    },
    clearAlerts: (state) => {
      state.alerts = [];
      state.unreadCount = 0;
    },
  },
});

export const { addAlert, markAsRead, markAllAsRead, removeAlert, clearAlerts } = alertSlice.actions;
export default alertSlice.reducer;

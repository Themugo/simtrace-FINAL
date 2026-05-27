// store/index.ts - Redux store configuration
import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import deviceSlice from './slices/deviceSlice';
import alertSlice from './slices/alertSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    devices: deviceSlice,
    alerts: alertSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

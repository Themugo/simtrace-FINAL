// store/slices/deviceSlice.ts - Device state management
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { deviceService, Device, DeviceLocation } from '@api/devices';

interface DeviceState {
  devices: Device[];
  selectedDevice: Device | null;
  deviceLocations: Record<string, DeviceLocation>;
  loading: boolean;
  error: string | null;
  trackingEnabled: boolean;
}

const initialState: DeviceState = {
  devices: [],
  selectedDevice: null,
  deviceLocations: {},
  loading: false,
  error: null,
  trackingEnabled: true,
};

// Async thunks
export const fetchDevices = createAsyncThunk('devices/fetchAll', async () => {
  return await deviceService.getDevices();
});

export const fetchDevice = createAsyncThunk('devices/fetchOne', async (deviceId: string) => {
  return await deviceService.getDevice(deviceId);
});

export const addDevice = createAsyncThunk('devices/add', async (data: any) => {
  return await deviceService.addDevice(data);
});

export const updateDevice = createAsyncThunk(
  'devices/update',
  async ({ deviceId, data }: { deviceId: string; data: any }) => {
    return await deviceService.updateDevice(deviceId, data);
  }
);

export const deleteDevice = createAsyncThunk('devices/delete', async (deviceId: string) => {
  await deviceService.deleteDevice(deviceId);
  return deviceId;
});

export const fetchDeviceLocation = createAsyncThunk(
  'devices/fetchLocation',
  async (deviceId: string) => {
    return await deviceService.getDeviceLocation(deviceId);
  }
);

export const enableTracking = createAsyncThunk('devices/enableTracking', async (deviceId: string) => {
  return await deviceService.enableTracking(deviceId);
});

export const disableTracking = createAsyncThunk('devices/disableTracking', async (deviceId: string) => {
  return await deviceService.disableTracking(deviceId);
});

export const reportTheft = createAsyncThunk(
  'devices/reportTheft',
  async ({ deviceId, data }: { deviceId: string; data: any }) => {
    await deviceService.reportTheft(deviceId, data);
    return deviceId;
  }
);

export const markRecovered = createAsyncThunk('devices/markRecovered', async (deviceId: string) => {
  return await deviceService.markRecovered(deviceId);
});

const deviceSlice = createSlice({
  name: 'devices',
  initialState,
  reducers: {
    selectDevice: (state, action: PayloadAction<Device | null>) => {
      state.selectedDevice = action.payload;
    },
    updateDeviceLocation: (state, action: PayloadAction<{ deviceId: string; location: DeviceLocation }>) => {
      state.deviceLocations[action.payload.deviceId] = action.payload.location;
    },
    clearError: (state) => {
      state.error = null;
    },
    setTrackingEnabled: (state, action: PayloadAction<boolean>) => {
      state.trackingEnabled = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Devices
      .addCase(fetchDevices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDevices.fulfilled, (state, action) => {
        state.loading = false;
        state.devices = action.payload;
      })
      .addCase(fetchDevices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch devices';
      })
      // Fetch Device
      .addCase(fetchDevice.fulfilled, (state, action) => {
        state.selectedDevice = action.payload;
      })
      // Add Device
      .addCase(addDevice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addDevice.fulfilled, (state, action) => {
        state.loading = false;
        state.devices.push(action.payload);
      })
      .addCase(addDevice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add device';
      })
      // Update Device
      .addCase(updateDevice.fulfilled, (state, action) => {
        const index = state.devices.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) {
          state.devices[index] = action.payload;
        }
        if (state.selectedDevice?.id === action.payload.id) {
          state.selectedDevice = action.payload;
        }
      })
      // Delete Device
      .addCase(deleteDevice.fulfilled, (state, action) => {
        state.devices = state.devices.filter((d) => d.id !== action.payload);
        if (state.selectedDevice?.id === action.payload) {
          state.selectedDevice = null;
        }
        delete state.deviceLocations[action.payload];
      })
      // Fetch Device Location
      .addCase(fetchDeviceLocation.fulfilled, (state, action) => {
        state.deviceLocations[action.payload.deviceId] = action.payload;
      })
      // Report Theft
      .addCase(reportTheft.fulfilled, (state, action) => {
        const device = state.devices.find((d) => d.id === action.payload);
        if (device) {
          device.status = 'stolen';
        }
      })
      // Mark Recovered
      .addCase(markRecovered.fulfilled, (state, action) => {
        const device = state.devices.find((d) => d.id === action.payload.id);
        if (device) {
          device.status = 'recovered';
        }
      });
  },
});

export const { selectDevice, updateDeviceLocation, clearError, setTrackingEnabled } = deviceSlice.actions;
export default deviceSlice.reducer;

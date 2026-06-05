// store/slices/authSlice.ts - Authentication state management
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';
import { authService } from '@api/auth';

interface AuthState {
  isAuthenticated: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  } | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  biometricEnabled: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null,
  biometricEnabled: false,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async ({ officialEmail, otpNumber }: { officialEmail: string; otpNumber: string }) => {
    const response = await authService.login({ officialEmail, otpNumber });
    if (response.token) {
      await SecureStore.setItemAsync('authToken', response.token);
    }
    return response;
  }
);

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async ({ emailId, token }: { emailId: string; token: string }) => {
    const response = await authService.verifyEmail({ emailId, token });
    if (response.token) {
      await SecureStore.setItemAsync('authToken', response.token);
    }
    return response;
  }
);

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ otpId, otpNumber }: { otpId: string; otpNumber: string }) => {
    const response = await authService.verifyOtp({ otpId, otpNumber });
    if (response.token) {
      await SecureStore.setItemAsync('authToken', response.token);
    }
    return response;
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
  await SecureStore.deleteItemAsync('authToken');
  await SecureStore.deleteItemAsync('biometricEnabled');
});

export const checkAuthStatus = createAsyncThunk('auth/checkStatus', async () => {
  const token = await SecureStore.getItemAsync('authToken');
  const biometricEnabled = await SecureStore.getItemAsync('biometricEnabled');
  return { token, biometricEnabled: biometricEnabled === 'true' };
});

export const enableBiometric = createAsyncThunk(
  'auth/enableBiometric',
  async (enabled: boolean) => {
    await SecureStore.setItemAsync('biometricEnabled', enabled.toString());
    return enabled;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<any>) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = action.payload.success;
        state.user = action.payload.user || null;
        state.token = action.payload.token || null;
        state.error = action.payload.error || null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Login failed';
      })
      // Verify Email
      .addCase(verifyEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = action.payload.success;
        state.user = action.payload.user || null;
        state.token = action.payload.token || null;
        state.error = action.payload.error || null;
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Verification failed';
      })
      // Verify OTP
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = action.payload.success;
        state.user = action.payload.user || null;
        state.token = action.payload.token || null;
        state.error = action.payload.error || null;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'OTP verification failed';
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = null;
      })
      // Check Auth Status
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.biometricEnabled = action.payload.biometricEnabled;
        state.isAuthenticated = !!action.payload.token;
      })
      // Enable Biometric
      .addCase(enableBiometric.fulfilled, (state, action) => {
        state.biometricEnabled = action.payload;
      });
  },
});

export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer;

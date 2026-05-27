// api/auth.ts - Authentication API calls
import apiClient from './client';
import { z } from 'zod';

// Validation schemas
export const loginSchema = z.object({
  officialEmail: z.string().email(),
  otpNumber: z.string().min(8),
});

export const verifyEmailSchema = z.object({
  emailId: z.string(),
  token: z.string(),
});

export const verifyOtpSchema = z.object({
  otpId: z.string(),
  otpNumber: z.string().min(8),
});

// Types
export interface LoginRequest {
  officialEmail: string;
  otpNumber: string;
}

export interface VerifyEmailRequest {
  emailId: string;
  token: string;
}

export interface VerifyOtpRequest {
  otpId: string;
  otpNumber: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  error?: string;
}

// API functions
export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post('/dashboard-security/official-emails/login', data);
    return response.data;
  },

  async verifyEmail(data: VerifyEmailRequest): Promise<AuthResponse> {
    const response = await apiClient.post('/dashboard-security/official-emails/:emailId/verify', data);
    return response.data;
  },

  async verifyOtp(data: VerifyOtpRequest): Promise<AuthResponse> {
    const response = await apiClient.post('/dashboard-security/security-otps/:otpId/verify', data);
    return response.data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async refreshToken(): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/refresh');
    return response.data;
  },
};

export default authService;

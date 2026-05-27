// pages/auth/LoginPage.tsx - Login page with official email/OTP authentication
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login } from '@store/slices/authSlice';
import { RootState } from '@store';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const [officialEmail, setOfficialEmail] = useState('');
  const [otpNumber, setOtpNumber] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(login({ officialEmail, otpNumber })).unwrap();
      navigate('/dashboard');
    } catch (err: any) {
      // Error handled by Redux
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            SIMTrace
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Secure Device Tracking System
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleLogin}>
          <TextField
            fullWidth
            label="Official Email"
            type="email"
            value={officialEmail}
            onChange={(e) => setOfficialEmail(e.target.value)}
            margin="normal"
            required
            autoComplete="email"
          />

          <TextField
            fullWidth
            label="Security OTP Number"
            type="password"
            value={otpNumber}
            onChange={(e) => setOtpNumber(e.target.value)}
            margin="normal"
            required
            inputProps={{ maxLength: 8 }}
            helperText="Enter your 8-digit official OTP number"
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ mt: 3 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Login'}
          </Button>
        </Box>

        <Box sx={{ mt: 4, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Note: Only official email and security OTP are accepted for authentication.
            Personal email or phone numbers cannot be used.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

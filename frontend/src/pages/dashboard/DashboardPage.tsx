// pages/dashboard/DashboardPage.tsx - Main dashboard page with device tracking
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchDevices, selectDevice } from '@store/slices/deviceSlice';
import { RootState } from '@store';
import { Device } from '@api/devices';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Add as AddIcon, Warning as WarningIcon } from '@mui/icons-material';

export default function DashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { devices, selectedDevice, loading } = useSelector((state: RootState) => state.devices);
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      await dispatch(fetchDevices()).unwrap();
    } catch (error) {
      console.error('Failed to load devices');
    }
  };

  const handleDevicePress = (device: Device) => {
    dispatch(selectDevice(device));
    navigate(`/devices/${device.id}`);
  };

  const handleAddDevice = () => {
    navigate('/devices/add');
  };

  const handlePanicMode = () => {
    if (window.confirm('Are you sure you want to activate panic mode for all devices?')) {
      // TODO: Implement panic mode activation
      alert('Panic mode activated for all devices');
    }
  };

  const activeDevices = devices.filter(d => d.status === 'active');
  const stolenDevices = devices.filter(d => d.status === 'stolen');
  const recoveredDevices = devices.filter(d => d.status === 'recovered');

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome, {user?.name || 'User'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track and protect your devices from any device
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={4}>
          <Card>
            <CardContent>
              <Typography variant="h3" color="primary">
                {activeDevices.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Devices
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card sx={{ bgcolor: 'warning.light' }}>
            <CardContent>
              <Typography variant="h3" color="warning.dark">
                {stolenDevices.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Stolen Devices
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card sx={{ bgcolor: 'success.light' }}>
            <CardContent>
              <Typography variant="h3" color="success.dark">
                {recoveredDevices.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Recovered Devices
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddDevice}
          size="large"
        >
          Add Device
        </Button>
        <Button
          variant="contained"
          color="error"
          startIcon={<WarningIcon />}
          onClick={handlePanicMode}
          size="large"
        >
          Panic Mode
        </Button>
      </Box>

      <Typography variant="h5" component="h2" gutterBottom>
        Your Devices
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : devices.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          No devices added yet. Add your first device to start tracking.
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {devices.map((device) => (
            <Grid item xs={12} md={6} key={device.id}>
              <Card
                sx={{ cursor: 'pointer' }}
                onClick={() => handleDevicePress(device)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6">
                        {device.nickname || device.deviceName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {device.deviceType}
                      </Typography>
                    </Box>
                    <Chip
                      label={device.status}
                      color={
                        device.status === 'active' ? 'success' :
                        device.status === 'stolen' ? 'error' : 'info'
                      }
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Alert severity="info" sx={{ mt: 4 }}>
        <Typography variant="body2">
          Access your device tracking from any device - desktop, laptop, tablet, or another phone.
          No need to recover your lost phone to access the service.
        </Typography>
      </Alert>
    </Container>
  );
}

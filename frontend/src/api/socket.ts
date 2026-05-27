// api/socket.ts - Socket.io client for real-time updates
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

class SocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(userId: string, token: string) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        userId,
        token,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();

    return this.socket;
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
    });

    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Event listeners for specific events
  onDeviceLocationUpdate(callback: (data: { deviceId: string; location: any }) => void) {
    this.socket?.on('device:location_update', callback);
  }

  onAlertTriggered(callback: (data: { alertId: string; deviceId: string; type: string }) => void) {
    this.socket?.on('alert:triggered', callback);
  }

  onTheftReported(callback: (data: { deviceId: string; reportId: string }) => void) {
    this.socket?.on('theft:reported', callback);
  }

  onDeviceRecovered(callback: (data: { deviceId: string; recoveryId: string }) => void) {
    this.socket?.on('device:recovered', callback);
  }

  onPanicModeActivated(callback: (data: { deviceId: string; userId: string }) => void) {
    this.socket?.on('panic:activated', callback);
  }

  // Remove event listeners
  offDeviceLocationUpdate(callback: (data: any) => void) {
    this.socket?.off('device:location_update', callback);
  }

  offAlertTriggered(callback: (data: any) => void) {
    this.socket?.off('alert:triggered', callback);
  }

  offTheftReported(callback: (data: any) => void) {
    this.socket?.off('theft:reported', callback);
  }

  offDeviceRecovered(callback: (data: any) => void) {
    this.socket?.off('device:recovered', callback);
  }

  offPanicModeActivated(callback: (data: any) => void) {
    this.socket?.off('panic:activated', callback);
  }

  // Emit events
  emitDevicePing(deviceId: string, location: { latitude: number; longitude: number }) {
    this.socket?.emit('device:ping', { deviceId, location });
  }

  emitPanicMode(deviceId: string) {
    this.socket?.emit('panic:activate', { deviceId });
  }

  emitLocationUpdate(deviceId: string, location: { latitude: number; longitude: number }) {
    this.socket?.emit('location:update', { deviceId, location });
  }
}

export const socketClient = new SocketClient();
export default socketClient;

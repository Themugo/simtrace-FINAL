import { connectDB, User, Device, Alert } from '../db/index.js';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as alertService from '../services/alerts.js';

describe('Alert Service', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGO_URI = uri;
    process.env.JWT_SECRET = 'test-secret-key';
    await connectDB();
  });

  afterAll(async () => {
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Device.deleteMany({});
    await Alert.deleteMany({});
  });

  describe('Alert Creation', () => {
    it('should create a new alert', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        role: 'user',
      });

      const device = await Device.create({
        userId: user._id,
        imei: '356938035643809',
        brand: 'Samsung',
        model: 'Galaxy S21',
        status: 'stolen',
      });

      const alert = await alertService.createAlert({
        deviceId: device._id.toString(),
        type: 'location_update',
        severity: 'high',
        message: 'Device location updated',
      });

      expect(alert).toBeDefined();
      expect(alert.type).toBe('location_update');
      expect(alert.severity).toBe('high');
      expect(alert.deviceId.toString()).toBe(device._id.toString());
    });

    it('should require valid device ID', async () => {
      await expect(
        alertService.createAlert({
          deviceId: '507f1f77bcf86cd799439011',
          type: 'location_update',
          severity: 'high',
          message: 'Device location updated',
        })
      ).rejects.toThrow();
    });
  });

  describe('Alert Notification', () => {
    it('should send notification for high severity alert', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        role: 'user',
        phone: '+254712345678',
      });

      const device = await Device.create({
        userId: user._id,
        imei: '356938035643809',
        brand: 'Samsung',
        model: 'Galaxy S21',
        status: 'stolen',
      });

      const alert = await alertService.createAlert({
        deviceId: device._id.toString(),
        type: 'location_update',
        severity: 'high',
        message: 'Device location updated',
      });

      const notification = await alertService.sendAlertNotification(alert._id.toString());
      expect(notification).toBeDefined();
      expect(notification.status).toBe('sent');
    });

    it('should skip notification for low severity alert', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        role: 'user',
      });

      const device = await Device.create({
        userId: user._id,
        imei: '356938035643809',
        brand: 'Samsung',
        model: 'Galaxy S21',
        status: 'active',
      });

      const alert = await alertService.createAlert({
        deviceId: device._id.toString(),
        type: 'info',
        severity: 'low',
        message: 'Device info update',
      });

      const notification = await alertService.sendAlertNotification(alert._id.toString());
      expect(notification).toBeDefined();
      expect(notification.status).toBe('skipped');
    });
  });

  describe('Alert Acknowledgment', () => {
    it('should acknowledge an alert', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        role: 'user',
      });

      const device = await Device.create({
        userId: user._id,
        imei: '356938035643809',
        brand: 'Samsung',
        model: 'Galaxy S21',
        status: 'stolen',
      });

      const alert = await alertService.createAlert({
        deviceId: device._id.toString(),
        type: 'location_update',
        severity: 'high',
        message: 'Device location updated',
      });

      const acknowledged = await alertService.acknowledgeAlert(
        alert._id.toString(),
        user._id.toString()
      );

      expect(acknowledged).toBeDefined();
      expect(acknowledged.acknowledged).toBe(true);
      expect(acknowledged.acknowledgedBy.toString()).toBe(user._id.toString());
    });

    it('should prevent duplicate acknowledgment', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        role: 'user',
      });

      const device = await Device.create({
        userId: user._id,
        imei: '356938035643809',
        brand: 'Samsung',
        model: 'Galaxy S21',
        status: 'stolen',
      });

      const alert = await alertService.createAlert({
        deviceId: device._id.toString(),
        type: 'location_update',
        severity: 'high',
        message: 'Device location updated',
      });

      await alertService.acknowledgeAlert(alert._id.toString(), user._id.toString());
      
      await expect(
        alertService.acknowledgeAlert(alert._id.toString(), user._id.toString())
      ).rejects.toThrow();
    });
  });

  describe('Alert Escalation', () => {
    it('should escalate unacknowledged high severity alert', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        role: 'user',
      });

      const device = await Device.create({
        userId: user._id,
        imei: '356938035643809',
        brand: 'Samsung',
        model: 'Galaxy S21',
        status: 'stolen',
      });

      const alert = await alertService.createAlert({
        deviceId: device._id.toString(),
        type: 'location_update',
        severity: 'high',
        message: 'Device location updated',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      });

      const escalated = await alertService.escalateAlert(alert._id.toString());
      expect(escalated).toBeDefined();
      expect(escalated.escalated).toBe(true);
      expect(escalated.escalationLevel).toBe(1);
    });

    it('should not escalate recently created alert', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        role: 'user',
      });

      const device = await Device.create({
        userId: user._id,
        imei: '356938035643809',
        brand: 'Samsung',
        model: 'Galaxy S21',
        status: 'stolen',
      });

      const alert = await alertService.createAlert({
        deviceId: device._id.toString(),
        type: 'location_update',
        severity: 'high',
        message: 'Device location updated',
      });

      const escalated = await alertService.escalateAlert(alert._id.toString());
      expect(escalated).toBeDefined();
      expect(escalated.escalated).toBe(false);
    });
  });

  describe('Alert History', () => {
    it('should get alert history for device', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        role: 'user',
      });

      const device = await Device.create({
        userId: user._id,
        imei: '356938035643809',
        brand: 'Samsung',
        model: 'Galaxy S21',
        status: 'stolen',
      });

      await alertService.createAlert({
        deviceId: device._id.toString(),
        type: 'location_update',
        severity: 'high',
        message: 'Device location updated',
      });

      await alertService.createAlert({
        deviceId: device._id.toString(),
        type: 'sim_change',
        severity: 'critical',
        message: 'SIM card changed',
      });

      const history = await alertService.getAlertHistory(device._id.toString());
      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(2);
    });

    it('should return empty array for device with no alerts', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        role: 'user',
      });

      const device = await Device.create({
        userId: user._id,
        imei: '356938035643809',
        brand: 'Samsung',
        model: 'Galaxy S21',
        status: 'active',
      });

      const history = await alertService.getAlertHistory(device._id.toString());
      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(0);
    });
  });
});

import { connectDB, User, Device } from '../db/index.js';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as deviceService from '../services/devices.js';

describe('Device Service', () => {
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
  });

  describe('Device Registration', () => {
    it('should register a new device', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        role: 'user',
      });

      const device = await deviceService.registerDevice(user._id.toString(), {
        imei: '356938035643809',
        brand: 'Samsung',
        model: 'Galaxy S21',
      });

      expect(device).toBeDefined();
      expect(device.imei).toBe('356938035643809');
      expect(device.userId.toString()).toBe(user._id.toString());
    });

    it('should reject duplicate IMEI', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        role: 'user',
      });

      await deviceService.registerDevice(user._id.toString(), {
        imei: '356938035643809',
        brand: 'Samsung',
        model: 'Galaxy S21',
      });

      await expect(
        deviceService.registerDevice(user._id.toString(), {
          imei: '356938035643809',
          brand: 'Samsung',
          model: 'Galaxy S21',
        })
      ).rejects.toThrow();
    });
  });

  describe('Device Update', () => {
    it('should update device information', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        role: 'user',
      });

      const device = await deviceService.registerDevice(user._id.toString(), {
        imei: '356938035643809',
        brand: 'Samsung',
        model: 'Galaxy S21',
      });

      const updatedDevice = await deviceService.updateDevice(device._id.toString(), {
        nickname: 'My Phone',
        color: 'Black',
      });

      expect(updatedDevice).toBeDefined();
      expect(updatedDevice.nickname).toBe('My Phone');
      expect(updatedDevice.color).toBe('Black');
    });

    it('should reject update for non-existent device', async () => {
      await expect(
        deviceService.updateDevice('507f1f77bcf86cd799439011', {
          nickname: 'My Phone',
        })
      ).rejects.toThrow();
    });
  });

  describe('Device Deletion', () => {
    it('should delete a device', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        role: 'user',
      });

      const device = await deviceService.registerDevice(user._id.toString(), {
        imei: '356938035643809',
        brand: 'Samsung',
        model: 'Galaxy S21',
      });

      await deviceService.deleteDevice(device._id.toString(), user._id.toString());
      
      const deletedDevice = await Device.findById(device._id);
      expect(deletedDevice).toBeNull();
    });

    it('should prevent deletion by non-owner', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      const user1 = await User.create({
        name: 'Test User 1',
        email: 'test1@example.com',
        passwordHash,
        role: 'user',
      });

      const user2 = await User.create({
        name: 'Test User 2',
        email: 'test2@example.com',
        passwordHash,
        role: 'user',
      });

      const device = await deviceService.registerDevice(user1._id.toString(), {
        imei: '356938035643809',
        brand: 'Samsung',
        model: 'Galaxy S21',
      });

      await expect(
        deviceService.deleteDevice(device._id.toString(), user2._id.toString())
      ).rejects.toThrow();
    });
  });

  describe('Device Tracking', () => {
    it('should update device location', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        role: 'user',
      });

      const device = await deviceService.registerDevice(user._id.toString(), {
        imei: '356938035643809',
        brand: 'Samsung',
        model: 'Galaxy S21',
      });

      const location = {
        lat: -1.2921,
        lng: 36.8219,
        accuracy: 10,
      };

      const updatedDevice = await deviceService.updateDeviceLocation(
        device._id.toString(),
        location
      );

      expect(updatedDevice).toBeDefined();
      expect(updatedDevice.currentLocation).toEqual(location);
    });

    it('should get device tracking history', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        role: 'user',
      });

      const device = await deviceService.registerDevice(user._id.toString(), {
        imei: '356938035643809',
        brand: 'Samsung',
        model: 'Galaxy S21',
      });

      await deviceService.updateDeviceLocation(device._id.toString(), {
        lat: -1.2921,
        lng: 36.8219,
        accuracy: 10,
      });

      const history = await deviceService.getDeviceTrackingHistory(device._id.toString());
      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('Device Status Change', () => {
    it('should change device status to stolen', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        role: 'user',
      });

      const device = await deviceService.registerDevice(user._id.toString(), {
        imei: '356938035643809',
        brand: 'Samsung',
        model: 'Galaxy S21',
      });

      const updatedDevice = await deviceService.changeDeviceStatus(
        device._id.toString(),
        'stolen',
        'Reported stolen by user'
      );

      expect(updatedDevice).toBeDefined();
      expect(updatedDevice.status).toBe('stolen');
      expect(updatedDevice.statusReason).toBe('Reported stolen by user');
    });

    it('should change device status to recovered', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        role: 'user',
      });

      const device = await deviceService.registerDevice(user._id.toString(), {
        imei: '356938035643809',
        brand: 'Samsung',
        model: 'Galaxy S21',
        status: 'stolen',
      });

      const updatedDevice = await deviceService.changeDeviceStatus(
        device._id.toString(),
        'recovered',
        'Recovered by police'
      );

      expect(updatedDevice).toBeDefined();
      expect(updatedDevice.status).toBe('recovered');
      expect(updatedDevice.statusReason).toBe('Recovered by police');
    });
  });

  describe('Device Search', () => {
    it('should search devices by IMEI', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        role: 'user',
      });

      await deviceService.registerDevice(user._id.toString(), {
        imei: '356938035643809',
        brand: 'Samsung',
        model: 'Galaxy S21',
      });

      const devices = await deviceService.searchDevices('356938035643809');
      expect(devices).toBeDefined();
      expect(Array.isArray(devices)).toBe(true);
      expect(devices.length).toBe(1);
      expect(devices[0].imei).toBe('356938035643809');
    });

    it('should return empty array for non-existent IMEI', async () => {
      const devices = await deviceService.searchDevices('000000000000000');
      expect(devices).toBeDefined();
      expect(Array.isArray(devices)).toBe(true);
      expect(devices.length).toBe(0);
    });
  });
});

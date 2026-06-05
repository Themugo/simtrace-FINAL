import { connectDB, User, Device, Blacklist } from '../db/index.js';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as imeiService from '../services/imei.js';

describe('IMEI Service', () => {
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
    await Blacklist.deleteMany({});
  });

  describe('IMEI Lookup', () => {
    it('should lookup IMEI information', async () => {
      const imeiInfo = await imeiService.lookupIMEI('356938035643809');
      expect(imeiInfo).toBeDefined();
      expect(imeiInfo).toHaveProperty('imei');
      expect(imeiInfo).toHaveProperty('brand');
      expect(imeiInfo).toHaveProperty('model');
      expect(imeiInfo).toHaveProperty('isValid');
    });

    it('should validate IMEI format', async () => {
      const isValid = await imeiService.validateIMEI('356938035643809');
      expect(isValid).toBe(true);
    });

    it('should reject invalid IMEI format', async () => {
      const isValid = await imeiService.validateIMEI('invalid-imei');
      expect(isValid).toBe(false);
    });
  });

  describe('IMEI Reporting', () => {
    it('should report stolen device', async () => {
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

      const report = await imeiService.reportStolenIMEI(
        device._id.toString(),
        user._id.toString(),
        'Device stolen from car'
      );

      expect(report).toBeDefined();
      expect(report.status).toBe('reported');
      expect(report.reason).toBe('Device stolen from car');
    });

    it('should prevent duplicate reporting', async () => {
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

      await imeiService.reportStolenIMEI(
        device._id.toString(),
        user._id.toString(),
        'Device stolen from car'
      );

      await expect(
        imeiService.reportStolenIMEI(
          device._id.toString(),
          user._id.toString(),
          'Device stolen from car'
        )
      ).rejects.toThrow();
    });
  });

  describe('IMEI Blacklist Check', () => {
    it('should check if IMEI is blacklisted', async () => {
      await Blacklist.create({
        imei: '356938035643809',
        reason: 'Stolen device',
        reportedBy: 'user123',
        reportedAt: new Date(),
      });

      const isBlacklisted = await imeiService.checkBlacklist('356938035643809');
      expect(isBlacklisted).toBe(true);
    });

    it('should return false for non-blacklisted IMEI', async () => {
      const isBlacklisted = await imeiService.checkBlacklist('356938035643809');
      expect(isBlacklisted).toBe(false);
    });
  });

  describe('IMEI Validation', () => {
    it('should validate Luhn checksum', async () => {
      const isValid = await imeiService.validateLuhn('356938035643809');
      expect(isValid).toBe(true);
    });

    it('should reject invalid Luhn checksum', async () => {
      const isValid = await imeiService.validateLuhn('356938035643808');
      expect(isValid).toBe(false);
    });

    it('should validate IMEI length', async () => {
      const isValid = await imeiService.validateLength('356938035643809');
      expect(isValid).toBe(true);
    });

    it('should reject incorrect IMEI length', async () => {
      const isValid = await imeiService.validateLength('35693803564380');
      expect(isValid).toBe(false);
    });
  });
});

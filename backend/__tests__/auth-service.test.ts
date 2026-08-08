import { connectDB, User } from '../db/index.js';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as authService from '../services/auth.js';

describe('Authentication Service', () => {
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
  });

  describe('Token Refresh', () => {
    it('should refresh a valid token', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        role: 'user',
      });

      const jwt = (await import('jsonwebtoken')).default;
      const oldToken = jwt.sign(
        { id: user._id.toString(), email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      const newToken = await authService.refreshToken(oldToken);
      expect(newToken).toBeDefined();
      expect(typeof newToken).toBe('string');
    });

    it('should reject invalid token', async () => {
      await expect(authService.refreshToken('invalid-token')).rejects.toThrow();
    });

    it('should reject expired token', async () => {
      const jwt = (await import('jsonwebtoken')).default;
      const expiredToken = jwt.sign(
        { id: 'test-id', email: 'test@example.com', role: 'user' },
        process.env.JWT_SECRET!,
        { expiresIn: '-1h' }
      );

      await expect(authService.refreshToken(expiredToken)).rejects.toThrow();
    });
  });

  describe('Password Reset Flow', () => {
    it('should generate password reset token', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        role: 'user',
      });

      const resetToken = await authService.generatePasswordResetToken('test@example.com');
      expect(resetToken).toBeDefined();
      expect(typeof resetToken).toBe('string');
    });

    it('should reset password with valid token', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        role: 'user',
      });

      const resetToken = await authService.generatePasswordResetToken('test@example.com');
      await authService.resetPassword(resetToken, 'newPassword123');

      const updatedUser = await User.findById(user._id);
      const isValid = await bcrypt.compare('newPassword123', updatedUser!.passwordHash);
      expect(isValid).toBe(true);
    });

    it('should reject password reset with invalid token', async () => {
      await expect(
        authService.resetPassword('invalid-token', 'newPassword123')
      ).rejects.toThrow();
    });
  });

  describe('OTP Verification', () => {
    it('should generate OTP for user', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        role: 'user',
        phone: '+254712345678',
      });

      const otp = await authService.generateOTP('test@example.com');
      expect(otp).toBeDefined();
      expect(otp.length).toBe(6);
    });

    it('should verify valid OTP', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        role: 'user',
        phone: '+254712345678',
      });

      const otp = await authService.generateOTP('test@example.com');
      const isValid = await authService.verifyOTP('test@example.com', otp);
      expect(isValid).toBe(true);
    });

    it('should reject invalid OTP', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        role: 'user',
        phone: '+254712345678',
      });

      const isValid = await authService.verifyOTP('test@example.com', '000000');
      expect(isValid).toBe(false);
    });
  });
});

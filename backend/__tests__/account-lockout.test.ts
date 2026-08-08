import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { connectDB, User } from '../db/index.js';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  isAccountLocked,
  recordFailedLogin,
  resetLoginAttempts,
  getLockoutRemainingTime,
  unlockAccount,
} from '../services/accountLockout.js';

const describeMongo = process.env.MONGO_URI ? describe : describe.skip;

describeMongo('Account Lockout Service', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongoServer.getUri();
    process.env.JWT_SECRET = 'test-secret-key';
    await connectDB();
  });

  afterAll(async () => {
    await mongoServer?.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  async function makeUser() {
    const bcrypt = (await import('bcryptjs')).default;
    const passwordHash = await bcrypt.hash('correct-password', 12);
    return User.create({
      name: 'Test User',
      email: 'lockout-test@example.com',
      passwordHash,
      role: 'user',
    });
  }

  it('does not lock a fresh account', async () => {
    const user = await makeUser();
    expect(await isAccountLocked(user._id.toString())).toBe(false);
  });

  it('increments attempts without locking below the threshold', async () => {
    const user = await makeUser();
    for (let i = 0; i < 4; i++) {
      const result = await recordFailedLogin(user._id.toString());
      expect(result.locked).toBe(false);
    }
    expect(await isAccountLocked(user._id.toString())).toBe(false);
  });

  it('locks the account on the 5th consecutive failed attempt', async () => {
    const user = await makeUser();
    let result;
    for (let i = 0; i < 5; i++) {
      result = await recordFailedLogin(user._id.toString());
    }
    expect(result!.locked).toBe(true);
    expect(result!.remainingAttempts).toBe(0);
    expect(await isAccountLocked(user._id.toString())).toBe(true);
  });

  it('reports a positive remaining lockout time while locked', async () => {
    const user = await makeUser();
    for (let i = 0; i < 5; i++) {
      await recordFailedLogin(user._id.toString());
    }
    const remaining = await getLockoutRemainingTime(user._id.toString());
    expect(remaining).not.toBeNull();
    expect(remaining as number).toBeGreaterThan(0);
    expect(remaining as number).toBeLessThanOrEqual(15 * 60 * 1000);
  });

  it('clears lock state on resetLoginAttempts (successful login)', async () => {
    const user = await makeUser();
    for (let i = 0; i < 5; i++) {
      await recordFailedLogin(user._id.toString());
    }
    expect(await isAccountLocked(user._id.toString())).toBe(true);

    await resetLoginAttempts(user._id.toString());
    expect(await isAccountLocked(user._id.toString())).toBe(false);
    expect(await getLockoutRemainingTime(user._id.toString())).toBeNull();
  });

  it('allows an admin to unlock a locked account', async () => {
    const user = await makeUser();
    for (let i = 0; i < 5; i++) {
      await recordFailedLogin(user._id.toString());
    }
    expect(await isAccountLocked(user._id.toString())).toBe(true);

    await unlockAccount(user._id.toString());
    expect(await isAccountLocked(user._id.toString())).toBe(false);
  });

  it('treats a non-existent user as not locked rather than throwing', async () => {
    const fakeId = '64aaaaaaaaaaaaaaaaaaaaaa';
    expect(await isAccountLocked(fakeId)).toBe(false);
    const result = await recordFailedLogin(fakeId);
    expect(result.locked).toBe(false);
  });
});

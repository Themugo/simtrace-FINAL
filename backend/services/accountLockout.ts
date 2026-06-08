// services/accountLockout.ts - Account lockout service
import { User } from '../db/index.js';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

/**
 * Check if account is locked
 */
export async function isAccountLocked(userId: string): Promise<boolean> {
  const user = await User.findById(userId);
  if (!user) return false;

  if (user.lockedUntil && new Date() < user.lockedUntil) {
    return true;
  }

  // Reset lockout if time has passed
  if (user.lockedUntil && new Date() >= user.lockedUntil) {
    await resetLoginAttempts(userId);
  }

  return false;
}

/**
 * Record failed login attempt
 */
export async function recordFailedLogin(userId: string): Promise<{ locked: boolean; remainingAttempts: number }> {
  const user = await User.findById(userId);
  if (!user) {
    return { locked: false, remainingAttempts: MAX_LOGIN_ATTEMPTS };
  }

  const attempts = (user.loginAttempts || 0) + 1;
  const remainingAttempts = MAX_LOGIN_ATTEMPTS - attempts;

  if (attempts >= MAX_LOGIN_ATTEMPTS) {
    // Lock the account
    const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
    await User.findByIdAndUpdate(userId, {
      loginAttempts: attempts,
      lockedUntil,
    });

    return { locked: true, remainingAttempts: 0 };
  }

  await User.findByIdAndUpdate(userId, {
    loginAttempts: attempts,
  });

  return { locked: false, remainingAttempts };
}

/**
 * Reset login attempts on successful login
 */
export async function resetLoginAttempts(userId: string): Promise<void> {
  await User.findByIdAndUpdate(userId, {
    loginAttempts: 0,
    lockedUntil: undefined,
  });
}

/**
 * Get lockout remaining time
 */
export async function getLockoutRemainingTime(userId: string): Promise<number | null> {
  const user = await User.findById(userId);
  if (!user || !user.lockedUntil) return null;

  const remaining = user.lockedUntil.getTime() - Date.now();
  return remaining > 0 ? remaining : null;
}

/**
 * Unlock account (admin only)
 */
export async function unlockAccount(userId: string): Promise<void> {
  await User.findByIdAndUpdate(userId, {
    loginAttempts: 0,
    lockedUntil: undefined,
  });
}

/**
 * Check if user should be notified about lockout
 */
export async function shouldNotifyLockout(userId: string): Promise<boolean> {
  const user = await User.findById(userId);
  if (!user) return false;

  // Notify on first lockout
  return (user.loginAttempts || 0) >= MAX_LOGIN_ATTEMPTS && user.lockedUntil;
}

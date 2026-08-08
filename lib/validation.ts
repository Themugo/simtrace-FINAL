/**
 * Validates an IMEI number using the Luhn checksum algorithm.
 */
export function validateIMEI(imei: string): { isValid: boolean; error?: string } {
  if (!imei) {
    return { isValid: false, error: 'IMEI is required.' };
  }

  const sanitized = imei.replace(/[\s-]/g, '');

  if (!/^\d{15}$/.test(sanitized)) {
    return { isValid: false, error: 'IMEI must contain exactly 15 digits.' };
  }

  // Luhn algorithm check
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let digit = parseInt(sanitized.charAt(i), 10);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }

  if (sum % 10 !== 0) {
    return { isValid: false, error: 'Invalid IMEI checksum (Luhn validation failed).' };
  }

  return { isValid: true };
}

/**
 * Validates standard email address format.
 */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Validates phone number format (E.164 or national format).
 */
export function validatePhone(phone: string): boolean {
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length >= 9 && digitsOnly.length <= 15;
}

/**
 * Calculates password strength on a score from 0 to 100.
 */
export function evaluatePasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: 'Empty', color: 'var(--muted)' };

  let score = 0;
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 15;
  if (/[A-Z]/.test(password)) score += 20;
  if (/[0-9]/.test(password)) score += 20;
  if (/[^A-Za-z0-9]/.test(password)) score += 20;

  if (score < 40) return { score, label: 'Weak', color: 'var(--rose, #f43f5e)' };
  if (score < 75) return { score, label: 'Moderate', color: 'var(--amber, #fbbf24)' };
  return { score, label: 'Strong', color: 'var(--emerald, #34d399)' };
}

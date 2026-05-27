import crypto from 'crypto';

// ── Device Fingerprinting ───────────────────────────────────────────────────────
export interface DeviceFingerprint {
  browser: {
    userAgent: string;
    language: string;
    platform: string;
    screenResolution: string;
    colorDepth: number;
    timezone: string;
  };
  hardware: {
    cores?: number;
    memory?: number;
    gpu?: string;
  };
  network: {
    ip: string;
    isp?: string;
    asn?: string;
    timezone?: string;
  };
  canvas?: string;
  webgl?: string;
  audio?: string;
  plugins?: string[];
  fonts?: string[];
  hash: string;
}

// Generate device fingerprint from request data
export function generateFingerprint(data: Partial<DeviceFingerprint>): string {
  const fingerprintData = {
    browser: data.browser,
    hardware: data.hardware,
    screenResolution: data.browser?.screenResolution,
    timezone: data.browser?.timezone,
    plugins: data.plugins,
    fonts: data.fonts,
  };
  
  const dataString = JSON.stringify(fingerprintData);
  return crypto.createHash('sha256').update(dataString).digest('hex');
}

// Compare fingerprints and calculate similarity score
export function compareFingerprints(fp1: DeviceFingerprint, fp2: DeviceFingerprint): number {
  let matches = 0;
  let total = 0;
  
  // Compare browser fingerprint
  if (fp1.browser.userAgent === fp2.browser.userAgent) matches++;
  total++;
  
  if (fp1.browser.language === fp2.browser.language) matches++;
  total++;
  
  if (fp1.browser.platform === fp2.browser.platform) matches++;
  total++;
  
  if (fp1.browser.screenResolution === fp2.browser.screenResolution) matches++;
  total++;
  
  if (fp1.browser.timezone === fp2.browser.timezone) matches++;
  total++;
  
  // Compare network fingerprint
  if (fp1.network.ip === fp2.network.ip) matches++;
  total++;
  
  // Compare canvas fingerprint if available
  if (fp1.canvas && fp2.canvas) {
    if (fp1.canvas === fp2.canvas) matches++;
    total++;
  }
  
  // Compare WebGL fingerprint if available
  if (fp1.webgl && fp2.webgl) {
    if (fp1.webgl === fp2.webgl) matches++;
    total++;
  }
  
  return total > 0 ? matches / total : 0;
}

// Detect suspicious fingerprint changes
export function detectFingerprintAnomaly(current: DeviceFingerprint, previous: DeviceFingerprint): {
  isAnomaly: boolean;
  score: number;
  reasons: string[];
} {
  const reasons: string[] = [];
  let score = 0;
  
  // Check IP change
  if (current.network.ip !== previous.network.ip) {
    reasons.push('IP address changed');
    score += 30;
  }
  
  // Check user agent change
  if (current.browser.userAgent !== previous.browser.userAgent) {
    reasons.push('User agent changed');
    score += 20;
  }
  
  // Check timezone change
  if (current.browser.timezone !== previous.browser.timezone) {
    reasons.push('Timezone changed');
    score += 15;
  }
  
  // Check screen resolution change
  if (current.browser.screenResolution !== previous.browser.screenResolution) {
    reasons.push('Screen resolution changed');
    score += 10;
  }
  
  // Check platform change
  if (current.browser.platform !== previous.browser.platform) {
    reasons.push('Platform changed');
    score += 25;
  }
  
  return {
    isAnomaly: score > 40,
    score,
    reasons,
  };
}

// Parse user agent for basic device info
export function parseUserAgent(userAgent: string): {
  browser: string;
  os: string;
  device: string;
} {
  const ua = userAgent.toLowerCase();
  
  let browser = 'unknown';
  let os = 'unknown';
  let device = 'unknown';
  
  // Detect browser
  if (ua.includes('chrome')) browser = 'chrome';
  else if (ua.includes('firefox')) browser = 'firefox';
  else if (ua.includes('safari')) browser = 'safari';
  else if (ua.includes('edge')) browser = 'edge';
  
  // Detect OS
  if (ua.includes('windows')) os = 'windows';
  else if (ua.includes('mac os')) os = 'macos';
  else if (ua.includes('linux')) os = 'linux';
  else if (ua.includes('android')) os = 'android';
  else if (ua.includes('ios')) os = 'ios';
  
  // Detect device type
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('ios')) {
    device = 'mobile';
  } else if (ua.includes('tablet')) {
    device = 'tablet';
  } else {
    device = 'desktop';
  }
  
  return { browser, os, device };
}

import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const BIOMETRIC_TYPE_KEY = 'biometric_type';

class BiometricAuthService {
  private supported: boolean = false;
  private enrolled: boolean = false;
  private biometricType: LocalAuthentication.AuthenticationType = LocalAuthentication.AuthenticationType.FINGERPRINT;

  async initialize(): Promise<void> {
    try {
      this.supported = await LocalAuthentication.hasHardwareAsync();
      this.enrolled = await LocalAuthentication.isEnrolledAsync();

      if (this.supported) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          this.biometricType = LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION;
        } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
          this.biometricType = LocalAuthentication.AuthenticationType.IRIS;
        }
      }

      // Load saved preference
      const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      if (enabled === 'true') {
        const savedType = await AsyncStorage.getItem(BIOMETRIC_TYPE_KEY);
        if (savedType) {
          this.biometricType = parseInt(savedType, 10);
        }
      }
    } catch (error) {
      console.error('Error initializing biometric auth:', error);
    }
  }

  // ── Availability Check ─────────────────────────────────────────────────────────
  isAvailable(): boolean {
    return this.supported && this.enrolled;
  }

  getBiometricType(): LocalAuthentication.AuthenticationType {
    return this.biometricType;
  }

  getBiometricTypeName(): string {
    switch (this.biometricType) {
      case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
        return 'Face ID';
      case LocalAuthentication.AuthenticationType.IRIS:
        return 'Iris';
      case LocalAuthentication.AuthenticationType.FINGERPRINT:
        return 'Fingerprint';
      default:
        return 'Biometric';
    }
  }

  // ── Enable/Disable ─────────────────────────────────────────────────────────────
  async isEnabled(): Promise<boolean> {
    const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    return enabled === 'true';
  }

  async setEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
    if (enabled) {
      await AsyncStorage.setItem(BIOMETRIC_TYPE_KEY, this.biometricType.toString());
    }
  }

  // ── Authentication ───────────────────────────────────────────────────────────────
  async authenticate(promptMessage: string = 'Authenticate to continue'): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  }

  // ── Sensitive Action Wrapper ────────────────────────────────────────────────────
  async withBiometricAuth<T>(
    action: () => Promise<T>,
    promptMessage: string = 'Authenticate to perform this action'
  ): Promise<T | null> {
    const enabled = await this.isEnabled();
    if (!enabled) {
      // Biometric not enabled, proceed without auth
      return await action();
    }

    const authenticated = await this.authenticate(promptMessage);
    if (!authenticated) {
      return null;
    }

    return await action();
  }
}

export const biometricAuthService = new BiometricAuthService();

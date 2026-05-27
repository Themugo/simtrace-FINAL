// screens/auth/LoginScreen.tsx - Login screen with official email/OTP authentication
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import * as LocalAuthentication from 'expo-local-authentication';
import { login, verifyEmail, verifyOtp, enableBiometric } from '@store/slices/authSlice';
import { RootState } from '@store';

export default function LoginScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { loading, error, biometricEnabled } = useSelector((state: RootState) => state.auth);

  const [officialEmail, setOfficialEmail] = useState('');
  const [otpNumber, setOtpNumber] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [showBiometric, setShowBiometric] = useState(false);

  const handleEmailSubmit = async () => {
    if (!officialEmail || !otpNumber) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await dispatch(login({ officialEmail, otpNumber })).unwrap();
      navigation.navigate('Dashboard' as never);
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Authentication failed');
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert('Biometric Not Available', 'Biometric authentication is not available on this device');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access SIMTrace',
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        // Biometric authentication successful
        // Proceed with login using stored credentials
        Alert.alert('Success', 'Biometric authentication successful');
        // TODO: Implement biometric login flow
      }
    } catch (error: any) {
      Alert.alert('Biometric Error', error.message || 'Biometric authentication failed');
    }
  };

  const toggleBiometric = async () => {
    try {
      const newValue = !biometricEnabled;
      await dispatch(enableBiometric(newValue)).unwrap();
      Alert.alert('Success', `Biometric authentication ${newValue ? 'enabled' : 'disabled'}`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to toggle biometric');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>SIMTrace</Text>
          <Text style={styles.subtitle}>Secure Device Tracking System</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Official Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your official email"
              value={officialEmail}
              onChangeText={setOfficialEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />

            <Text style={styles.label}>Security OTP Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your 8-digit OTP number"
              value={otpNumber}
              onChangeText={setOtpNumber}
              keyboardType="number-pad"
              maxLength={8}
              secureTextEntry
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleEmailSubmit}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Authenticating...' : 'Login'}
              </Text>
            </TouchableOpacity>

            {showBiometric && (
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={handleBiometricAuth}
              >
                <Text style={styles.biometricButtonText}>Use Biometric</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.toggleButton}
              onPress={toggleBiometric}
            >
              <Text style={styles.toggleButtonText}>
                {biometricEnabled ? 'Disable' : 'Enable'} Biometric Authentication
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.note}>
            Note: Only official email and security OTP are accepted for authentication.
            Personal email or phone numbers cannot be used.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 48,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  biometricButton: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  biometricButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    marginTop: 24,
    padding: 12,
  },
  toggleButtonText: {
    color: '#007AFF',
    fontSize: 14,
    textAlign: 'center',
  },
  error: {
    color: '#FF3B30',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  note: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 18,
  },
});

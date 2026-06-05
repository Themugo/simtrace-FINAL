import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Keyboard,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as DeviceInfo from 'expo-device';
import { api } from '../../../api';

const PhoneVerificationScreen: React.FC = () => {
  const navigation = useNavigation();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const sendVerificationCode = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    Keyboard.dismiss();

    try {
      await api.post('/api/auth/verify-phone', {
        phoneNumber: phoneNumber,
      });

      setCodeSent(true);
      setCountdown(300);
      Alert.alert('Success', 'Verification code sent to your phone');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit verification code');
      return;
    }

    setIsLoading(true);
    Keyboard.dismiss();

    try {
      const response = await api.post('/api/auth/confirm-phone', {
        phoneNumber: phoneNumber,
        code: verificationCode,
      });

      const { token, user } = response.data;
      navigation.navigate('DeviceScanning' as never);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    return cleaned;
  };

  const handleResend = () => {
    if (countdown === 0) {
      sendVerificationCode();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#0f1117', '#1a1f2e']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backButton}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.stepIndicator}>Step 3 of 7</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.iconContainer}>
            <Text style={styles.icon}>📱</Text>
          </View>

          <Text style={styles.title}>Verify Your Phone</Text>
          <Text style={styles.subtitle}>
            We'll send a 6-digit code to verify your number
          </Text>

          {!codeSent ? (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="+254 700 000 000"
                placeholderTextColor="#64748b"
                value={phoneNumber}
                onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
                keyboardType="phone-pad"
                maxLength={15}
                autoFocus
              />
            </View>
          ) : (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Verification Code</Text>
              <TextInput
                style={styles.codeInput}
                placeholder="000000"
                placeholderTextColor="#64748b"
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
              <Text style={styles.phoneDisplay}>
                Code sent to: {phoneNumber}
              </Text>
              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResend}
                disabled={countdown > 0}
              >
                <Text
                  style={[
                    styles.resendButtonText,
                    countdown > 0 && styles.resendButtonTextDisabled,
                  ]}
                >
                  {countdown > 0
                    ? `Resend in ${Math.floor(countdown / 60)}:${(
                        countdown % 60
                      )
                        .toString()
                        .padStart(2, '0')}`
                    : 'Resend Code'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, (!phoneNumber || isLoading) && styles.buttonDisabled]}
            onPress={codeSent ? verifyCode : sendVerificationCode}
            disabled={isLoading || !phoneNumber}
          >
            <Text style={styles.buttonText}>
              {isLoading
                ? 'Processing...'
                : codeSent
                ? 'Verify Code'
                : 'Send Code'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.helpText}>
            {codeSent
              ? 'Enter the 6-digit code sent to your phone'
              : 'We use your phone number to create your account and verify your identity'}
          </Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: { fontSize: 16, color: '#94a3b8' },
  stepIndicator: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  placeholder: { width: 50 },
  iconContainer: { alignItems: 'center', marginBottom: 24 },
  icon: { fontSize: 64 },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  inputContainer: { marginBottom: 24 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#f1f5f9',
  },
  codeInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 24,
    color: '#f1f5f9',
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 12,
  },
  phoneDisplay: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 12,
  },
  resendButton: { alignSelf: 'center', marginTop: 8 },
  resendButtonText: { fontSize: 14, color: '#0ea5e9', fontWeight: '600' },
  resendButtonTextDisabled: { color: '#64748b' },
  button: {
    backgroundColor: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  helpText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default PhoneVerificationScreen;

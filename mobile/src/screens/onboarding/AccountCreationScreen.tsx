import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { api } from '../../../api';

const AccountCreationScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { deviceInfo } = route.params as { deviceInfo: any };
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const createAccount = async () => {
    setIsLoading(true);

    try {
      // Call backend to auto-register device
      const response = await api.post('/api/devices/auto-register', {
        deviceInfo,
      });

      setIsComplete(true);

      // Navigate to dashboard after a short delay
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Dashboard' as never }],
        });
      }, 2000);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to create account. Please try again.'
      );
    } finally {
      setIsLoading(false);
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
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backButton}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.stepIndicator}>Step 6 of 7</Text>
            <View style={styles.placeholder} />
          </View>

          {!isComplete ? (
            <>
              {/* Icon */}
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>🎉</Text>
              </View>

              {/* Title */}
              <Text style={styles.title}>Create Your Account</Text>
              <Text style={styles.subtitle}>
                We'll create your account and register your device
              </Text>

              {/* Summary */}
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>Account Summary</Text>
                
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Device</Text>
                  <Text style={styles.summaryValue}>
                    {deviceInfo.brand} {deviceInfo.model}
                  </Text>
                </View>

                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>IMEI</Text>
                  <Text style={styles.summaryValue}>
                    {deviceInfo.imei.slice(-4)}
                  </Text>
                </View>

                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Plan</Text>
                  <Text style={styles.summaryValue}>Free (3 devices)</Text>
                </View>

                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Features</Text>
                  <Text style={styles.summaryValue}>
                    Real-time tracking, alerts, community recovery
                  </Text>
                </View>
              </View>

              {/* Button */}
              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={createAccount}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.buttonText}>Create Account</Text>
                )}
              </TouchableOpacity>

              {/* Terms */}
              <Text style={styles.termsText}>
                By creating an account, you agree to our Terms of Service and
                Privacy Policy
              </Text>
            </>
          ) : (
            <>
              {/* Success Icon */}
              <View style={styles.iconContainer}>
                <Text style={styles.successIcon}>✓</Text>
              </View>

              {/* Success Title */}
              <Text style={styles.title}>Account Created!</Text>
              <Text style={styles.subtitle}>
                Your device is now registered and being tracked
              </Text>

              {/* Success Details */}
              <View style={styles.successContainer}>
                <Text style={styles.successText}>
                  Welcome to SIMTrace! Your device is now protected.
                </Text>
                <Text style={styles.successText}>
                  Redirecting to dashboard...
                </Text>
              </View>
            </>
          )}
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
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: { fontSize: 64 },
  successIcon: {
    fontSize: 80,
    color: '#0ea5e9',
  },
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
    marginBottom: 30,
  },
  summaryContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  summaryValue: {
    fontSize: 14,
    color: '#e2e8f0',
    fontWeight: '500',
  },
  button: {
    backgroundColor: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  termsText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
  successContainer: {
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    borderRadius: 12,
    padding: 20,
  },
  successText: {
    fontSize: 16,
    color: '#e2e8f0',
    textAlign: 'center',
    marginBottom: 12,
  },
});

export default AccountCreationScreen;

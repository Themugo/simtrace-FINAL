import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Linking,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as Permissions from 'expo-permissions';
import * as DeviceInfo from 'expo-device';

const PermissionRequestScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  const requestPermissions = async () => {
    setIsLoading(true);

    try {
      // Request phone state permission
      const { status: phoneStatus } = await Permissions.askAsync(
        Permissions.PHONE
      );

      // Request SMS permission for verification
      const { status: smsStatus } = await Permissions.askAsync(
        Permissions.SMS
      );

      if (phoneStatus === 'granted' && smsStatus === 'granted') {
        navigation.navigate('PhoneVerification' as never);
      } else {
        // Fall back to manual entry
        navigation.navigate('ManualEntry' as never);
      }
    } catch (error) {
      console.error('Permission request error:', error);
      // Fall back to manual entry on error
      navigation.navigate('ManualEntry' as never);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeny = () => {
    // Navigate to manual entry
    navigation.navigate('ManualEntry' as never);
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://simtrace.site/privacy');
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
            <Text style={styles.stepIndicator}>Step 2 of 7</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🔐</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>Permission Request</Text>
          <Text style={styles.subtitle}>
            We need access to some device information to set up your account
          </Text>

          {/* Permissions List */}
          <ScrollView style={styles.permissionsList}>
            <View style={styles.permissionItem}>
              <View style={styles.permissionIcon}>
                <Text style={styles.permissionIconText}>📱</Text>
              </View>
              <View style={styles.permissionContent}>
                <Text style={styles.permissionTitle}>Phone Number</Text>
                <Text style={styles.permissionDescription}>
                  To verify your identity and create your account
                </Text>
              </View>
            </View>

            <View style={styles.permissionItem}>
              <View style={styles.permissionIcon}>
                <Text style={styles.permissionIconText}>🔢</Text>
              </View>
              <View style={styles.permissionContent}>
                <Text style={styles.permissionTitle}>IMEI Number</Text>
                <Text style={styles.permissionDescription}>
                  To uniquely identify your device for tracking
                </Text>
              </View>
            </View>

            <View style={styles.permissionItem}>
              <View style={styles.permissionIcon}>
                <Text style={styles.permissionIconText}>💻</Text>
              </View>
              <View style={styles.permissionContent}>
                <Text style={styles.permissionTitle}>Device Information</Text>
                <Text style={styles.permissionDescription}>
                  Model, brand, OS version for device DNA
                </Text>
              </View>
            </View>

            <View style={styles.permissionItem}>
              <View style={styles.permissionIcon}>
                <Text style={styles.permissionIconText}>🔒</Text>
              </View>
              <View style={styles.permissionContent}>
                <Text style={styles.permissionTitle}>Device DNA</Text>
                <Text style={styles.permissionDescription}>
                  Unique fingerprint for anti-fraud protection
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Privacy Note */}
          <View style={styles.privacyNoteContainer}>
            <Text style={styles.privacyNote}>
              Your data is encrypted and secure. We never share your information
              with third parties.{' '}
              <Text style={styles.privacyLink} onPress={openPrivacyPolicy}>
                Learn more
              </Text>
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={requestPermissions}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Requesting...' : 'Allow'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleDeny}
              disabled={isLoading}
            >
              <Text style={styles.secondaryButtonText}>
                Enter Manually
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
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
  backButton: {
    fontSize: 16,
    color: '#94a3b8',
  },
  stepIndicator: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  placeholder: {
    width: 50,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 64,
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
  permissionsList: {
    flex: 1,
    marginBottom: 20,
  },
  permissionItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  permissionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  permissionIconText: {
    fontSize: 22,
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
  },
  privacyNoteContainer: {
    marginBottom: 20,
  },
  privacyNote: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
  privacyLink: {
    color: '#0ea5e9',
    textDecorationLine: 'underline',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  secondaryButtonText: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PermissionRequestScreen;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import DeviceScanner from '../../services/deviceScanner';

const DeviceScanningScreen: React.FC = () => {
  const navigation = useNavigation();
  const [scanProgress, setScanProgress] = useState(0);
  const [currentScan, setCurrentScan] = useState('');
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [isComplete, setIsComplete] = useState(false);

  const scanSteps = [
    'Scanning IMEI number...',
    'Scanning device serial number...',
    'Reading device model and brand...',
    'Detecting OS version...',
    'Scanning MAC address...',
    'Generating device DNA...',
    'Reading storage information...',
    'Finalizing scan...',
  ];

  useEffect(() => {
    startScanning();
  }, []);

  const startScanning = async () => {
    for (let i = 0; i < scanSteps.length; i++) {
      setCurrentScan(scanSteps[i]);
      setScanProgress(((i + 1) / scanSteps.length) * 100);
      
      // Simulate scanning time
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    // Actually scan device
    try {
      const scanner = DeviceScanner.getInstance();
      const info = await scanner.scanDevice();
      setDeviceInfo(info);
      await scanner.saveDeviceInfo(info);
      setIsComplete(true);
      
      // Navigate to review screen after a short delay
      setTimeout(() => {
        navigation.navigate('DeviceReview' as never, { deviceInfo: info });
      }, 1000);
    } catch (error) {
      console.error('Error scanning device:', error);
      // Navigate to manual entry on error
      navigation.navigate('ManualEntry' as never);
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
            <Text style={styles.stepIndicator}>Step 4 of 7</Text>
          </View>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>📡</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>Scanning Your Device</Text>
          <Text style={styles.subtitle}>
            We're collecting device identifiers for tracking
          </Text>

          {/* Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${scanProgress}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(scanProgress)}%
            </Text>
          </View>

          {/* Current Scan */}
          <View style={styles.currentScanContainer}>
            <ActivityIndicator size="large" color="#0ea5e9" />
            <Text style={styles.currentScanText}>{currentScan}</Text>
          </View>

          {/* Scan Details */}
          <View style={styles.scanDetails}>
            <Text style={styles.scanDetailsTitle}>Scanning:</Text>
            {scanSteps.map((step, index) => (
              <View key={index} style={styles.scanDetailItem}>
                <View
                  style={[
                    styles.scanDetailDot,
                    index < scanProgress / 12.5 && styles.scanDetailDotComplete,
                  ]}
                />
                <Text
                  style={[
                    styles.scanDetailText,
                    index < scanProgress / 12.5 && styles.scanDetailTextComplete,
                  ]}
                >
                  {step}
                </Text>
              </View>
            ))}
          </View>

          {/* Complete Message */}
          {isComplete && (
            <View style={styles.completeContainer}>
              <Text style={styles.completeIcon}>✓</Text>
              <Text style={styles.completeText}>Scan Complete!</Text>
            </View>
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
    alignItems: 'center',
    marginBottom: 30,
  },
  stepIndicator: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
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
  progressContainer: {
    marginBottom: 30,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  currentScanContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  currentScanText: {
    fontSize: 16,
    color: '#e2e8f0',
    marginTop: 16,
  },
  scanDetails: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  scanDetailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 16,
  },
  scanDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scanDetailDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 12,
  },
  scanDetailDotComplete: {
    backgroundColor: '#0ea5e9',
  },
  scanDetailText: {
    fontSize: 13,
    color: '#64748b',
    flex: 1,
  },
  scanDetailTextComplete: {
    color: '#e2e8f0',
  },
  completeContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    borderRadius: 12,
  },
  completeIcon: {
    fontSize: 48,
    color: '#0ea5e9',
    marginBottom: 8,
  },
  completeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0ea5e9',
  },
});

export default DeviceScanningScreen;

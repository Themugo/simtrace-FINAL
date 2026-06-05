import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';

const DeviceReviewScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { deviceInfo } = route.params as { deviceInfo: any };
  const [editableInfo, setEditableInfo] = React.useState(deviceInfo);

  const handleConfirm = () => {
    navigation.navigate('AccountCreation' as never, { deviceInfo: editableInfo });
  };

  const handleEdit = (field: string, value: string) => {
    setEditableInfo({ ...editableInfo, [field]: value });
  };

  const maskImei = (imei: string) => {
    if (!imei || imei.length < 4) return imei;
    return imei.substring(0, imei.length - 4).replace(/./g, '*') + imei.slice(-4);
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
            <Text style={styles.stepIndicator}>Step 5 of 7</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>📱</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>Review Device Information</Text>
          <Text style={styles.subtitle}>
            Please review and confirm your device details
          </Text>

          {/* Device Information */}
          <ScrollView style={styles.infoContainer}>
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Device Identification</Text>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>IMEI 1</Text>
                <TextInput
                  style={styles.infoValue}
                  value={maskImei(editableInfo.imei)}
                  onChangeText={(text) => handleEdit('imei', text)}
                  secureTextEntry
                />
              </View>

              {editableInfo.imei2 && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>IMEI 2</Text>
                  <TextInput
                    style={styles.infoValue}
                    value={maskImei(editableInfo.imei2)}
                    onChangeText={(text) => handleEdit('imei2', text)}
                    secureTextEntry
                  />
                </View>
              )}

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Serial Number</Text>
                <TextInput
                  style={styles.infoValue}
                  value={editableInfo.serialNumber}
                  onChangeText={(text) => handleEdit('serialNumber', text)}
                />
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Device DNA</Text>
                <Text style={styles.infoValueStatic}>
                  {editableInfo.deviceDna}
                </Text>
              </View>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Device Details</Text>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Brand</Text>
                <Text style={styles.infoValueStatic}>
                  {editableInfo.brand}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Model</Text>
                <Text style={styles.infoValueStatic}>
                  {editableInfo.model}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Platform</Text>
                <Text style={styles.infoValueStatic}>
                  {editableInfo.platform}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>OS Version</Text>
                <Text style={styles.infoValueStatic}>
                  {editableInfo.osVersion}
                </Text>
              </View>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>System Information</Text>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Screen Resolution</Text>
                <Text style={styles.infoValueStatic}>
                  {editableInfo.screenResolution}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Total Storage</Text>
                <Text style={styles.infoValueStatic}>
                  {(editableInfo.totalStorage / (1024 * 1024 * 1024)).toFixed(2)} GB
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Available Storage</Text>
                <Text style={styles.infoValueStatic}>
                  {(editableInfo.availableStorage / (1024 * 1024 * 1024)).toFixed(2)} GB
                </Text>
              </View>

              {editableInfo.macAddress && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>MAC Address</Text>
                  <Text style={styles.infoValueStatic}>
                    {editableInfo.macAddress}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleConfirm}
            >
              <Text style={styles.buttonText}>
                Confirm and Create Account
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.secondaryButtonText}>
                Go Back
              </Text>
            </TouchableOpacity>
          </View>

          {/* Privacy Note */}
          <Text style={styles.privacyNote}>
            Your device information is encrypted and secure. We use it only for
            device tracking and recovery.
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
    marginBottom: 30,
  },
  infoContainer: {
    flex: 1,
    marginBottom: 20,
  },
  infoSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 16,
  },
  infoItem: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: '#f1f5f9',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoValueStatic: {
    fontSize: 15,
    color: '#e2e8f0',
  },
  buttonContainer: {
    marginBottom: 16,
  },
  button: {
    backgroundColor: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
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
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '600',
  },
  privacyNote: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default DeviceReviewScreen;

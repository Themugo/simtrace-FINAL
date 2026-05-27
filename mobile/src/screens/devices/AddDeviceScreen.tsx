// screens/devices/AddDeviceScreen.tsx - Add device screen
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { addDevice } from '@store/slices/deviceSlice';
import { RootState } from '@store';
import { z } from 'zod';

const addDeviceSchema = z.object({
  imei: z.string().min(15).max(17),
  phoneNumber: z.string().min(10),
  deviceName: z.string().min(1),
  deviceType: z.enum(['phone', 'tablet', 'laptop', 'other']),
  nickname: z.string().optional(),
});

export default function AddDeviceScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { loading } = useSelector((state: RootState) => state.devices);

  const [imei, setImei] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [deviceType, setDeviceType] = useState<'phone' | 'tablet' | 'laptop' | 'other'>('phone');
  const [nickname, setNickname] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAddDevice = async () => {
    // Validate
    try {
      addDeviceSchema.parse({
        imei,
        phoneNumber,
        deviceName,
        deviceType,
        nickname,
      });
      setErrors({});
    } catch (err: any) {
      const fieldErrors: Record<string, string> = {};
      if (err.errors) {
        err.errors.forEach((e: any) => {
          fieldErrors[e.path[0]] = e.message;
        });
      }
      setErrors(fieldErrors);
      return;
    }

    try {
      await dispatch(addDevice({
        imei,
        phoneNumber,
        deviceName,
        deviceType,
        nickname,
      })).unwrap();
      Alert.alert('Success', 'Device added successfully');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add device');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Add New Device</Text>
        <Text style={styles.subtitle}>Enter your device details to start tracking</Text>

        <View style={styles.form}>
          <Text style={styles.label}>IMEI Number *</Text>
          <TextInput
            style={[styles.input, errors.imei && styles.inputError]}
            placeholder="Enter 15-17 digit IMEI"
            value={imei}
            onChangeText={setImei}
            keyboardType="number-pad"
            maxLength={17}
          />
          {errors.imei && <Text style={styles.errorText}>{errors.imei}</Text>}

          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={[styles.input, errors.phoneNumber && styles.inputError]}
            placeholder="Enter phone number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
          {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}

          <Text style={styles.label}>Device Name *</Text>
          <TextInput
            style={[styles.input, errors.deviceName && styles.inputError]}
            placeholder="e.g., Samsung Galaxy S21"
            value={deviceName}
            onChangeText={setDeviceName}
          />
          {errors.deviceName && <Text style={styles.errorText}>{errors.deviceName}</Text>}

          <Text style={styles.label}>Device Type *</Text>
          <View style={styles.deviceTypeContainer}>
            {(['phone', 'tablet', 'laptop', 'other'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.deviceTypeButton,
                  deviceType === type && styles.deviceTypeButtonActive,
                ]}
                onPress={() => setDeviceType(type)}
              >
                <Text
                  style={[
                    styles.deviceTypeButtonText,
                    deviceType === type && styles.deviceTypeButtonTextActive,
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Nickname (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., My Phone"
            value={nickname}
            onChangeText={setNickname}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAddDevice}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Add Device</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>How to find your IMEI:</Text>
          <Text style={styles.infoText}>
            • Dial *#06# on your phone
            • Check the box your device came in
            • Go to Settings > About Phone on your device
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  form: {
    marginBottom: 24,
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
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginBottom: 16,
  },
  deviceTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  deviceTypeButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  deviceTypeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  deviceTypeButtonText: {
    fontSize: 14,
    color: '#333',
  },
  deviceTypeButtonTextActive: {
    color: '#fff',
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
  cancelButton: {
    marginTop: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
});

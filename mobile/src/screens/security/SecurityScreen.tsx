// mobile/src/screens/security/SecurityScreen.tsx - Advanced security features screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { securityApi } from '../../api/security';

const SecurityScreen = () => {
  const [loading, setLoading] = useState(false);
  const [blockchainStats, setBlockchainStats] = useState<any>(null);
  const [attestation, setAttestation] = useState<any>(null);
  const [enclaveStats, setEnclaveStats] = useState<any>(null);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    setLoading(true);
    try {
      // Load blockchain statistics
      const blockchainResponse = await securityApi.getBlockchainStatistics();
      setBlockchainStats(blockchainResponse.stats);

      // Load enclave attestation
      const attestationResponse = await securityApi.getAttestation();
      setAttestation(attestationResponse.attestation);
    } catch (error) {
      console.error('Failed to load security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKeyPair = async () => {
    try {
      const response = await securityApi.generateKeyPair();
      Alert.alert('Success', 'Key pair generated successfully');
      console.log('Key pair:', response.keyPair);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate key pair');
    }
  };

  const handleVerifyChain = async () => {
    try {
      const response = await securityApi.verifyChain();
      Alert.alert(
        'Chain Verification',
        response.isValid ? 'Blockchain is valid' : 'Blockchain is invalid'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to verify blockchain');
    }
  };

  const handleGenerateSecureKey = async () => {
    try {
      const response = await securityApi.generateSecureKey('symmetric', 'user');
      Alert.alert('Success', 'Secure key generated successfully');
      console.log('Secure key:', response.key);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate secure key');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#007AFF', '#0055A4']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Advanced Security</Text>
        <Text style={styles.headerSubtitle}>Enterprise-grade protection</Text>
      </LinearGradient>

      {/* Zero-Knowledge Proofs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Zero-Knowledge Proofs</Text>
        <Text style={styles.sectionDescription}>
          Prove ownership without revealing identity
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => Alert.alert('Info', 'ZK proofs allow verification without revealing sensitive data')}
        >
          <Text style={styles.buttonText}>Learn More</Text>
        </TouchableOpacity>
      </View>

      {/* Quantum-Resistant Encryption */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quantum-Resistant Encryption</Text>
        <Text style={styles.sectionDescription}>
          Post-quantum cryptography for future-proof security
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleGenerateKeyPair}>
          <Text style={styles.buttonText}>Generate Key Pair</Text>
        </TouchableOpacity>
      </View>

      {/* Secure Enclave */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Secure Enclave</Text>
        <Text style={styles.sectionDescription}>
          Hardware-level security for sensitive data
        </Text>
        {attestation && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Enclave Status: {attestation.isValid ? 'Valid' : 'Invalid'}
            </Text>
          </View>
        )}
        <TouchableOpacity style={styles.button} onPress={handleGenerateSecureKey}>
          <Text style={styles.buttonText}>Generate Secure Key</Text>
        </TouchableOpacity>
      </View>

      {/* Blockchain Evidence Chain */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Blockchain Evidence Chain</Text>
        <Text style={styles.sectionDescription}>
          Immutable evidence tracking and verification
        </Text>
        {blockchainStats && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Total Blocks: {blockchainStats.totalBlocks}
            </Text>
            <Text style={styles.infoText}>
              Chain Valid: {blockchainStats.chainValid ? 'Yes' : 'No'}
            </Text>
          </View>
        )}
        <TouchableOpacity style={styles.button} onPress={handleVerifyChain}>
          <Text style={styles.buttonText}>Verify Chain</Text>
        </TouchableOpacity>
      </View>

      {/* Multi-Factor Biometrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Multi-Factor Biometrics</Text>
        <Text style={styles.sectionDescription}>
          Face, voice, and fingerprint authentication
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => Alert.alert('Info', 'Biometric enrollment coming soon')}
        >
          <Text style={styles.buttonText}>Enroll Biometrics</Text>
        </TouchableOpacity>
      </View>

      {/* Security Audit */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security Audit</Text>
        <Text style={styles.sectionDescription}>
          Comprehensive security event logging
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => Alert.alert('Info', 'Audit logs available to administrators')}
        >
          <Text style={styles.buttonText}>View Audit Logs</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
});

export default SecurityScreen;

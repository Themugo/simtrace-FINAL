import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const PrivacyPolicyScreen: React.FC = () => {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#0f1117', '#1a1f2e', '#2d1b4e']}
        style={styles.gradient}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backButton}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Privacy Policy</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Privacy Content */}
          <ScrollView style={styles.scrollView}>
            <Text style={styles.policyTitle}>
              SIMTRACE Privacy Policy
            </Text>
            <Text style={styles.lastUpdated}>
              Last Updated: June 6, 2026
            </Text>

            <Text style={styles.sectionTitle}>1. Information We Collect</Text>
            <Text style={styles.policyText}>
              SIMTrace collects the following types of information:
            </Text>
            <Text style={styles.subsectionTitle}>Device Information:</Text>
            <Text style={styles.policyText}>
              • IMEI and serial numbers for device identification
              • Device model, brand, and operating system
              • MAC address and network information
              • Screen resolution and storage capacity
              • Device DNA (unique fingerprint hash)
            </Text>
            <Text style={styles.subsectionTitle}>Location Data:</Text>
            <Text style={styles.policyText}>
              • GPS coordinates when tracking is enabled
              • Wi-Fi and cell tower triangulation
              • Location history (retained for 90 days)
            </Text>
            <Text style={styles.subsectionTitle}>Account Information:</Text>
            <Text style={styles.policyText}>
              • Phone number and email address
              • Name and profile information
              • Subscription and billing details
            </Text>

            <Text style={styles.sectionTitle}>2. How We Use Your Data</Text>
            <Text style={styles.policyText}>
              We use your data to:
              • Provide device tracking and recovery services
              • Send location alerts and notifications
              • Improve app performance and features
              • Prevent fraud and abuse
              • Comply with legal obligations
              • Provide customer support
            </Text>

            <Text style={styles.sectionTitle}>3. Data Security</Text>
            <Text style={styles.policyText}>
              We implement industry-standard security measures:
              • End-to-end encryption for data in transit
              • AES-256 encryption for data at rest
              • Secure token-based authentication
              • Regular security audits
              • GDPR-compliant data handling
            </Text>

            <Text style={styles.sectionTitle}>4. Data Retention</Text>
            <Text style={styles.policyText}>
              • Location data: 90 days
              • Device information: Until account deletion
              • Account data: 30 days after deletion
              • Transaction records: 7 years (legal requirement)
            </Text>

            <Text style={styles.sectionTitle}>5. Your Rights (GDPR)</Text>
            <Text style={styles.policyText}>
              Under GDPR, you have the right to:
              • Access your personal data
              • Request data deletion
              • Correct inaccurate data
              • Data portability
              • Withdraw consent
              • Object to processing
              • Lodge a complaint with authorities
            </Text>

            <Text style={styles.sectionTitle}>6. Third-Party Services</Text>
            <Text style={styles.policyText}>
              We use:
              • Africa's Talking for SMS verification
              • Google Maps for location display
              • Firebase for push notifications
              • Sentry for error tracking
              All third parties are GDPR-compliant.
            </Text>

            <Text style={styles.sectionTitle}>7. International Data Transfers</Text>
            <Text style={styles.policyText}>
              Data is stored on servers in Kenya. We do not transfer data outside the EEA without your consent and adequate safeguards.
            </Text>

            <Text style={styles.sectionTitle}>8. Children's Privacy</Text>
            <Text style={styles.policyText}>
              SIMTrace is not intended for children under 16. We do not knowingly collect data from minors.
            </Text>

            <Text style={styles.sectionTitle}>9. Changes to This Policy</Text>
            <Text style={styles.policyText}>
              We may update this policy. Significant changes will be notified via email and in-app notification.
            </Text>

            <Text style={styles.sectionTitle}>10. Contact Information</Text>
            <Text style={styles.policyText}>
              Data Protection Officer:
              • Email: dpo@simtrace.site
              • Phone: +254 700 000 000
              • Address: Nairobi, Kenya
            </Text>

            <View style={styles.spacer} />
          </ScrollView>
        </Animated.View>
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
    marginBottom: 20,
  },
  backButton: {
    fontSize: 16,
    color: '#94a3b8',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  placeholder: { width: 50 },
  scrollView: {
    flex: 1,
  },
  policyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0ea5e9',
    marginTop: 24,
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    marginTop: 16,
    marginBottom: 8,
  },
  policyText: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 22,
    marginBottom: 8,
  },
  spacer: { height: 40 },
});

export default PrivacyPolicyScreen;

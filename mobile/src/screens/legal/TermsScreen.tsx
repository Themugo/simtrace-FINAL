import React, { useState, useRef } from 'react';
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
import * as SecureStore from 'expo-secure-store';

const TermsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [agreed, setAgreed] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;

    if (isCloseToBottom && !scrolledToBottom) {
      setScrolledToBottom(true);
    }
  };

  const handleAccept = async () => {
    if (agreed && scrolledToBottom) {
      await SecureStore.setItemAsync('terms_accepted', 'true');
      await SecureStore.setItemAsync('terms_accepted_date', new Date().toISOString());
      navigation.navigate('OnboardingWelcome' as never);
    }
  };

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
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>🛡️</Text>
            </View>
            <Text style={styles.title}>Terms & Conditions</Text>
            <Text style={styles.subtitle}>
              Please read and accept to continue
            </Text>
          </View>

          {/* Terms Content */}
          <View style={styles.termsContainer}>
            <ScrollView
              style={styles.scrollView}
              onScroll={handleScroll}
              scrollEventThrottle={400}
            >
              <Text style={styles.termsTitle}>SIMTRACE Terms of Service</Text>
              
              <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
              <Text style={styles.termsText}>
                By downloading, installing, or using the SIMTrace application, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the application.
              </Text>

              <Text style={styles.sectionTitle}>2. Privacy & Data Protection</Text>
              <Text style={styles.termsText}>
                SIMTrace is committed to protecting your privacy. We collect and process personal data in accordance with our Privacy Policy and applicable data protection laws, including GDPR. Your device information is encrypted and stored securely.
              </Text>

              <Text style={styles.sectionTitle}>3. Device Tracking Services</Text>
              <Text style={styles.termsText}>
                SIMTrace provides device tracking, location monitoring, and recovery services. You acknowledge that:
                - Location data is collected only when tracking is enabled
                - You must have legal right to track any device you register
                - Misuse of tracking features may violate local laws
              </Text>

              <Text style={styles.sectionTitle}>4. User Responsibilities</Text>
              <Text style={styles.termsText}>
                You agree to:
                - Provide accurate information during registration
                - Use the service only for lawful purposes
                - Not attempt to track devices without authorization
                - Maintain the security of your account credentials
                - Report any security vulnerabilities immediately
              </Text>

              <Text style={styles.sectionTitle}>5. Service Availability</Text>
              <Text style={styles.termsText}>
                SIMTrace services are provided "as is" without warranties. We do not guarantee:
                - Uninterrupted or error-free service
                - 100% accuracy of location data
                - Successful recovery of lost devices
                - Compatibility with all devices or networks
              </Text>

              <Text style={styles.sectionTitle}>6. Limitation of Liability</Text>
              <Text style={styles.termsText}>
                To the maximum extent permitted by law, SIMTrace shall not be liable for:
                - Any indirect, incidental, or consequential damages
                - Loss of data, revenue, or business
                - Device theft or loss
                - Unauthorized access to your account
              </Text>

              <Text style={styles.sectionTitle}>7. Subscription & Billing</Text>
              <Text style={styles.termsText}>
                - Free plan includes tracking for up to 3 devices
                - Premium plans offer additional features
                - Subscriptions auto-renew unless cancelled
                - Refunds are handled on a case-by-case basis
              </Text>

              <Text style={styles.sectionTitle}>8. Intellectual Property</Text>
              <Text style={styles.termsText}>
                All content, features, and functionality of SIMTrace are owned by SIMTrace and protected by international copyright, trademark, and other intellectual property laws.
              </Text>

              <Text style={styles.sectionTitle}>9. Termination</Text>
              <Text style={styles.termsText}>
                We reserve the right to suspend or terminate your account if you violate these terms or engage in fraudulent activity. You may terminate your account at any time through the app settings.
              </Text>

              <Text style={styles.sectionTitle}>10. Governing Law</Text>
              <Text style={styles.termsText}>
                These terms are governed by the laws of Kenya. Any disputes shall be resolved through arbitration in Nairobi, Kenya.
              </Text>

              <Text style={styles.sectionTitle}>11. Changes to Terms</Text>
              <Text style={styles.termsText}>
                We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the new terms.
              </Text>

              <Text style={styles.sectionTitle}>12. Contact Us</Text>
              <Text style={styles.termsText}>
                For questions about these terms, contact us at:
                - Email: legal@simtrace.site
                - Website: www.simtrace.site
                - Address: Nairobi, Kenya
              </Text>

              <View style={styles.spacer} />
            </ScrollView>

            {!scrolledToBottom && (
              <View style={styles.scrollIndicator}>
                <Text style={styles.scrollIndicatorText}>
                  ↓ Scroll to read full terms
                </Text>
              </View>
            )}
          </View>

          {/* Agreement Section */}
          <View style={styles.agreementSection}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAgreed(!agreed)}
            >
              <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                {agreed && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.agreementText}>
                I have read and agree to the Terms & Conditions
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.acceptButton,
                (!agreed || !scrolledToBottom) && styles.acceptButtonDisabled,
              ]}
              onPress={handleAccept}
              disabled={!agreed || !scrolledToBottom}
            >
              <Text style={styles.acceptButtonText}>
                Accept & Continue
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.privacyButton}
              onPress={() => {/* Navigate to privacy policy */}}
            >
              <Text style={styles.privacyButtonText}>
                Read Privacy Policy
              </Text>
            </TouchableOpacity>
          </View>
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
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logo: { fontSize: 40 },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  termsContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  termsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0ea5e9',
    marginTop: 20,
    marginBottom: 8,
  },
  termsText: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 22,
    marginBottom: 12,
  },
  spacer: { height: 40 },
  scrollIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 17, 23, 0.9)',
    padding: 12,
    alignItems: 'center',
  },
  scrollIndicatorText: {
    fontSize: 12,
    color: '#64748b',
  },
  agreementSection: {
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  agreementText: {
    fontSize: 14,
    color: '#e2e8f0',
    flex: 1,
  },
  acceptButton: {
    backgroundColor: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  acceptButtonDisabled: {
    opacity: 0.5,
  },
  acceptButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  privacyButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  privacyButtonText: {
    fontSize: 14,
    color: '#0ea5e9',
    fontWeight: '600',
  },
});

export default TermsScreen;

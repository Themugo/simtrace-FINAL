import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import PremiumButton from '../../components/PremiumButton';
import PremiumCard from '../../components/PremiumCard';
import { colors, gradients, spacing, borderRadius, typography } from '../../theme/colors';

const OnboardingWelcomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleContinue = () => {
    navigation.navigate('PermissionRequest' as never);
  };

  const features = [
    { icon: '📱', title: 'Auto-scan device identifiers', description: 'Instantly detect IMEI, serial, and device DNA' },
    { icon: '🔐', title: 'Phone number verification', description: 'Secure SMS verification like WhatsApp' },
    { icon: '⚡', title: 'Instant account creation', description: 'Get started in under 3 minutes' },
    { icon: '🛡️', title: 'Real-time device tracking', description: '24/7 location monitoring and alerts' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={gradients.dark}
        style={styles.gradient}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <Text style={styles.logoText}>
                SIM<Text style={styles.logoAccent}>TRACE</Text>
              </Text>
            </LinearGradient>
          </View>

          {/* Welcome Message */}
          <View style={styles.messageContainer}>
            <Text style={styles.title}>Welcome to SIMTrace</Text>
            <Text style={styles.subtitle}>
              Protect your devices with intelligent tracking and recovery
            </Text>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <PremiumCard key={index} variant="glass" padding="small" style={styles.feature}>
                <View style={styles.featureContent}>
                  <View style={styles.featureIcon}>
                    <Text style={styles.featureIconText}>{feature.icon}</Text>
                  </View>
                  <View style={styles.featureTextContainer}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </View>
                </View>
              </PremiumCard>
            ))}
          </View>

          {/* Continue Button */}
          <PremiumButton
            title="Get Started"
            onPress={handleContinue}
            variant="primary"
            size="large"
            style={styles.button}
          />

          {/* Privacy Note */}
          <Text style={styles.privacyNote}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </Animated.View>
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
    paddingHorizontal: spacing.xxl,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.huge,
  },
  logoGradient: {
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xxl,
  },
  logoText: {
    fontSize: typography.fontSize.huge,
    fontWeight: '900',
    letterSpacing: 4,
    color: colors.text.primary,
  },
  logoAccent: {
    color: colors.text.primary,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: spacing.huge,
  },
  title: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: typography.lineHeight.relaxed,
  },
  featuresContainer: {
    marginBottom: spacing.huge,
  },
  feature: {
    marginBottom: spacing.md,
  },
  featureContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  featureIconText: {
    fontSize: 24,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  featureDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    lineHeight: typography.lineHeight.normal,
  },
  button: {
    marginBottom: spacing.lg,
  },
  privacyNote: {
    fontSize: typography.fontSize.xs,
    color: colors.text.disabled,
    textAlign: 'center',
    lineHeight: typography.lineHeight.normal,
  },
});

export default OnboardingWelcomeScreen;

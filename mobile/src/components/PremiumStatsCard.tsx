import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, borderRadius, spacing, typography } from '../theme/colors';

interface PremiumStatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'success';
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

const PremiumStatsCard: React.FC<PremiumStatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'primary',
  trend,
}) => {
  const getGradient = () => {
    switch (variant) {
      case 'secondary':
        return gradients.secondary;
      case 'accent':
        return gradients.accent;
      case 'success':
        return gradients.success;
      default:
        return gradients.primary;
    }
  };

  return (
    <LinearGradient
      colors={getGradient()}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {icon && <Text style={styles.icon}>{icon}</Text>}
        </View>
        <Text style={styles.value}>{value}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {trend && (
          <View style={styles.trendContainer}>
            <Text style={[styles.trend, trend.isPositive && styles.trendPositive]}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: colors.shadow.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    opacity: 0.9,
    fontWeight: '500',
  },
  icon: {
    fontSize: 24,
  },
  value: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.text.primary,
    opacity: 0.8,
  },
  trendContainer: {
    marginTop: spacing.sm,
  },
  trend: {
    fontSize: typography.fontSize.xs,
    color: colors.text.primary,
    fontWeight: '600',
  },
  trendPositive: {
    color: colors.status.success,
  },
});

export default PremiumStatsCard;

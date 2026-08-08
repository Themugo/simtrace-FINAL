import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, borderRadius, spacing, typography } from '../theme/colors';

interface PremiumCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'gradient' | 'glass';
  padding?: 'small' | 'medium' | 'large';
}

const PremiumCard: React.FC<PremiumCardProps> = ({
  children,
  style,
  onPress,
  variant = 'default',
  padding = 'medium',
}) => {
  const getPadding = () => {
    switch (padding) {
      case 'small':
        return spacing.lg;
      case 'large':
        return spacing.xxxl;
      default:
        return spacing.xxl;
    }
  };

  const cardStyle = {
    ...styles.card,
    padding: getPadding(),
    ...style,
  };

  if (variant === 'gradient') {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={onPress ? 0.8 : 1}
        disabled={!onPress}
      >
        <LinearGradient
          colors={gradients.premium}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={cardStyle}
        >
          {children}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'glass') {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={onPress ? 0.8 : 1}
        disabled={!onPress}
        style={[
          cardStyle,
          styles.glassCard,
        ]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
      disabled={!onPress}
      style={cardStyle}
    >
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});

export default PremiumCard;

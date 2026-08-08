import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, borderRadius, spacing, typography } from '../theme/colors';

interface PremiumButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'accent' | 'success';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

const PremiumButton: React.FC<PremiumButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'medium',
  style,
  textStyle,
  icon,
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

  const getSize = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg };
      case 'large':
        return { paddingVertical: spacing.xxl, paddingHorizontal: spacing.xxxl };
      default:
        return { paddingVertical: spacing.xl, paddingHorizontal: spacing.xxl };
    }
  };

  const buttonStyle = {
    ...styles.button,
    ...getSize(),
    opacity: disabled || loading ? 0.5 : 1,
    ...style,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={buttonStyle}
    >
      <LinearGradient
        colors={getGradient()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color={colors.text.primary} />
        ) : (
          <View style={styles.content}>
            {icon && <View style={styles.icon}>{icon}</View>}
            <Text style={[styles.text, textStyle]}>{title}</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xl,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: spacing.sm,
  },
  text: {
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default PremiumButton;

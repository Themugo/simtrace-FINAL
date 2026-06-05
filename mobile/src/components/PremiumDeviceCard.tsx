import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, borderRadius, spacing, typography } from '../theme/colors';

interface PremiumDeviceCardProps {
  deviceName: string;
  deviceType: string;
  status: 'active' | 'stolen' | 'recovered';
  lastLocation?: string;
  lastSeen?: string;
  onPress: () => void;
}

const PremiumDeviceCard: React.FC<PremiumDeviceCardProps> = ({
  deviceName,
  deviceType,
  status,
  lastLocation,
  lastSeen,
  onPress,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'stolen':
        return colors.status.error;
      case 'recovered':
        return colors.status.success;
      default:
        return colors.status.success;
    }
  };

  const getStatusGradient = () => {
    switch (status) {
      case 'stolen':
        return [colors.status.error, '#dc2626'];
      case 'recovered':
        return gradients.success;
      default:
        return gradients.primary;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'stolen':
        return 'Stolen';
      case 'recovered':
        return 'Recovered';
      default:
        return 'Active';
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={getStatusGradient()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View>
              <Text style={styles.deviceName}>{deviceName}</Text>
              <Text style={styles.deviceType}>{deviceType}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
              <Text style={styles.statusText}>{getStatusText()}</Text>
            </View>
          </View>

          {lastLocation && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>📍 Location:</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{lastLocation}</Text>
            </View>
          )}

          {lastSeen && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>🕐 Last Seen:</Text>
              <Text style={styles.infoValue}>{lastSeen}</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
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
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  deviceName: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  deviceType: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    opacity: 0.8,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.text.primary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  infoLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.primary,
    opacity: 0.8,
    marginRight: spacing.sm,
  },
  infoValue: {
    fontSize: typography.fontSize.xs,
    color: colors.text.primary,
    flex: 1,
  },
});

export default PremiumDeviceCard;

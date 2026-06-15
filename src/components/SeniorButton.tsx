import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

type Variant = 'primary' | 'secondary' | 'danger';
type Size = 'large' | 'xl';

interface SeniorButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  icon?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

const HEIGHT: Record<Size, number> = { large: 72, xl: 96 };
const FONT_SIZE: Record<Size, number> = { large: 22, xl: 26 };

const BG: Record<Variant, string> = {
  primary: colors.primary,
  secondary: colors.surface,
  danger: colors.danger,
};

const TEXT_COLOR: Record<Variant, string> = {
  primary: colors.white,
  secondary: colors.primary,
  danger: colors.white,
};

export default function SeniorButton({
  label,
  onPress,
  variant = 'primary',
  size = 'large',
  icon,
  disabled = false,
  loading = false,
  style,
}: SeniorButtonProps) {
  const height = HEIGHT[size];
  const fontSize = FONT_SIZE[size];
  const bg = disabled ? colors.disabled : BG[variant];
  const textColor = disabled ? colors.white : TEXT_COLOR[variant];
  const isSecondary = variant === 'secondary';

  const handlePress = async () => {
    if (disabled || loading) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      style={[
        styles.base,
        { height, backgroundColor: bg },
        isSecondary && styles.secondaryBorder,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="large" />
      ) : (
        <Text style={[styles.label, { fontSize, color: textColor }]}>
          {icon ? `${icon}  ${label}` : label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    minWidth: 60,
  },
  secondaryBorder: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  label: {
    fontWeight: typography.fontWeightBold,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});

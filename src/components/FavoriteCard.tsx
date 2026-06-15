import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ttsService } from '../services/ttsService';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

interface FavoriteCardProps {
  label: string;
  icon: string;
  address: string;
  onPress: () => void;
  color?: string;
  style?: ViewStyle;
}

function withParticle(word: string): string {
  const lastChar = word[word.length - 1];
  const code = lastChar.charCodeAt(0);
  const hasFinalConsonant = (code - 0xAC00) % 28 !== 0;
  return hasFinalConsonant ? `${word}으로` : `${word}로`;
}

export default function FavoriteCard({
  label,
  icon,
  address,
  onPress,
  color,
  style,
}: FavoriteCardProps) {
  const accentColor = color ?? colors.primary;

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    ttsService.speak(`${withParticle(label)} 가시겠어요?`);
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      accessibilityLabel={`${label}, ${address}`}
      accessibilityRole="button"
      style={[styles.card, style]}
    >
      <View style={[styles.iconWrapper, { backgroundColor: `${accentColor}18` }]}>
        <Text style={[styles.icon, { color: accentColor }]}>{icon}</Text>
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.address} numberOfLines={1}>
          {address}
        </Text>
      </View>
      <Text style={[styles.arrow, { color: accentColor }]}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 100,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 3,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 40,
    lineHeight: 48,
  },
  textBlock: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    fontSize: typography.button,
    fontWeight: typography.fontWeightBold,
    color: colors.textPrimary,
    lineHeight: typography.button * typography.lineHeight,
  },
  address: {
    fontSize: typography.small,
    color: colors.textSecondary,
    lineHeight: typography.small * typography.lineHeight,
  },
  arrow: {
    fontSize: 28,
    fontWeight: typography.fontWeightBold,
    marginLeft: 8,
  },
});

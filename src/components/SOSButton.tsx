import React, { useRef, useState, useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ttsService } from '../services/ttsService';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

interface SOSButtonProps {
  onActivate: () => void;
}

const HOLD_DURATION = 3000;
const TICK_INTERVAL = 1000;

export default function SOSButton({ onActivate }: SOSButtonProps) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const elapsed = useRef(0);

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.15, duration: 250, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ])
    ).start();
  };

  const stopPulse = () => {
    scaleAnim.stopAnimation();
    Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }).start();
  };

  const clearTimers = useCallback(() => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (tickTimer.current) clearInterval(tickTimer.current);
    holdTimer.current = null;
    tickTimer.current = null;
    elapsed.current = 0;
  }, []);

  const handlePressIn = useCallback(() => {
    setCountdown(3);
    elapsed.current = 0;
    startPulse();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    tickTimer.current = setInterval(() => {
      elapsed.current += TICK_INTERVAL;
      const remaining = 3 - Math.floor(elapsed.current / TICK_INTERVAL);
      setCountdown(remaining > 0 ? remaining : null);
      if (remaining > 0) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }, TICK_INTERVAL);

    holdTimer.current = setTimeout(() => {
      clearTimers();
      stopPulse();
      setCountdown(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      ttsService.speak('긴급 호출을 시작합니다');
      onActivate();
    }, HOLD_DURATION);
  }, [clearTimers, onActivate]);

  const handlePressOut = useCallback(() => {
    clearTimers();
    stopPulse();
    setCountdown(null);
  }, [clearTimers]);

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.85}
        accessibilityLabel="SOS 긴급호출 — 3초 동안 누르세요"
        accessibilityRole="button"
        style={styles.button}
      >
        {countdown !== null ? (
          <Text style={styles.countdown}>{countdown}</Text>
        ) : (
          <View style={styles.inner}>
            <Text style={styles.icon}>🚨</Text>
            <Text style={styles.label}>긴급</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 80,
    height: 80,
    borderRadius: 40,
    shadowColor: colors.sos,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 10,
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.sos,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: {
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
    lineHeight: 28,
  },
  label: {
    fontSize: typography.small,
    fontWeight: typography.fontWeightBold,
    color: colors.white,
    marginTop: 2,
  },
  countdown: {
    fontSize: 32,
    fontWeight: typography.fontWeightBold,
    color: colors.white,
  },
});

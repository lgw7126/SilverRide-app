import React, { useRef, useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  View,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ttsService } from '../services/ttsService';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

interface VoiceInputButtonProps {
  onResult: (text: string) => void;
  disabled?: boolean;
}

type RecordingState = 'idle' | 'listening' | 'processing';

export default function VoiceInputButton({ onResult, disabled }: VoiceInputButtonProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  const startPulse = () => {
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    pulseLoop.current.start();
  };

  const stopPulse = () => {
    pulseLoop.current?.stop();
    Animated.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
  };

  const handlePress = async () => {
    if (disabled || state !== 'idle') return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setState('listening');
    startPulse();
    ttsService.speak('목적지를 말씨해 주세요');

    if (Platform.OS === 'web') {
      setTimeout(() => {
        setState('idle');
        stopPulse();
        onResult('서울역');
      }, 3000);
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Voice = require('@react-native-voice/voice').default;

      Voice.onSpeechResults = (e: { value?: string[] }) => {
        const result = e.value?.[0] ?? '';
        setState('idle');
        stopPulse();
        Voice.destroy().then(Voice.removeAllListeners);
        if (result) onResult(result);
      };

      Voice.onSpeechError = () => {
        setState('idle');
        stopPulse();
        ttsService.speak('음성을 인식하지 못했습니다. 다시 말씨해 주세요.');
        Voice.destroy().then(Voice.removeAllListeners);
      };

      await Voice.start('ko-KR');
    } catch {
      setTimeout(() => {
        setState('idle');
        stopPulse();
        onResult('시뮬레이션 결과: 서울역');
      }, 3000);
    }
  };

  const isListening = state === 'listening';
  const bgColor = isListening ? colors.accent : colors.primary;
  const labelText =
    state === 'listening' ? '듣고 있어요...' :
    state === 'processing' ? '수신 중...' :
    '말씨해 주세요';

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.pulseRing,
          { backgroundColor: `${bgColor}30`, transform: [{ scale: pulseAnim }] },
        ]}
      />
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || state !== 'idle'}
        activeOpacity={0.8}
        accessibilityLabel="음성으로 목적지 입력"
        accessibilityRole="button"
        style={[styles.button, { backgroundColor: bgColor }]}
      >
        <Text style={styles.icon}>🎤</Text>
      </TouchableOpacity>
      <Text style={styles.label}>{labelText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: {
    fontSize: 36,
  },
  label: {
    marginTop: 12,
    fontSize: typography.body,
    fontWeight: typography.fontWeightBold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
});

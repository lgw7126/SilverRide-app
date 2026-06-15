import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Haptics from 'expo-haptics';

import { RootStackParamList } from '../navigation/AppNavigator';
import { ttsService } from '../services/ttsService';
import { useRideStore } from '../stores/rideStore';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

type Nav = StackNavigationProp<RootStackParamList>;

type Phase = 'intro' | 'listening' | 'confirming' | 'confirm_listening' | 'calling';

function withParticle(word: string): string {
  if (!word) return word;
  const code = word.charCodeAt(word.length - 1);
  const hasFinal = (code - 0xac00) % 28 !== 0;
  return hasFinal ? `${word}으로` : `${word}로`;
}

const YES_WORDS = ['맞아요', '맞아', '응', '예', '네', '맞습니다', '좋아요', '확인', '맞음'];
const NO_WORDS = ['아니요', '아니', '다시', '틀려', '다르'];
const CANCEL_WORDS = ['취소', '그만', '종료', '끝', '나가기', '나가'];

function isYes(t: string) { return YES_WORDS.some(w => t.includes(w)); }
function isNo(t: string) { return NO_WORDS.some(w => t.includes(w)); }
function isCancel(t: string) { return CANCEL_WORDS.some(w => t.includes(w)); }

export default function VoiceOnlyScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { setDestination } = useRideStore();

  const [phase, setPhase] = useState<Phase>('intro');
  const [statusText, setStatusText] = useState('잠시만 기다려 주세요...');
  const [recognized, setRecognized] = useState('');

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);
  const phaseRef = useRef<Phase>('intro');

  function startPulse() {
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.45, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    pulseLoop.current.start();
  }

  function stopPulse() {
    pulseLoop.current?.stop();
    Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }

  const startDestSTT = useCallback(() => {
    setPhase('listening');
    phaseRef.current = 'listening';
    setStatusText('말씀해 주세요...');
    startPulse();

    // 웹/시뮬레이션 폴백
    if (Platform.OS === 'web') {
      setTimeout(() => { stopPulse(); handleDestResult('서울대병원'); }, 3000);
      return;
    }

    try {
      const Voice = require('@react-native-voice/voice').default;

      Voice.onSpeechResults = (e: { value?: string[] }) => {
        const result = (e.value?.[0] ?? '').trim();
        stopPulse();
        Voice.destroy().then(Voice.removeAllListeners);
        if (result) {
          handleDestResult(result);
        } else {
          ttsService.speak('잘 들리지 않았어요. 다시 말씀해 주세요.');
          setStatusText('다시 말씀해 주세요.');
          setTimeout(() => startDestSTT(), 2000);
        }
      };

      Voice.onSpeechError = () => {
        stopPulse();
        Voice.destroy().then(Voice.removeAllListeners);
        ttsService.speak('잘 들리지 않았어요. 다시 말씀해 주세요.');
        setStatusText('다시 말씀해 주세요.');
        setTimeout(() => startDestSTT(), 2000);
      };

      Voice.start('ko-KR');
    } catch {
      // @react-native-voice/voice 미설치 시 시뮬레이션
      setTimeout(() => { stopPulse(); handleDestResult('서울대병원'); }, 3000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleDestResult(dest: string) {
    setRecognized(dest);
    setPhase('confirming');
    phaseRef.current = 'confirming';
    setStatusText(`"${dest}"`);

    const msg = `${withParticle(dest)} 가시겠어요? 맞으면 맞아요, 다시 하려면 아니요 라고 말씀해 주세요.`;
    ttsService.speak(msg);
    // TTS 재생 시간 추정 후 확인 STT 시작
    const delay = Math.min(msg.length * 75, 5500);
    setTimeout(() => startConfirmSTT(dest), delay);
  }

  function startConfirmSTT(dest: string) {
    if (phaseRef.current !== 'confirming') return;
    setPhase('confirm_listening');
    phaseRef.current = 'confirm_listening';
    setStatusText('맞아요 / 아니요');
    startPulse();

    if (Platform.OS === 'web') {
      setTimeout(() => { stopPulse(); confirmDest(dest); }, 2500);
      return;
    }

    try {
      const Voice = require('@react-native-voice/voice').default;

      Voice.onSpeechResults = (e: { value?: string[] }) => {
        const result = (e.value?.[0] ?? '').trim();
        stopPulse();
        Voice.destroy().then(Voice.removeAllListeners);

        if (isCancel(result)) {
          handleCancel();
        } else if (isYes(result)) {
          confirmDest(dest);
        } else if (isNo(result)) {
          ttsService.speak('다시 말씀해 주세요.');
          setRecognized('');
          setTimeout(() => startDestSTT(), 1500);
        } else {
          ttsService.speak('맞아요 또는 아니요 라고 말씀해 주세요.');
          setTimeout(() => startConfirmSTT(dest), 2200);
        }
      };

      Voice.onSpeechError = () => {
        stopPulse();
        Voice.destroy().then(Voice.removeAllListeners);
        setTimeout(() => startConfirmSTT(dest), 1500);
      };

      Voice.start('ko-KR');
    } catch {
      setTimeout(() => { stopPulse(); confirmDest(dest); }, 2500);
    }
  }

  function confirmDest(dest: string) {
    setPhase('calling');
    phaseRef.current = 'calling';
    setStatusText('택시를 부르고 있어요...');
    ttsService.speak(`${withParticle(dest)} 택시를 부릅니다. 잠시만 기다려 주세요.`);
    setDestination({ id: 'voice', label: dest, icon: '📍', address: dest });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      navigation.replace('RideConfirm', { destinationName: dest });
    }, 1800);
  }

  function handleCancel() {
    stopPulse();
    ttsService.speak('음성 모드를 종료합니다.');
    navigation.goBack();
  }

  useEffect(() => {
    const t = setTimeout(() => {
      ttsService.speak('음성 전용 모드입니다. 가실 곳을 말씀해 주세요.');
      setTimeout(() => startDestSTT(), 2800);
    }, 400);

    return () => {
      clearTimeout(t);
      stopPulse();
      try {
        const Voice = require('@react-native-voice/voice').default;
        Voice.destroy().then(Voice.removeAllListeners);
      } catch {}
    };
  }, [startDestSTT]);

  const micColor =
    phase === 'listening' || phase === 'confirm_listening' ? colors.accent :
    phase === 'calling' ? colors.success : colors.primary;

  const phaseLabel =
    phase === 'intro' ? '준비 중...' :
    phase === 'listening' ? '🎤 듣고 있어요' :
    phase === 'confirming' ? '확인해 주세요' :
    phase === 'confirm_listening' ? '🎤 듣고 있어요' :
    '🚕 호출 중';

  const showConfirmButtons = phase === 'confirming' || phase === 'confirm_listening';

  return (
    <View style={[styles.root, { paddingTop: insets.top + 16, paddingBottom: Math.max(insets.bottom, 32) }]}>
      <Text style={styles.phaseLabel}>{phaseLabel}</Text>

      {recognized !== '' && (
        <View style={styles.recognizedBox}>
          <Text style={styles.recognizedCaption}>인식된 목적지</Text>
          <Text style={styles.recognizedText}>{recognized}</Text>
        </View>
      )}

      {/* 마이크 버튼 */}
      <View style={styles.micContainer}>
        <Animated.View
          style={[
            styles.pulseRing,
            { backgroundColor: `${micColor}30`, transform: [{ scale: pulseAnim }] },
          ]}
        />
        <View style={[styles.micBtn, { backgroundColor: micColor }]}>
          <Text style={styles.micIcon}>{phase === 'calling' ? '🚕' : '🎤'}</Text>
        </View>
      </View>

      <Text style={styles.statusText}>{statusText}</Text>
      <Text style={styles.hintText}>말씀해 주세요</Text>

      {/* 수동 확인/다시 버튼 */}
      {showConfirmButtons && (
        <View style={styles.confirmRow}>
          <TouchableOpacity
            onPress={() => confirmDest(recognized)}
            style={[styles.confirmBtn, { backgroundColor: colors.success }]}
            accessibilityLabel="맞아요, 확인"
            accessibilityRole="button"
            activeOpacity={0.8}
          >
            <Text style={styles.confirmBtnText}>✅ 맞아요</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              ttsService.speak('다시 말씀해 주세요.');
              setRecognized('');
              setTimeout(() => startDestSTT(), 1200);
            }}
            style={[styles.confirmBtn, styles.confirmBtnRetry]}
            accessibilityLabel="아니요, 다시 말하기"
            accessibilityRole="button"
            activeOpacity={0.8}
          >
            <Text style={[styles.confirmBtnText, { color: colors.textPrimary }]}>🔄 다시</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        onPress={handleCancel}
        style={styles.cancelBtn}
        accessibilityLabel="음성 모드 종료"
        accessibilityRole="button"
        activeOpacity={0.75}
      >
        <Text style={styles.cancelBtnText}>그만하기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
  },
  phaseLabel: {
    fontSize: 22,
    fontWeight: typography.fontWeightBold,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.5,
  },
  recognizedBox: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 18,
    paddingHorizontal: 28,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
  },
  recognizedCaption: { fontSize: 16, color: 'rgba(255,255,255,0.65)' },
  recognizedText: { fontSize: 32, fontWeight: typography.fontWeightBold, color: colors.white },
  micContainer: {
    width: 190,
    height: 190,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
  },
  micBtn: {
    width: 148,
    height: 148,
    borderRadius: 74,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 14,
  },
  micIcon: { fontSize: 72 },
  statusText: {
    fontSize: 28,
    fontWeight: typography.fontWeightBold,
    color: colors.white,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  hintText: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  confirmRow: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 24,
    width: '100%',
  },
  confirmBtn: {
    flex: 1,
    height: 72,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnRetry: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  confirmBtnText: {
    fontSize: 22,
    fontWeight: typography.fontWeightBold,
    color: colors.white,
  },
  cancelBtn: {
    marginTop: 4,
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  cancelBtnText: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: typography.fontWeightBold,
  },
});

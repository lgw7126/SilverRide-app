import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
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
import { useRideStore } from '../stores/rideStore';
import { ttsService } from '../services/ttsService';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

type Nav = StackNavigationProp<RootStackParamList>;

type Step = 'phone' | 'otp';

const KEYPAD_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', '⌫'],
];
const KEYPAD_BTN_SIZE = 72;

function formatPhone(digits: string): string {
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

interface KeypadProps {
  onPress: (key: string) => void;
  disabled?: boolean;
}

function Keypad({ onPress, disabled }: KeypadProps) {
  return (
    <View style={styles.keypad}>
      {KEYPAD_ROWS.map((row, ri) => (
        <View key={ri} style={styles.keypadRow}>
          {row.map((key, ci) => (
            <TouchableOpacity
              key={ci}
              onPress={() => {
                if (!disabled && key) {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onPress(key);
                }
              }}
              disabled={disabled || !key}
              activeOpacity={key ? 0.7 : 1}
              accessibilityLabel={key === '⌫' ? '지우기' : key || undefined}
              accessibilityRole={key ? 'button' : undefined}
              style={[styles.keypadBtn, !key && styles.keypadBtnGhost]}
            >
              {key !== '' && (
                <Text style={key === '⌫' ? styles.keyBtnBackspace : styles.keyBtnText}>
                  {key}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

export default function PhoneAuthScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { setUserPhone } = useRideStore();

  const [step, setStep] = useState<Step>('phone');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [otpDigits, setOtpDigits] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      ttsService.speak('전화번호로 시작하세요. 아래 숫자 버튼을 눌러 전화번호를 입력해 주세요.');
    }, 400);
    return () => clearTimeout(t);
  }, []);

  const handlePhoneKey = useCallback((key: string) => {
    if (key === '⌫') {
      setPhoneDigits(p => p.slice(0, -1));
    } else if (phoneDigits.length < 11) {
      const next = phoneDigits + key;
      setPhoneDigits(next);
      // 11자리 완성 시 자동 TTS
      if (next.length === 11) {
        ttsService.speak(`${formatPhone(next)}. 인증번호 받기 버튼을 눌러 주세요.`);
      }
    }
  }, [phoneDigits]);

  const handleOtpKey = useCallback((key: string) => {
    if (key === '⌫') {
      setOtpDigits(p => p.slice(0, -1));
    } else if (otpDigits.length < 6) {
      setOtpDigits(p => p + key);
    }
  }, [otpDigits]);

  async function handleSendCode() {
    if (phoneDigits.length < 10) {
      Alert.alert('알림', '올바른 전화번호를 입력해 주세요.');
      ttsService.speak('올바른 전화번호를 입력해 주세요.');
      return;
    }
    setLoading(true);
    const e164 = `+82${phoneDigits.startsWith('0') ? phoneDigits.slice(1) : phoneDigits}`;

    try {
      // 실제: Firebase Auth signInWithPhoneNumber(getAuth(), e164)
      console.log('[PhoneAuth] 인증번호 발송 →', e164);
      await new Promise(r => setTimeout(r, 1000));
      setUserPhone(formatPhone(phoneDigits));
      setStep('otp');
      ttsService.speak('인증번호가 문자로 왔어요. 숫자를 눌러 주세요.');
    } catch {
      Alert.alert('오류', '죄송합니다, 잠시 후 다시 시도해 주세요.');
      ttsService.speak('죄송합니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (otpDigits.length !== 6) {
      Alert.alert('알림', '인증번호 6자리를 모두 눌러 주세요.');
      ttsService.speak('인증번호 여섯 자리를 모두 눌러 주세요.');
      return;
    }
    setLoading(true);
    try {
      // 실제: confirmResult.confirm(otpDigits)
      await new Promise(r => setTimeout(r, 1000));
      ttsService.speak('인증이 완료되었습니다. 잠시만 기다려 주세요.');
      navigation.replace('MainTabs');
    } catch {
      Alert.alert('오류', '인증번호가 올바르지 않아요. 다시 입력해 주세요.');
      ttsService.speak('인증번호가 맞지 않아요. 다시 입력해 주세요.');
      setOtpDigits('');
    } finally {
      setLoading(false);
    }
  }

  const formattedPhone = formatPhone(phoneDigits);
  const canSend = phoneDigits.length >= 10 && !loading;
  const canVerify = otpDigits.length === 6 && !loading;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 20, paddingBottom: Math.max(insets.bottom, 20) }]}>
      <Text style={styles.title}>전화번호로{'\n'}시작하세요</Text>

      {step === 'phone' ? (
        <>
          {/* 전화번호 표시창 */}
          <View style={styles.displayBox}>
            <Text style={[styles.displayText, phoneDigits.length === 0 && styles.displayPlaceholder]}>
              {phoneDigits.length > 0 ? formattedPhone : '010-XXXX-XXXX'}
            </Text>
          </View>

          {/* 커스텀 키패드 */}
          <Keypad onPress={handlePhoneKey} disabled={loading} />

          {/* 인증번호 받기 */}
          <TouchableOpacity
            onPress={handleSendCode}
            disabled={!canSend}
            style={[styles.actionBtn, !canSend && styles.actionBtnDisabled]}
            accessibilityLabel="인증번호 받기"
            accessibilityRole="button"
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnText}>
              {loading ? '발송 중...' : '인증번호 받기'}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          {/* 전화번호 배지 + 변경 */}
          <View style={styles.phoneBadge}>
            <Text style={styles.phoneBadgeNumber}>{formattedPhone}</Text>
            <TouchableOpacity
              onPress={() => { setStep('phone'); setOtpDigits(''); }}
              accessibilityLabel="전화번호 변경"
              accessibilityRole="button"
            >
              <Text style={styles.phoneBadgeChange}>변경</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.otpGuide}>
            문자로 받은 인증번호 6자리를{'\n'}아래 키패드로 눌러 주세요.
          </Text>

          {/* OTP 6칸 */}
          <View style={styles.otpRow}>
            {Array.from({ length: 6 }, (_, i) => (
              <View
                key={i}
                style={[styles.otpBox, i < otpDigits.length && styles.otpBoxFilled]}
              >
                <Text style={styles.otpBoxText}>{otpDigits[i] ?? ''}</Text>
              </View>
            ))}
          </View>

          {/* 커스텀 키패드 */}
          <Keypad onPress={handleOtpKey} disabled={loading} />

          {/* 인증 확인 */}
          <TouchableOpacity
            onPress={handleVerify}
            disabled={!canVerify}
            style={[styles.actionBtn, !canVerify && styles.actionBtnDisabled]}
            accessibilityLabel="인증 확인"
            accessibilityRole="button"
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnText}>
              {loading ? '확인 중...' : '인증 확인'}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: typography.fontWeightBold,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 4,
  },

  // 전화번호 표시
  displayBox: {
    width: '100%',
    height: 80,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  displayText: {
    fontSize: 36,
    fontWeight: typography.fontWeightBold,
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  displayPlaceholder: {
    color: colors.disabled,
    letterSpacing: 1,
  },

  // 키패드
  keypad: { gap: 10, width: '100%' },
  keypadRow: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  keypadBtn: {
    width: KEYPAD_BTN_SIZE,
    height: KEYPAD_BTN_SIZE,
    borderRadius: 16,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  keypadBtnGhost: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  keyBtnText: {
    fontSize: 28,
    fontWeight: typography.fontWeightBold,
    color: colors.textPrimary,
  },
  keyBtnBackspace: {
    fontSize: 26,
    color: colors.textSecondary,
  },

  // 액션 버튼
  actionBtn: {
    width: '100%',
    height: 72,
    backgroundColor: colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnDisabled: { backgroundColor: colors.disabled },
  actionBtnText: {
    fontSize: typography.button,
    fontWeight: typography.fontWeightBold,
    color: colors.white,
  },

  // OTP 단계
  phoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 18,
    width: '100%',
  },
  phoneBadgeNumber: {
    flex: 1,
    fontSize: 24,
    fontWeight: typography.fontWeightBold,
    color: colors.textPrimary,
  },
  phoneBadgeChange: {
    fontSize: typography.bodyMin,
    color: colors.primary,
    fontWeight: typography.fontWeightBold,
    textDecorationLine: 'underline',
  },
  otpGuide: {
    fontSize: typography.bodyMin,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
  },
  otpRow: {
    flexDirection: 'row',
    gap: 8,
  },
  otpBox: {
    width: 44,
    height: 58,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxFilled: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}12`,
  },
  otpBoxText: {
    fontSize: 28,
    fontWeight: typography.fontWeightBold,
    color: colors.textPrimary,
  },
});

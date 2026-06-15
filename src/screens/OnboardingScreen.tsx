import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
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
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

type Nav = StackNavigationProp<RootStackParamList>;

interface Slide {
  emoji: string;
  title: string;
  desc: string;
  tts: string;
  bg: string;
}

const SLIDES: Slide[] = [
  {
    emoji: '🚕',
    title: '버튼 하나로\n택시를 불러요',
    desc: '큰 버튼을 누르면 바로 택시가 와요.\n복잡한 절차 없이 쉽게 이용하세요.',
    tts: '버튼 하나로 택시를 불러요. 큰 버튼을 누르면 바로 택시가 와요. 복잡한 절차 없이 쉽게 이용하세요.',
    bg: '#1F4E79',
  },
  {
    emoji: '👨‍👩‍👧',
    title: '가족이 실시간으로\n확인해요',
    desc: '택시 탈 때부터 집에 도착까지\n가족에게 자동으로 알림이 가요.',
    tts: '가족이 실시간으로 확인해요. 택시 탈 때부터 집에 도착까지 가족에게 자동으로 알림이 가요.',
    bg: '#2E7D32',
  },
  {
    emoji: '🎤',
    title: '말로도 부를 수 있어요',
    desc: '화면 안 봐도 괜찮아요.\n가실 곳을 말씀만 해주세요.',
    tts: '말로도 부를 수 있어요. 화면을 보지 않아도 가실 곳을 말씀만 해주세요.',
    bg: '#E8701A',
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();

  const [current, setCurrent] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(() => ttsService.speak(SLIDES[0].tts), 600);
    return () => clearTimeout(t);
  }, []);

  function goTo(index: number) {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -40, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      slideAnim.setValue(40);
      setCurrent(index);
      ttsService.speak(SLIDES[index].tts);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
      ]).start();
    });
  }

  function handleNext() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (current < SLIDES.length - 1) {
      goTo(current + 1);
    } else {
      ttsService.stop();
      navigation.replace('PhoneAuth');
    }
  }

  function handleSkip() {
    ttsService.stop();
    navigation.replace('PhoneAuth');
  }

  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  return (
    <View style={[styles.root, { backgroundColor: slide.bg }]}>
      {/* 건너뛰기 — 항상 표시 */}
      <TouchableOpacity
        onPress={handleSkip}
        style={[styles.skipBtn, { top: insets.top + 12 }]}
        accessibilityLabel="건너뛰기"
        accessibilityRole="button"
      >
        <Text style={styles.skipText}>건너뛰기</Text>
      </TouchableOpacity>

      {/* 슬라이드 콘텐츠 */}
      <Animated.View
        style={[
          styles.slideContent,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.emojiWrapper}>
          <Text style={styles.emoji}>{slide.emoji}</Text>
        </View>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.desc}>{slide.desc}</Text>
      </Animated.View>

      {/* 페이지 닷 */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => i !== current && goTo(i)}
            accessibilityLabel={`슬라이드 ${i + 1}`}
            accessibilityRole="button"
            style={[styles.dot, i === current && styles.dotActive]}
          />
        ))}
      </View>

      {/* 다음 / 시작하기 버튼 */}
      <TouchableOpacity
        onPress={handleNext}
        style={[styles.nextBtn, { marginBottom: Math.max(insets.bottom + 8, 32) }]}
        accessibilityLabel={isLast ? '시작하기' : '다음'}
        accessibilityRole="button"
        activeOpacity={0.82}
      >
        <Text style={styles.nextBtnText}>{isLast ? '시작하기  →' : '다음  →'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 36,
  },
  skipBtn: {
    position: 'absolute',
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  skipText: {
    fontSize: typography.bodyMin,
    color: 'rgba(255,255,255,0.88)',
    fontWeight: typography.fontWeightBold,
  },
  slideContent: {
    alignItems: 'center',
    paddingHorizontal: 36,
    gap: 24,
  },
  emojiWrapper: {
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emoji: { fontSize: 80 },
  title: {
    fontSize: typography.title,
    fontWeight: typography.fontWeightBold,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 40,
  },
  desc: {
    fontSize: typography.bodyMin,
    color: 'rgba(255,255,255,0.88)',
    textAlign: 'center',
    lineHeight: 30,
  },
  dots: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    backgroundColor: colors.white,
    width: 30,
    borderRadius: 5,
  },
  nextBtn: {
    height: 72,
    paddingHorizontal: 52,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextBtnText: {
    fontSize: 24,
    fontWeight: typography.fontWeightBold,
    color: colors.white,
    letterSpacing: 0.5,
  },
});

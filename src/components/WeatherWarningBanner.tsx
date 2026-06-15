import React, { useEffect, useState, useRef } from 'react';
import {
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { ttsService } from '../services/ttsService';
import { locationService } from '../services/locationService';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

function isBadWeather(code: number): boolean {
  return (
    (code >= 51 && code <= 67) ||
    (code >= 71 && code <= 77) ||
    (code >= 80 && code <= 86) ||
    (code >= 95 && code <= 99)
  );
}

function getWeatherMessage(code: number): string {
  if (code >= 71 && code <= 77) return '오늘 눈이 옵니다. 미끄러우니 조심하세요 ❄️';
  if (code >= 95) return '오늘 천둥번개가 예보됩니다. 외출에 주의하세요 ⛈️';
  return '오늘 비가 옵니다. 우산을 챙겨 주세요 ☂️';
}

interface WeatherWarningBannerProps {
  fallbackLat?: number;
  fallbackLon?: number;
}

export default function WeatherWarningBanner({
  fallbackLat = 37.5665,
  fallbackLon = 126.9780,
}: WeatherWarningBannerProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const hasSpoken = useRef(false);

  useEffect(() => {
    fetchWeather();
  }, []);

  const fetchWeather = async () => {
    let lat = fallbackLat;
    let lon = fallbackLon;

    try {
      const loc = await locationService.getCurrentLocation();
      if (loc) {
        lat = loc.coords.latitude;
        lon = loc.coords.longitude;
      }
    } catch {
      // fallback 사용
    }

    try {
      const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${lat}&longitude=${lon}` +
        `&hourly=weathercode` +
        `&timezone=Asia%2FSeoul&forecast_days=1`;

      const res = await fetch(url);
      const data = await res.json();

      const codes: number[] = data?.hourly?.weathercode ?? [];
      const dayCodes = codes.slice(9, 18);
      const worstCode = dayCodes.reduce(
        (max: number, c: number) => (c > max ? c : max),
        0
      );

      if (isBadWeather(worstCode)) {
        const msg = getWeatherMessage(worstCode);
        setMessage(msg);
        showBanner(msg);
      }
    } catch {
      // 네트워크 오류 — 배너 표시 안 함
    }
  };

  const showBanner = (msg: string) => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 6,
    }).start(() => {
      if (!hasSpoken.current) {
        hasSpoken.current = true;
        setTimeout(() => ttsService.speak(msg), 800);
      }
    });
  };

  const dismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -120,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setDismissed(true));
  };

  if (!message || dismissed) return null;

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}>
      <Text style={styles.icon}>☁️</Text>
      <Text style={styles.text} accessibilityLabel={message}>
        {message}
      </Text>
      <TouchableOpacity
        onPress={dismiss}
        accessibilityLabel="날씨 알림 닫기"
        style={styles.closeBtn}
      >
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1565C0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 6,
  },
  icon: {
    fontSize: 28,
    marginRight: 10,
  },
  text: {
    flex: 1,
    fontSize: typography.bodyMin,
    fontWeight: typography.fontWeightBold,
    color: colors.white,
    lineHeight: typography.bodyMin * typography.lineHeight,
  },
  closeBtn: {
    padding: 8,
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 18,
    color: colors.white,
    fontWeight: typography.fontWeightBold,
  },
});

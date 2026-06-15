import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ScrollView,
  Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { strings } from '../constants/koreanStrings';
import { ttsService } from '../services/ttsService';
import { useRideStore } from '../stores/rideStore';
import SOSButton from '../components/SOSButton';
import SeniorButton from '../components/SeniorButton';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const DEFAULT_ORIGIN = { latitude: 37.552, longitude: 126.9734 };
const INITIAL_DRIVER_LOC = { latitude: 37.549, longitude: 126.965 };

const MOCK_DRIVER = {
  name: '김철수',
  car: '현대 그랜저',
  carNumber: '서울 12가 3456',
  rating: 4.9,
  isFavorite: false,
};

type Props = StackScreenProps<RootStackParamList, 'Waiting'>;

export default function WaitingScreen({ navigation }: Props) {
  const { currentLocation, setSOSActive } = useRideStore();
  const [driverAssigned, setDriverAssigned] = useState(false);
  const [driverLocation, setDriverLocation] = useState(INITIAL_DRIVER_LOC);

  const dotAnim1 = useRef(new Animated.Value(0.3)).current;
  const dotAnim2 = useRef(new Animated.Value(0.3)).current;
  const dotAnim3 = useRef(new Animated.Value(0.3)).current;

  const ttsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const assignTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const driverMoveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const driverAssignedRef = useRef(false);

  const origin = currentLocation
    ? {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      }
    : DEFAULT_ORIGIN;

  useEffect(() => {
    ttsService.speak(strings.tts.taxiCalling);
    startDotAnimation();
    startTTSRepeat();

    // 7초 후 기사 배정 시뮬레이션
    assignTimerRef.current = setTimeout(() => {
      driverAssignedRef.current = true;
      setDriverAssigned(true);
      ttsService.speak(strings.tts.driverFound);
      startDriverApproach();
    }, 7000);

    return () => {
      if (ttsIntervalRef.current) clearInterval(ttsIntervalRef.current);
      if (assignTimerRef.current) clearTimeout(assignTimerRef.current);
      if (driverMoveRef.current) clearInterval(driverMoveRef.current);
      ttsService.stop();
    };
  }, []);

  const startDotAnimation = () => {
    const pulseDot = (anim: Animated.Value, delay: number) => {
      Animated.sequence([
        Animated.delay(delay),
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: 1, duration: 350, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0.3, duration: 350, useNativeDriver: true }),
            Animated.delay(700),
          ])
        ),
      ]).start();
    };
    pulseDot(dotAnim1, 0);
    pulseDot(dotAnim2, 400);
    pulseDot(dotAnim3, 800);
  };

  const startTTSRepeat = () => {
    ttsIntervalRef.current = setInterval(() => {
      if (driverAssignedRef.current) {
        ttsService.speak('기사님이 오고 있어요. 조금만 더 기다려 주세요.');
      } else {
        ttsService.speak('아직 기다리고 계세요? 기사님을 배정하고 있습니다.');
      }
    }, 30000);
  };

  const startDriverApproach = () => {
    driverMoveRef.current = setInterval(() => {
      setDriverLocation((prev) => ({
        latitude: prev.latitude + (origin.latitude - prev.latitude) * 0.18,
        longitude: prev.longitude + (origin.longitude - prev.longitude) * 0.18,
      }));
    }, 2000);
  };

  const handleSOS = () => {
    setSOSActive(true);
    navigation.navigate('Emergency');
  };

  const handleCancel = () => {
    ttsService.speak('택시 호출을 취소했습니다.');
    navigation.navigate('MainTabs');
  };

  return (
    <View style={styles.root}>
      {/* 지도 — 상단 절반 */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          region={{
            latitude: origin.latitude,
            longitude: origin.longitude,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          }}
        >
          <Marker
            coordinate={origin}
            title="내 위치"
            pinColor={colors.primary}
            accessibilityLabel="내 현재 위치"
          />
          {driverAssigned && (
            <Marker
              coordinate={driverLocation}
              title="기사님"
              accessibilityLabel="기사님 위치"
            >
              <View style={styles.taxiMarker}>
                <Text style={styles.taxiEmoji}>🚕</Text>
              </View>
            </Marker>
          )}
        </MapView>
      </View>

      {/* 정보 카드 — 하단 절반 */}
      <ScrollView
        style={styles.infoCard}
        contentContainerStyle={styles.infoContent}
        showsVerticalScrollIndicator={false}
      >
        {!driverAssigned ? (
          /* 배정 중 — 점 깜빡임 */
          <View style={styles.searchingSection}>
            <Text style={styles.searchingTitle}>{strings.waiting.title}</Text>
            <View style={styles.dotRow}>
              {([dotAnim1, dotAnim2, dotAnim3] as Animated.Value[]).map((anim, i) => (
                <Animated.View key={i} style={[styles.dot, { opacity: anim }]} />
              ))}
            </View>
            <Text style={styles.searchingText}>{strings.waiting.searching}</Text>
          </View>
        ) : (
          /* 기사 배정 완료 */
          <View style={styles.driverSection}>
            <View
              style={styles.driverFoundBanner}
              accessibilityLabel={strings.waiting.driverFound}
              accessibilityRole="text"
            >
              <Text style={styles.driverFoundText} accessibilityElementsHidden={true} importantForAccessibility="no">
                ✅  {strings.waiting.driverFound}
              </Text>
            </View>

            <View style={styles.driverCard}>
              <View style={styles.driverAvatarRow}>
                <View style={styles.driverAvatar}>
                  <Text style={styles.driverAvatarEmoji}>🧑‍✈️</Text>
                </View>
                <View style={styles.driverMeta}>
                  <Text style={styles.driverName}>{MOCK_DRIVER.name} 기사님</Text>
                  <Text
                    style={styles.driverRating}
                    accessibilityLabel={`별점 ${MOCK_DRIVER.rating}점`}
                  >⭐ {MOCK_DRIVER.rating}점</Text>
                  {MOCK_DRIVER.isFavorite && (
                    <View style={styles.favoriteBadge} accessibilityLabel="단골 기사님" accessibilityRole="text">
                      <Text style={styles.favoriteBadgeText} accessibilityElementsHidden={true} importantForAccessibility="no">❤️ 단골 기사님</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.carInfoRow}>
                <View style={styles.carInfoItem}>
                  <Text style={styles.carInfoLabel}>{strings.waiting.carNumber}</Text>
                  <Text style={styles.carInfoValue}>{MOCK_DRIVER.carNumber}</Text>
                </View>
                <View style={styles.carInfoDivider} />
                <View style={styles.carInfoItem}>
                  <Text style={styles.carInfoLabel}>차종</Text>
                  <Text style={styles.carInfoValue}>{MOCK_DRIVER.car}</Text>
                </View>
              </View>

              <Text style={styles.eta}>
                {strings.waiting.estimatedArrival}:{' '}
                <Text style={styles.etaValue}>약 3분</Text>
              </Text>
            </View>
          </View>
        )}

        <SeniorButton
          label={strings.waiting.cancelButton}
          variant="secondary"
          size="large"
          onPress={handleCancel}
          style={styles.cancelBtn}
        />
      </ScrollView>

      {/* SOS 버튼 우측 하단 고정 */}
      <SOSButton onActivate={handleSOS} mode="fixed" />
    </View>
  );
}

const INFO_CARD_HEIGHT = Math.round(SCREEN_HEIGHT * 0.48);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  taxiMarker: {
    backgroundColor: colors.accent,
    borderRadius: 22,
    padding: 5,
    borderWidth: 2,
    borderColor: colors.white,
  },
  taxiEmoji: {
    fontSize: 22,
  },
  infoCard: {
    height: INFO_CARD_HEIGHT,
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },
  infoContent: {
    padding: 24,
    paddingBottom: 120,
    gap: 12,
  },
  searchingSection: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  searchingTitle: {
    fontSize: typography.title,
    fontWeight: typography.fontWeightBold,
    color: colors.textPrimary,
    marginBottom: 20,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 16,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
  },
  searchingText: {
    fontSize: typography.bodyMin,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.bodyMin * typography.lineHeight,
  },
  driverSection: {
    gap: 12,
  },
  driverFoundBanner: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.success,
  },
  driverFoundText: {
    fontSize: typography.body,
    fontWeight: typography.fontWeightBold,
    color: colors.success,
    textAlign: 'center',
  },
  driverCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 16,
  },
  driverAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  driverAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${colors.primary}18`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverAvatarEmoji: {
    fontSize: 36,
  },
  driverMeta: {
    flex: 1,
    gap: 4,
  },
  driverName: {
    fontSize: typography.button,
    fontWeight: typography.fontWeightBold,
    color: colors.textPrimary,
  },
  driverRating: {
    fontSize: typography.bodyMin,
    color: colors.textSecondary,
    lineHeight: typography.bodyMin * typography.lineHeight,
  },
  favoriteBadge: {
    backgroundColor: '#FCE4EC',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  favoriteBadgeText: {
    fontSize: typography.small,
    fontWeight: typography.fontWeightBold,
    color: colors.danger,
  },
  carInfoRow: {
    flexDirection: 'row',
    backgroundColor: `${colors.primary}0A`,
    borderRadius: 12,
    padding: 16,
  },
  carInfoItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  carInfoDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },
  carInfoLabel: {
    fontSize: typography.small,
    color: colors.textSecondary,
    fontWeight: typography.fontWeightBold,
  },
  carInfoValue: {
    fontSize: typography.body,
    fontWeight: typography.fontWeightBold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  eta: {
    fontSize: typography.bodyMin,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.bodyMin * typography.lineHeight,
  },
  etaValue: {
    fontWeight: typography.fontWeightBold,
    color: colors.primary,
    fontSize: typography.body,
  },
  cancelBtn: {
    marginTop: 4,
  },
});

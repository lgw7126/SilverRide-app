import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Haptics from 'expo-haptics';

import { RootStackParamList } from '../navigation/AppNavigator';
import { ttsService } from '../services/ttsService';
import { locationService } from '../services/locationService';
import { emergencyService } from '../services/emergencyService';
import { dementiaGuardService } from '../services/dementiaGuardService';
import { useRideStore, FavoritePlace } from '../stores/rideStore';
import SOSButton from '../components/SOSButton';
import SeniorButton from '../components/SeniorButton';
import WeatherWarningBanner from '../components/WeatherWarningBanner';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

type Nav = StackNavigationProp<RootStackParamList, 'MainTabs'>;

const { width: SW } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_H_PAD = 16;
const CARD_WIDTH = (SW - CARD_H_PAD * 2 - CARD_GAP) / 2;

const CALL_CENTER = 'tel:15880082';

function withParticle(word: string): string {
  const code = word.charCodeAt(word.length - 1);
  const hasFinal = (code - 0xac00) % 28 !== 0;
  return hasFinal ? `${word}으로` : `${word}로`;
}

function getCurrentTime(): string {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes().toString().padStart(2, '0');
  return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${m}`;
}

interface GridCardProps {
  place: FavoritePlace | null;
  onPress: (place: FavoritePlace | null) => void;
}

function GridCard({ place, onPress }: GridCardProps) {
  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (place) ttsService.speak(`${withParticle(place.label)} 가시겠어요?`);
    onPress(place);
  };

  if (!place) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.75}
        accessibilityLabel="즐겨찾기 추가"
        accessibilityRole="button"
        style={styles.gridCardEmpty}
      >
        <Text style={styles.gridEmptyPlus}>+</Text>
        <Text style={styles.gridEmptyLabel}>추가하기</Text>
      </TouchableOpacity>
    );
  }

  const accent = place.color ?? colors.primary;

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      accessibilityLabel={`${place.label}, ${place.address}`}
      accessibilityRole="button"
      style={[styles.gridCard, { borderColor: `${accent}40` }]}
    >
      <View style={[styles.gridIconBg, { backgroundColor: `${accent}18` }]}>
        <Text style={styles.gridIcon}>{place.icon}</Text>
      </View>
      <Text style={styles.gridLabel} numberOfLines={1}>
        {place.label}
      </Text>
      <Text style={styles.gridAddress} numberOfLines={2}>
        {place.address}
      </Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const {
    currentLocation,
    destination,
    favoriteList,
    familyLinked,
    userName,
    setCurrentLocation,
    setDestination,
  } = useRideStore();

  const [locState, setLocState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [time, setTime] = useState(getCurrentTime());
  const mapRef = useRef<MapView>(null);
  const ttsSpoken = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setTime(getCurrentTime()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let sub: Awaited<ReturnType<typeof locationService.watchLocation>> | null = null;

    (async () => {
      ttsService.speak('현재 위치를 찾고 있어요.');
      const loc = await locationService.getCurrentLocation();
      if (!loc) {
        setLocState('error');
        return;
      }
      setCurrentLocation(loc);
      setLocState('ready');
      ttsService.speak('현재 위치를 찾았습니다.');
      mapRef.current?.animateToRegion(
        {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        800
      );
      sub = await locationService.watchLocation(setCurrentLocation);
    })();

    return () => { sub?.remove(); };
  }, [setCurrentLocation]);

  useEffect(() => {
    if (ttsSpoken.current) return;
    ttsSpoken.current = true;
    const t = setTimeout(() => {
      ttsService.speak(`안녕하세요, ${userName}님. 어디로 가실까요? 아래 버튼을 눌러 택시를 부르세요.`);
    }, 1800);
    return () => clearTimeout(t);
  }, [userName]);

  // 낙상 감지 자동 실행 (HomeScreen 마운트 시 시작)
  useEffect(() => {
    const onFallDetected = (cancelFn: () => void) => {
      Alert.alert(
        '🔴 낙상이 감지되었습니다',
        '괜찮으시면 아래 버튼을 눌러 주세요.\n30초 후 자동으로 긴급 신호를 보냅니다.',
        [{ text: '괜찮아요', style: 'cancel', onPress: cancelFn }],
        { cancelable: false }
      );
    };
    const onSOSRequired = () => navigation.navigate('Emergency');

    emergencyService.startFallDetection(onFallDetected, onSOSRequired);
    return () => emergencyService.stopFallDetection();
  }, [navigation]);

  // 목적지 설정 시 치매 안심 모드 자동 시작
  useEffect(() => {
    if (!destination) return;
    void dementiaGuardService.startMonitoring(
      destination.label,
      destination.latitude != null && destination.longitude != null
        ? { latitude: destination.latitude, longitude: destination.longitude }
        : undefined
    );
    return () => { dementiaGuardService.stopMonitoring(); };
  }, [destination]);

  const handleSOS = useCallback(async () => {
    await emergencyService.triggerSOS(
      currentLocation
        ? { latitude: currentLocation.coords.latitude, longitude: currentLocation.coords.longitude }
        : undefined
    );
    navigation.navigate('Emergency');
  }, [navigation, currentLocation]);

  const handleFavTap = useCallback(
    (place: FavoritePlace | null) => {
      if (!place) {
        Alert.alert('준비 중', '즐겨찾기 추가 기능을 준비 중입니다.');
        return;
      }
      setDestination(place);
      navigation.navigate('RideConfirm', { destinationName: place.label });
    },
    [navigation, setDestination]
  );

  const initialRegion = {
    latitude: currentLocation?.coords.latitude ?? 37.5665,
    longitude: currentLocation?.coords.longitude ?? 126.978,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const slots: (FavoritePlace | null)[] = Array.from(
    { length: 4 },
    (_, i) => favoriteList[i] ?? null
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <WeatherWarningBanner />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTime}>{time}</Text>
          <Text style={styles.headerGreeting} numberOfLines={1}>
            안녕하세요, {userName}님
          </Text>
          {familyLinked && (
            <View style={styles.familyBadge}>
              <Text style={styles.familyBadgeText}>🟢 가족 연동 중</Text>
            </View>
          )}
        </View>
        <SOSButton onActivate={handleSOS} mode="inline" />
      </View>

      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={initialRegion}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
        >
          {currentLocation && (
            <Marker
              coordinate={{
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
              }}
              title="현재 위치"
              pinColor={colors.primary}
            />
          )}
        </MapView>

        {locState === 'loading' && (
          <View style={styles.mapOverlay}>
            <Text style={styles.mapOverlayText}>📍 현재 위치를 찾고 있어요...</Text>
          </View>
        )}
        {locState === 'error' && (
          <View style={styles.mapOverlay}>
            <Text style={styles.mapOverlayText}>위치 권한이 필요합니다.</Text>
          </View>
        )}
      </View>

      <View style={styles.favSection}>
        <Text style={styles.favTitle}>어디로 가실까요?</Text>
        <View style={styles.grid}>
          {slots.map((slot, i) => (
            <GridCard
              key={slot?.id ?? `empty-${i}`}
              place={slot}
              onPress={handleFavTap}
            />
          ))}
        </View>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <SeniorButton
          label="말로 부르기"
          onPress={() => navigation.navigate('VoiceOnly')}
          variant="primary"
          size="large"
          icon="🎤"
          style={{ flex: 1, backgroundColor: colors.accent }}
        />
        <View style={styles.bottomRow}>
          <SeniorButton
            label="다른 곳 가기"
            onPress={() => navigation.navigate('Destination')}
            variant="secondary"
            size="large"
            icon="🗺️"
            style={styles.bottomBtn}
          />
          <SeniorButton
            label="전화로 부르기"
            onPress={() => Linking.openURL(CALL_CENTER)}
            variant="primary"
            size="large"
            icon="📞"
            style={styles.bottomBtn}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flex: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    gap: 8,
  },
  headerLeft: { flex: 1, justifyContent: 'center', gap: 2 },
  headerTime: { fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: typography.fontWeightBold },
  headerGreeting: { fontSize: 24, fontWeight: typography.fontWeightBold, color: colors.white, lineHeight: 30 },
  familyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(46,125,50,0.35)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 4,
  },
  familyBadgeText: { fontSize: 13, fontWeight: typography.fontWeightBold, color: colors.white },
  mapWrapper: { flex: 40, backgroundColor: '#D6E4F0', overflow: 'hidden' },
  mapOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapOverlayText: {
    fontSize: typography.body,
    fontWeight: typography.fontWeightBold,
    color: colors.white,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  favSection: {
    flex: 35,
    paddingHorizontal: CARD_H_PAD,
    paddingTop: 12,
    paddingBottom: 4,
  },
  favTitle: { fontSize: 26, fontWeight: typography.fontWeightBold, color: colors.textPrimary, marginBottom: 10 },
  grid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP, alignContent: 'flex-start' },
  gridCard: {
    width: CARD_WIDTH,
    flex: 0,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    minHeight: 110,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  gridIconBg: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  gridIcon: { fontSize: 28 },
  gridLabel: { fontSize: typography.button, fontWeight: typography.fontWeightBold, color: colors.textPrimary, marginBottom: 2 },
  gridAddress: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  gridCardEmpty: {
    width: CARD_WIDTH,
    flex: 0,
    minHeight: 110,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  gridEmptyPlus: { fontSize: 32, color: colors.textSecondary, fontWeight: typography.fontWeightBold },
  gridEmptyLabel: { fontSize: typography.bodyMin, color: colors.textSecondary, fontWeight: typography.fontWeightBold },
  bottomBar: {
    flexDirection: 'column',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 12,
  },
  bottomBtn: { flex: 1 },
});

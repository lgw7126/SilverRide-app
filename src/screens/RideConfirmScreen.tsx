import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { strings } from '../constants/koreanStrings';
import { ttsService } from '../services/ttsService';
import { useRideStore } from '../stores/rideStore';
import SeniorButton from '../components/SeniorButton';
import WeatherWarningBanner from '../components/WeatherWarningBanner';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAP_HEIGHT = Math.round(SCREEN_HEIGHT * 0.5);

const DEST_COORDS: Record<string, { latitude: number; longitude: number }> = {
  집: { latitude: 37.5665, longitude: 126.978 },
  병원: { latitude: 37.58, longitude: 126.97 },
  마트: { latitude: 37.57, longitude: 127.0 },
  복지관: { latitude: 37.555, longitude: 126.96 },
};
const DEFAULT_DEST = { latitude: 37.57, longitude: 126.99 };
const DEFAULT_ORIGIN = { latitude: 37.552, longitude: 126.9734 };

type Props = StackScreenProps<RootStackParamList, 'RideConfirm'>;

export default function RideConfirmScreen({ navigation, route }: Props) {
  const { destinationName } = route.params;
  const { currentLocation, destination } = useRideStore();

  const origin = useMemo(
    () =>
      currentLocation
        ? {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          }
        : DEFAULT_ORIGIN,
    [currentLocation]
  );

  const dest = useMemo(
    () =>
      destination && destination.latitude != null && destination.longitude != null
        ? { latitude: destination.latitude, longitude: destination.longitude }
        : DEST_COORDS[destinationName] ?? DEFAULT_DEST,
    [destination, destinationName]
  );

  // 예상 요금/시간 — 마운트 시점에 한 번만 계산
  const fare = useMemo(() => Math.floor(Math.random() * 8000 + 7000), []);
  const minutes = useMemo(() => Math.floor(Math.random() * 20 + 10), []);
  const isNightSurcharge = useMemo(() => {
    const h = new Date().getHours();
    return h >= 22 || h < 4;
  }, []);

  const formattedFare = useMemo(() => fare.toLocaleString('ko-KR'), [fare]);

  const midLat = (origin.latitude + dest.latitude) / 2;
  const midLon = (origin.longitude + dest.longitude) / 2;
  const latDelta = Math.abs(origin.latitude - dest.latitude) * 2.8 + 0.01;
  const lonDelta = Math.abs(origin.longitude - dest.longitude) * 2.8 + 0.01;

  useEffect(() => {
    ttsService.speak(
      `${destinationName}까지 예상 요금은 ${formattedFare}원, 약 ${minutes}분 걸립니다. 택시를 부르시겠어요?`
    );
  }, []);

  const handleCall = () => {
    ttsService.speak(strings.tts.taxiCalling);
    navigation.navigate('Waiting');
  };

  const handleCancel = () => {
    ttsService.stop();
    navigation.goBack();
  };

  return (
    <View style={styles.root}>
      {/* 경로 지도 50% */}
      <MapView
        style={[styles.map, { height: MAP_HEIGHT }]}
        provider={PROVIDER_DEFAULT}
        region={{ latitude: midLat, longitude: midLon, latitudeDelta: latDelta, longitudeDelta: lonDelta }}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        <Marker
          coordinate={origin}
          title="출발지"
          pinColor={colors.primary}
          accessibilityLabel="출발 위치"
        />
        <Marker
          coordinate={dest}
          title={destinationName}
          pinColor={colors.accent}
          accessibilityLabel={`목적지: ${destinationName}`}
        />
        <Polyline
          coordinates={[origin, dest]}
          strokeColor={colors.primary}
          strokeWidth={4}
          lineDashPattern={[10, 5]}
        />
      </MapView>

      {/* 날씨 배너 */}
      <WeatherWarningBanner />

      {/* 요금 정보 + 버튼 */}
      <ScrollView
        style={styles.infoArea}
        contentContainerStyle={styles.infoContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 목적지 */}
        <View style={styles.routeRow}>
          <Text style={styles.routeLabel}>목적지</Text>
          <Text style={styles.routeValue} numberOfLines={1}>
            {destinationName}
          </Text>
        </View>

        {/* 할증 뱃지 */}
        {isNightSurcharge && (
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>🌙  심야 할증 적용</Text>
            </View>
          </View>
        )}

        {/* 요금 / 시간 카드 */}
        <View style={styles.fareCard}>
          <View style={styles.fareItem}>
            <Text style={styles.fareLabel}>{strings.rideConfirm.estimatedFare}</Text>
            <Text style={styles.fareAmount}>
              {formattedFare}
              <Text style={styles.fareUnit}> {strings.rideConfirm.won}</Text>
            </Text>
          </View>
          <View style={styles.fareDivider} />
          <View style={styles.fareItem}>
            <Text style={styles.fareLabel}>{strings.rideConfirm.estimatedTime}</Text>
            <Text style={styles.fareTime}>
              {minutes}
              <Text style={styles.fareUnit}> {strings.rideConfirm.minutes}</Text>
            </Text>
          </View>
        </View>

        <Text style={styles.fareNotice}>{strings.rideConfirm.fareNotice}</Text>

        <SeniorButton
          label={strings.rideConfirm.callButton}
          variant="primary"
          size="xl"
          icon="🚕"
          onPress={handleCall}
          style={styles.callBtn}
        />
        <SeniorButton
          label={strings.cancel}
          variant="secondary"
          size="large"
          onPress={handleCancel}
          style={styles.cancelBtn}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  map: {
    width: '100%',
  },
  infoArea: {
    flex: 1,
  },
  infoContent: {
    padding: 20,
    paddingBottom: 32,
    gap: 12,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  routeLabel: {
    fontSize: typography.body,
    color: colors.textSecondary,
    fontWeight: typography.fontWeightBold,
    width: 60,
  },
  routeValue: {
    flex: 1,
    fontSize: typography.body,
    color: colors.textPrimary,
    fontWeight: typography.fontWeightBold,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badge: {
    backgroundColor: '#FFF3E0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  badgeText: {
    fontSize: typography.small,
    fontWeight: typography.fontWeightBold,
    color: colors.warning,
  },
  fareCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fareItem: {
    flex: 1,
    alignItems: 'center',
  },
  fareDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },
  fareLabel: {
    fontSize: typography.bodyMin,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: typography.fontWeightBold,
  },
  fareAmount: {
    fontSize: typography.largeNumber,
    fontWeight: typography.fontWeightBold,
    color: colors.textPrimary,
    lineHeight: typography.largeNumber * 1.2,
  },
  fareTime: {
    fontSize: 36,
    fontWeight: typography.fontWeightBold,
    color: colors.primary,
    lineHeight: 36 * 1.2,
  },
  fareUnit: {
    fontSize: typography.body,
    fontWeight: typography.fontWeightNormal,
    color: colors.textSecondary,
  },
  fareNotice: {
    fontSize: typography.small,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.small * typography.lineHeight,
  },
  callBtn: {
    backgroundColor: colors.accent,
    marginTop: 4,
  },
  cancelBtn: {
    marginTop: 4,
  },
});

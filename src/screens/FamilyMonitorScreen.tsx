import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRideStore } from '../stores/rideStore';
import { ttsService } from '../services/ttsService';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

const { height: SH } = Dimensions.get('window');
const MAP_HEIGHT = SH * 0.42;

const MOCK_HISTORY = [
  { id: '1', date: '2026.06.15', dest: '서울대병원', fare: '12,400원', status: '완료' },
  { id: '2', date: '2026.06.13', dest: '이마트 양재점', fare: '8,700원', status: '완료' },
  { id: '3', date: '2026.06.10', dest: '강남구청', fare: '9,200원', status: '완료' },
  { id: '4', date: '2026.06.07', dest: '집', fare: '6,500원', status: '완료' },
  { id: '5', date: '2026.06.04', dest: '서울대병원', fare: '11,900원', status: '완료' },
];

type RideStatus = '이동중' | '대기중' | '도착';

interface SimLocation {
  latitude: number;
  longitude: number;
}

export default function FamilyMonitorScreen() {
  const insets = useSafeAreaInsets();
  const { userName, currentLocation } = useRideStore();

  // 시뮬레이션용 위치 (실제 앱에서는 Firestore 실시간 구독)
  const baseLatitude = currentLocation?.coords.latitude ?? 37.5665;
  const baseLongitude = currentLocation?.coords.longitude ?? 126.978;

  const [seniorLocation, setSeniorLocation] = useState<SimLocation>({
    latitude: baseLatitude + 0.002,
    longitude: baseLongitude - 0.001,
  });
  const [rideStatus, setRideStatus] = useState<RideStatus>('이동중');
  const [lastChecked, setLastChecked] = useState('방금 전');
  const [todayCount, setTodayCount] = useState(2);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef(0);

  useEffect(() => {
    ttsService.speak(`${userName}님의 이동 현황을 확인합니다.`);
  }, [userName]);

  // 1분마다 위치 갱신 시뮬레이션
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      tickRef.current += 1;
      const tick = tickRef.current;

      setSeniorLocation((prev) => ({
        latitude: prev.latitude + (Math.random() - 0.5) * 0.001,
        longitude: prev.longitude + (Math.random() - 0.5) * 0.001,
      }));
      setLastChecked(`${tick}분 전`);

      if (tick === 3) {
        setRideStatus('도착');
        setTodayCount((c) => c + 1);
      }
    }, 60_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function handleCall() {
    const phone = useRideStore.getState().userPhone;
    if (!phone) {
      Alert.alert('알림', '어르신 전화번호가 등록되지 않았습니다.');
      return;
    }
    Linking.openURL(`tel:${phone.replace(/\D/g, '')}`);
  }

  function handleSendAlert() {
    Alert.alert(
      '앱 알림 보내기',
      `${userName}님 앱으로 알림을 보냅니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '보내기',
          onPress: () => {
            // 실제: Firebase FCM 푸시
            Alert.alert('완료', `${userName}님께 알림을 보냈습니다.`);
          },
        },
      ]
    );
  }

  function handleDismissAlert() {
    setAlertVisible(false);
    setAlertMessage('');
  }

  const statusColor =
    rideStatus === '이동중' ? colors.warning :
    rideStatus === '도착' ? colors.success : colors.textSecondary;

  const statusIcon =
    rideStatus === '이동중' ? '🚕' :
    rideStatus === '도착' ? '✅' : '⏸️';

  return (
    <View style={[styles.root, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {/* 이상 감지 알림 배너 */}
      {alertVisible && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertBannerText}>🔴 {alertMessage}</Text>
          <TouchableOpacity onPress={handleDismissAlert} accessibilityLabel="알림 닫기">
            <Text style={styles.alertBannerClose}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 지도 */}
      <View style={{ height: MAP_HEIGHT }}>
        <MapView
          style={StyleSheet.absoluteFill}
          region={{
            latitude: seniorLocation.latitude,
            longitude: seniorLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsCompass={false}
        >
          <Marker
            coordinate={seniorLocation}
            anchor={{ x: 0.5, y: 0.5 }}
            accessibilityLabel="어르신 현재 위치"
          >
            <View style={styles.seniorMarker}>
              <Text style={styles.seniorMarkerText}>👴</Text>
            </View>
          </Marker>
        </MapView>

        {/* 지도 위 헤더 */}
        <View style={styles.mapHeader}>
          <Text style={styles.mapHeaderText}>{userName}님의 이동 현황</Text>
          <View style={[styles.statusPill, { backgroundColor: `${statusColor}22` }]}>
            <Text style={[styles.statusPillText, { color: statusColor }]}>
              {statusIcon} {rideStatus}
            </Text>
          </View>
        </View>

        {/* 마지막 확인 뱃지 */}
        <View style={styles.refreshBadge}>
          <Text style={styles.refreshText}>🔄 마지막 확인: {lastChecked}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 상태 카드 */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Text style={styles.statusItemLabel}>현재 상태</Text>
              <Text style={[styles.statusItemValue, { color: statusColor }]}>
                {statusIcon} {rideStatus}
              </Text>
            </View>
            <View style={styles.statusDividerV} />
            <View style={styles.statusItem}>
              <Text style={styles.statusItemLabel}>오늘 이동 횟수</Text>
              <Text style={styles.statusItemValue}>{todayCount}회</Text>
            </View>
            <View style={styles.statusDividerV} />
            <View style={styles.statusItem}>
              <Text style={styles.statusItemLabel}>마지막 확인</Text>
              <Text style={styles.statusItemValue}>{lastChecked}</Text>
            </View>
          </View>
        </View>

        {/* 연락 버튼 */}
        <View style={styles.contactRow}>
          <TouchableOpacity
            onPress={handleCall}
            style={[styles.contactBtn, { backgroundColor: colors.success }]}
            accessibilityLabel="어르신에게 전화하기"
            accessibilityRole="button"
            activeOpacity={0.8}
          >
            <Text style={styles.contactBtnIcon}>📞</Text>
            <Text style={styles.contactBtnText}>전화하기</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSendAlert}
            style={[styles.contactBtn, { backgroundColor: colors.primary }]}
            accessibilityLabel="앱 알림 보내기"
            accessibilityRole="button"
            activeOpacity={0.8}
          >
            <Text style={styles.contactBtnIcon}>🔔</Text>
            <Text style={styles.contactBtnText}>앱 알림 보내기</Text>
          </TouchableOpacity>
        </View>

        {/* 이동 기록 */}
        <Text style={styles.historyTitle}>최근 이동 기록</Text>
        {MOCK_HISTORY.map((item) => (
          <View key={item.id} style={styles.historyCard}>
            <View style={styles.historyLeft}>
              <Text style={styles.historyDest}>{item.dest}</Text>
              <Text style={styles.historyDate}>{item.date}</Text>
            </View>
            <View style={styles.historyRight}>
              <Text style={styles.historyFare}>{item.fare}</Text>
              <View style={styles.historyStatusBadge}>
                <Text style={styles.historyStatusText}>{item.status}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  alertBannerText: { flex: 1, fontSize: typography.bodyMin, fontWeight: typography.fontWeightBold, color: colors.white },
  alertBannerClose: { fontSize: 20, color: colors.white, fontWeight: typography.fontWeightBold },

  mapHeader: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mapHeaderText: {
    fontSize: 20,
    fontWeight: typography.fontWeightBold,
    color: colors.white,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
  },
  statusPill: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  statusPillText: { fontSize: 16, fontWeight: typography.fontWeightBold },
  refreshBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  refreshText: { fontSize: 13, color: colors.white },

  seniorMarker: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  seniorMarkerText: { fontSize: 28 },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 32 },

  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusItem: { flex: 1, alignItems: 'center', gap: 4 },
  statusItemLabel: { fontSize: 14, color: colors.textSecondary },
  statusItemValue: { fontSize: 18, fontWeight: typography.fontWeightBold, color: colors.textPrimary },
  statusDividerV: { width: 1, height: 40, backgroundColor: colors.border },

  contactRow: { flexDirection: 'row', gap: 12 },
  contactBtn: {
    flex: 1,
    height: 80,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  contactBtnIcon: { fontSize: 28 },
  contactBtnText: { fontSize: typography.bodyMin, fontWeight: typography.fontWeightBold, color: colors.white },

  historyTitle: {
    fontSize: 22,
    fontWeight: typography.fontWeightBold,
    color: colors.textPrimary,
    marginTop: 4,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  historyLeft: { flex: 1, gap: 4 },
  historyDest: { fontSize: 20, fontWeight: typography.fontWeightBold, color: colors.textPrimary },
  historyDate: { fontSize: 15, color: colors.textSecondary },
  historyRight: { alignItems: 'flex-end', gap: 6 },
  historyFare: { fontSize: typography.bodyMin, fontWeight: typography.fontWeightBold, color: colors.textPrimary },
  historyStatusBadge: { backgroundColor: `${colors.success}22`, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  historyStatusText: { fontSize: 14, color: colors.success, fontWeight: typography.fontWeightBold },
});

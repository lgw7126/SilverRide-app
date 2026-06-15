import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Haptics from 'expo-haptics';

import { RootStackParamList } from '../navigation/AppNavigator';
import { useRideStore, FontScale, FavoritePlace } from '../stores/rideStore';
import { ttsService } from '../services/ttsService';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

type Nav = StackNavigationProp<RootStackParamList>;

const MOCK_HISTORY = [
  { id: '1', date: '2026.06.15', dest: '서울대병원', fare: '12,400원' },
  { id: '2', date: '2026.06.13', dest: '이마트 양재점', fare: '8,700원' },
  { id: '3', date: '2026.06.10', dest: '강남구청', fare: '9,200원' },
  { id: '4', date: '2026.06.07', dest: '집', fare: '6,500원' },
  { id: '5', date: '2026.06.04', dest: '서울대병원', fare: '11,900원' },
  { id: '6', date: '2026.06.01', dest: '복지관', fare: '7,300원' },
  { id: '7', date: '2026.05.29', dest: '이마트 양재점', fare: '8,100원' },
  { id: '8', date: '2026.05.26', dest: '집', fare: '5,800원' },
  { id: '9', date: '2026.05.22', dest: '서울대병원', fare: '12,200원' },
  { id: '10', date: '2026.05.19', dest: '강남구청', fare: '9,500원' },
];

const FONT_SCALE_OPTIONS: { label: string; value: FontScale }[] = [
  { label: '기본', value: 'normal' },
  { label: '크게', value: 'large' },
  { label: '매우 크게', value: 'xlarge' },
];

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

interface FavoriteRowProps {
  place: FavoritePlace;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

function FavoriteRow({ place, index, total, onMoveUp, onMoveDown, onDelete }: FavoriteRowProps) {
  return (
    <View style={styles.favRow}>
      <Text style={styles.favIcon}>{place.icon}</Text>
      <View style={styles.favInfo}>
        <Text style={styles.favLabel}>{place.label}</Text>
        <Text style={styles.favAddress} numberOfLines={1}>{place.address}</Text>
      </View>
      <View style={styles.favActions}>
        <TouchableOpacity
          onPress={onMoveUp}
          disabled={index === 0}
          style={[styles.reorderBtn, index === 0 && styles.reorderBtnDisabled]}
          accessibilityLabel={`${place.label} 위로 이동`}
          accessibilityRole="button"
        >
          <Text style={styles.reorderBtnText}>↑</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onMoveDown}
          disabled={index === total - 1}
          style={[styles.reorderBtn, index === total - 1 && styles.reorderBtnDisabled]}
          accessibilityLabel={`${place.label} 아래로 이동`}
          accessibilityRole="button"
        >
          <Text style={styles.reorderBtnText}>↓</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onDelete}
          style={styles.deleteBtn}
          accessibilityLabel={`${place.label} 즐겨찾기 삭제`}
          accessibilityRole="button"
        >
          <Text style={styles.deleteBtnText}>삭제</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function MyPageScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();

  const {
    userName,
    userPhone,
    favoriteList,
    familyMembers,
    fontScale,
    slowSpeechMode,
    highContrastMode,
    setUserName,
    setUserPhone,
    reorderFavorite,
    removeFavorite,
    setFontScale,
    setSlowSpeechMode,
    setHighContrastMode,
  } = useRideStore();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName);

  useEffect(() => {
    ttsService.speak('내 정보 화면입니다. 즐겨찾기와 설정을 변경하실 수 있어요.');
  }, []);

  // 느린 말하기 모드 변경 즉시 TTS 속도 반영
  useEffect(() => {
    ttsService.setSlowMode(slowSpeechMode);
  }, [slowSpeechMode]);

  function saveName() {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      Alert.alert('알림', '이름을 입력해 주세요.');
      return;
    }
    setUserName(trimmed);
    setEditingName(false);
    ttsService.speak(`이름을 ${trimmed}님으로 변경했습니다.`);
  }

  function handleLogout() {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠어요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: () => {
            ttsService.speak('로그아웃 되었습니다.');
            // 실제: Firebase Auth signOut + 스택 리셋
            navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
          },
        },
      ]
    );
  }

  function handleDeleteFavorite(place: FavoritePlace) {
    Alert.alert(
      '즐겨찾기 삭제',
      `"${place.label}"을(를) 삭제할까요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            removeFavorite(place.id);
            ttsService.speak(`${place.label} 즐겨찾기를 삭제했습니다.`);
          },
        },
      ]
    );
  }

  const initials = userName.charAt(0);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 16, 32) }]}
      showsVerticalScrollIndicator={false}
    >
      {/* 프로필 */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.profileInfo}>
          {editingName ? (
            <View style={styles.nameEditRow}>
              <TextInput
                value={nameInput}
                onChangeText={setNameInput}
                style={styles.nameInput}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={saveName}
                accessibilityLabel="이름 입력"
              />
              <TouchableOpacity onPress={saveName} style={styles.saveBtn} accessibilityLabel="이름 저장" accessibilityRole="button">
                <Text style={styles.saveBtnText}>저장</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.nameRow}>
              <Text style={styles.profileName}>{userName}님</Text>
              <TouchableOpacity
                onPress={() => { setNameInput(userName); setEditingName(true); }}
                style={styles.editChip}
                accessibilityLabel="이름 수정"
                accessibilityRole="button"
              >
                <Text style={styles.editChipText}>수정</Text>
              </TouchableOpacity>
            </View>
          )}
          <Text style={styles.profilePhone}>{userPhone || '전화번호 미등록'}</Text>
          <Text style={styles.profileSub}>
            {familyMembers.length > 0 ? `🟢 보호자 ${familyMembers.length}명 연동됨` : '보호자 미연동'}
          </Text>
        </View>
      </View>

      {/* 즐겨찾기 관리 */}
      <SectionHeader title="즐겨찾기 관리" />
      <View style={styles.favCard}>
        {favoriteList.length === 0 ? (
          <Text style={styles.emptyText}>등록된 즐겨찾기가 없어요.</Text>
        ) : (
          favoriteList.map((place, i) => (
            <React.Fragment key={place.id}>
              {i > 0 && <View style={styles.divider} />}
              <FavoriteRow
                place={place}
                index={i}
                total={favoriteList.length}
                onMoveUp={() => { reorderFavorite(i, i - 1); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                onMoveDown={() => { reorderFavorite(i, i + 1); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                onDelete={() => handleDeleteFavorite(place)}
              />
            </React.Fragment>
          ))
        )}
      </View>

      {/* 보호자 연동 */}
      <SectionHeader title="보호자 연동" />
      <TouchableOpacity
        onPress={() => navigation.navigate('FamilyLink')}
        style={styles.navRow}
        accessibilityLabel="보호자 연동 화면으로 이동"
        accessibilityRole="button"
        activeOpacity={0.75}
      >
        <Text style={styles.navRowIcon}>👨‍👩‍👧</Text>
        <View style={styles.navRowText}>
          <Text style={styles.navRowLabel}>보호자 연동 관리</Text>
          <Text style={styles.navRowSub}>
            {familyMembers.length > 0 ? `${familyMembers.length}명 연동됨` : '보호자를 등록해 주세요'}
          </Text>
        </View>
        <Text style={styles.navRowArrow}>›</Text>
      </TouchableOpacity>

      {/* 화면 설정 */}
      <SectionHeader title="화면 설정" />
      <View style={styles.settingsCard}>
        {/* 글씨 크기 */}
        <Text style={styles.settingLabel}>글씨 크기</Text>
        <View style={styles.segmentRow}>
          {FONT_SCALE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => {
                setFontScale(opt.value);
                ttsService.speak(`글씨 크기를 ${opt.label}으로 변경했습니다.`);
              }}
              style={[styles.segment, fontScale === opt.value && styles.segmentActive]}
              accessibilityLabel={`글씨 크기 ${opt.label}`}
              accessibilityRole="button"
              accessibilityState={{ selected: fontScale === opt.value }}
            >
              <Text style={[styles.segmentText, fontScale === opt.value && styles.segmentTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.divider} />

        {/* 느린 말하기 */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleText}>
            <Text style={styles.settingLabel}>느린 말하기 모드</Text>
            <Text style={styles.settingDesc}>음성 안내를 더 천천히 읽어드려요</Text>
          </View>
          <Switch
            value={slowSpeechMode}
            onValueChange={(v) => {
              setSlowSpeechMode(v);
              ttsService.speak(v ? '느린 말하기 모드를 켰습니다.' : '느린 말하기 모드를 껐습니다.');
            }}
            trackColor={{ false: colors.border, true: `${colors.primary}88` }}
            thumbColor={slowSpeechMode ? colors.primary : colors.disabled}
            accessibilityLabel="느린 말하기 모드"
            accessibilityRole="switch"
          />
        </View>

        <View style={styles.divider} />

        {/* 고대비 모드 */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleText}>
            <Text style={styles.settingLabel}>고대비 모드</Text>
            <Text style={styles.settingDesc}>화면을 더 선명하게 표시해요</Text>
          </View>
          <Switch
            value={highContrastMode}
            onValueChange={(v) => {
              setHighContrastMode(v);
              ttsService.speak(v ? '고대비 모드를 켰습니다.' : '고대비 모드를 껐습니다.');
            }}
            trackColor={{ false: colors.border, true: `${colors.primary}88` }}
            thumbColor={highContrastMode ? colors.primary : colors.disabled}
            accessibilityLabel="고대비 모드"
            accessibilityRole="switch"
          />
        </View>
      </View>

      {/* 이용 기록 */}
      <SectionHeader title="이용 기록" />
      <View style={styles.historyCard}>
        {MOCK_HISTORY.map((item, i) => (
          <React.Fragment key={item.id}>
            {i > 0 && <View style={styles.divider} />}
            <View style={styles.historyRow}>
              <View style={styles.historyInfo}>
                <Text style={styles.historyDest}>{item.dest}</Text>
                <Text style={styles.historyDate}>{item.date}</Text>
              </View>
              <Text style={styles.historyFare}>{item.fare}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>

      {/* 로그아웃 */}
      <TouchableOpacity
        onPress={handleLogout}
        style={styles.logoutBtn}
        accessibilityLabel="로그아웃"
        accessibilityRole="button"
        activeOpacity={0.8}
      >
        <Text style={styles.logoutBtnText}>로그아웃</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 8 },

  sectionTitle: {
    fontSize: 22,
    fontWeight: typography.fontWeightBold,
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },

  profileCard: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 20,
    gap: 16,
    alignItems: 'center',
    marginBottom: 4,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: { fontSize: 32, fontWeight: typography.fontWeightBold, color: colors.white },
  profileInfo: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  profileName: { fontSize: 26, fontWeight: typography.fontWeightBold, color: colors.white },
  editChip: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  editChipText: { fontSize: 15, color: colors.white, fontWeight: typography.fontWeightBold },
  nameEditRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  nameInput: {
    flex: 1,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 20,
    color: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  saveBtn: { backgroundColor: colors.accent, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  saveBtnText: { fontSize: typography.bodyMin, fontWeight: typography.fontWeightBold, color: colors.white },
  profilePhone: { fontSize: typography.bodyMin, color: 'rgba(255,255,255,0.8)' },
  profileSub: { fontSize: 15, color: 'rgba(255,255,255,0.7)' },

  favCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 4,
  },
  favRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 72,
    gap: 12,
  },
  favIcon: { fontSize: 30 },
  favInfo: { flex: 1, gap: 2 },
  favLabel: { fontSize: 20, fontWeight: typography.fontWeightBold, color: colors.textPrimary },
  favAddress: { fontSize: 15, color: colors.textSecondary },
  favActions: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  reorderBtn: {
    width: 40,
    height: 40,
    backgroundColor: colors.border,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reorderBtnDisabled: { opacity: 0.3 },
  reorderBtnText: { fontSize: 20, fontWeight: typography.fontWeightBold, color: colors.textPrimary },
  deleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  deleteBtnText: { fontSize: 15, color: colors.danger, fontWeight: typography.fontWeightBold },

  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 14,
    minHeight: 80,
    marginBottom: 4,
  },
  navRowIcon: { fontSize: 32 },
  navRowText: { flex: 1, gap: 2 },
  navRowLabel: { fontSize: 20, fontWeight: typography.fontWeightBold, color: colors.textPrimary },
  navRowSub: { fontSize: 15, color: colors.textSecondary },
  navRowArrow: { fontSize: 28, color: colors.textSecondary, fontWeight: typography.fontWeightBold },

  settingsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 12,
    marginBottom: 4,
  },
  settingLabel: { fontSize: 20, fontWeight: typography.fontWeightBold, color: colors.textPrimary, marginBottom: 8 },
  settingDesc: { fontSize: 15, color: colors.textSecondary, lineHeight: 20 },
  segmentRow: { flexDirection: 'row', gap: 8 },
  segment: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  segmentActive: { borderColor: colors.primary, backgroundColor: `${colors.primary}12` },
  segmentText: { fontSize: typography.bodyMin, fontWeight: typography.fontWeightBold, color: colors.textSecondary },
  segmentTextActive: { color: colors.primary },
  toggleRow: { flexDirection: 'row', alignItems: 'center', minHeight: 56, gap: 12 },
  toggleText: { flex: 1, gap: 2 },

  historyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 4,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    minHeight: 72,
  },
  historyInfo: { flex: 1, gap: 4 },
  historyDest: { fontSize: 20, fontWeight: typography.fontWeightBold, color: colors.textPrimary },
  historyDate: { fontSize: 15, color: colors.textSecondary },
  historyFare: { fontSize: typography.bodyMin, fontWeight: typography.fontWeightBold, color: colors.textPrimary },

  logoutBtn: {
    height: 72,
    backgroundColor: colors.surface,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.danger,
    marginTop: 8,
  },
  logoutBtnText: { fontSize: typography.button, fontWeight: typography.fontWeightBold, color: colors.danger },

  emptyText: { fontSize: typography.bodyMin, color: colors.textSecondary, textAlign: 'center', padding: 24 },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: 16 },
});

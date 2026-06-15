import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { useRideStore, FamilyMember, AlertSettings } from '../stores/rideStore';
import { ttsService } from '../services/ttsService';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

interface ToggleRowProps {
  label: string;
  sub: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}

function ToggleRow({ label, sub, value, onToggle }: ToggleRowProps) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleText}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleSub}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: `${colors.primary}88` }}
        thumbColor={value ? colors.primary : colors.disabled}
        accessibilityLabel={label}
        accessibilityRole="switch"
      />
    </View>
  );
}

export default function FamilyLinkScreen() {
  const insets = useSafeAreaInsets();

  const {
    userName,
    familyMembers,
    alertSettings,
    addFamilyMember,
    removeFamilyMember,
    setAlertSettings,
    setFamilyLinked,
  } = useRideStore();

  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      ttsService.speak('가족과 연결하면 택시를 탈 때 가족에게 자동으로 알림이 가요.');
    }, 600);
    return () => clearTimeout(t);
  }, []);

  function handleAddMember() {
    const trimName = newName.trim();
    const trimPhone = newPhone.replace(/\D/g, '');

    if (!trimName) {
      Alert.alert('알림', '보호자 이름을 입력해 주세요.');
      return;
    }
    if (trimPhone.length < 10) {
      Alert.alert('알림', '올바른 휴대폰 번호를 입력해 주세요.');
      return;
    }

    const member: FamilyMember = {
      id: Date.now().toString(),
      name: trimName,
      phone: formatPhone(trimPhone),
      isActive: true,
      linkedAt: new Date().toLocaleDateString('ko-KR'),
    };

    const smsUrl = `sms:${trimPhone}?body=${encodeURIComponent(
      `안녕하세요! ${userName}님께서 SilverRide 앱에서 보호자로 연동하셨습니다. 앞으로 이동 시 자동 알림을 보내드릴게요.`
    )}`;

    addFamilyMember(member);
    setFamilyLinked(true);
    setNewName('');
    setNewPhone('');

    Alert.alert(
      '✅ 연동 완료',
      `${trimName}님을 보호자로 등록했습니다. 안내 문자를 보낼까요?`,
      [
        { text: '나중에', style: 'cancel' },
        { text: '문자 보내기', onPress: () => Linking.openURL(smsUrl) },
      ]
    );
    ttsService.speak(`${trimName}님을 보호자로 등록했습니다.`);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function handleRemove(member: FamilyMember) {
    Alert.alert(
      '연동 해제',
      `${member.name}님을 보호자 목록에서 제거할까요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '제거',
          style: 'destructive',
          onPress: () => {
            removeFamilyMember(member.id);
            if (useRideStore.getState().familyMembers.length === 0) {
              setFamilyLinked(false);
            }
            ttsService.speak(`${member.name}님을 제거했습니다.`);
          },
        },
      ]
    );
  }

  function setAlert(key: keyof AlertSettings, value: boolean) {
    setAlertSettings({ ...alertSettings, [key]: value });
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) }]}
      showsVerticalScrollIndicator={false}
    >
      {/* 안내 카드 */}
      <View style={styles.heroCard}>
        <Text style={styles.heroIcon}>👨‍👩‍👧</Text>
        <Text style={styles.heroTitle}>가족과 연결하기</Text>
        <Text style={styles.heroDesc}>
          보호자를 등록하면 택시를 탈 때마다{'\n'}
          자동으로 알림이 가요. 안심하고 이용하세요.
        </Text>
      </View>

      {/* 등록된 보호자 목록 */}
      <Text style={styles.sectionTitle}>등록된 보호자</Text>
      {familyMembers.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>아직 등록된 보호자가 없어요.</Text>
        </View>
      ) : (
        familyMembers.map((m) => (
          <View key={m.id} style={styles.memberCard}>
            <View style={styles.memberAvatar}>
              <Text style={styles.memberAvatarText}>{m.name.charAt(0)}</Text>
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{m.name}</Text>
              <Text style={styles.memberPhone}>{m.phone}</Text>
              <Text style={styles.memberDate}>연동일: {m.linkedAt}</Text>
            </View>
            <View style={styles.memberRight}>
              <View style={[styles.statusBadge, m.isActive ? styles.statusActive : styles.statusInactive]}>
                <Text style={styles.statusText}>{m.isActive ? '활성' : '비활성'}</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleRemove(m)}
                style={styles.removeBtn}
                accessibilityLabel={`${m.name} 보호자 제거`}
                accessibilityRole="button"
              >
                <Text style={styles.removeBtnText}>제거</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {/* 보호자 추가 폼 */}
      <Text style={styles.sectionTitle}>보호자 추가하기</Text>
      <View style={styles.formCard}>
        <Text style={styles.inputLabel}>이름</Text>
        <TextInput
          value={newName}
          onChangeText={setNewName}
          placeholder="보호자 이름"
          placeholderTextColor={colors.textSecondary}
          style={styles.textInput}
          accessibilityLabel="보호자 이름 입력"
          returnKeyType="next"
        />
        <Text style={styles.inputLabel}>휴대폰 번호</Text>
        <TextInput
          value={newPhone}
          onChangeText={(t) => setNewPhone(formatPhone(t))}
          placeholder="010-0000-0000"
          placeholderTextColor={colors.textSecondary}
          style={styles.textInput}
          keyboardType="phone-pad"
          accessibilityLabel="보호자 휴대폰 번호 입력"
          returnKeyType="done"
        />
        <TouchableOpacity
          onPress={handleAddMember}
          style={styles.addBtn}
          accessibilityLabel="보호자 추가하기"
          accessibilityRole="button"
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>👤 보호자 추가하기</Text>
        </TouchableOpacity>
      </View>

      {/* 알림 설정 */}
      <Text style={styles.sectionTitle}>알림 설정</Text>
      <View style={styles.toggleCard}>
        <ToggleRow
          label="출발 알림"
          sub="택시 탈 때 보호자에게 알림"
          value={alertSettings.onDeparture}
          onToggle={(v) => setAlert('onDeparture', v)}
        />
        <View style={styles.divider} />
        <ToggleRow
          label="도착 알림"
          sub="목적지에 도착하면 보호자에게 알림"
          value={alertSettings.onArrival}
          onToggle={(v) => setAlert('onArrival', v)}
        />
        <View style={styles.divider} />
        <ToggleRow
          label="5분 미하차 알림"
          sub="도착 후 5분 내 미하차 시 알림"
          value={alertSettings.onDementiaAlert}
          onToggle={(v) => setAlert('onDementiaAlert', v)}
        />
        <View style={styles.divider} />
        <ToggleRow
          label="긴급 SOS 알림"
          sub="SOS 발동 시 즉시 보호자에게 알림"
          value={alertSettings.onEmergency}
          onToggle={(v) => setAlert('onEmergency', v)}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 8 },

  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 8,
  },
  heroIcon: { fontSize: 52, marginBottom: 10 },
  heroTitle: { fontSize: typography.title, fontWeight: typography.fontWeightBold, color: colors.white, marginBottom: 10 },
  heroDesc: { fontSize: typography.bodyMin, color: 'rgba(255,255,255,0.88)', textAlign: 'center', lineHeight: 28 },

  sectionTitle: {
    fontSize: 22,
    fontWeight: typography.fontWeightBold,
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },

  emptyBox: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: { fontSize: typography.bodyMin, color: colors.textSecondary },

  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    gap: 12,
  },
  memberAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: { fontSize: 22, fontWeight: typography.fontWeightBold, color: colors.white },
  memberInfo: { flex: 1, gap: 2 },
  memberName: { fontSize: 20, fontWeight: typography.fontWeightBold, color: colors.textPrimary },
  memberPhone: { fontSize: typography.bodyMin, color: colors.textSecondary },
  memberDate: { fontSize: 14, color: colors.textSecondary },
  memberRight: { alignItems: 'flex-end', gap: 8 },
  statusBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  statusActive: { backgroundColor: `${colors.success}22` },
  statusInactive: { backgroundColor: colors.border },
  statusText: { fontSize: 14, fontWeight: typography.fontWeightBold, color: colors.success },
  removeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  removeBtnText: { fontSize: 14, color: colors.danger, fontWeight: typography.fontWeightBold },

  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 8,
    marginBottom: 8,
  },
  inputLabel: { fontSize: typography.bodyMin, fontWeight: typography.fontWeightBold, color: colors.textPrimary },
  textInput: {
    height: 60,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 16,
    fontSize: typography.bodyMin,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  addBtn: {
    height: 72,
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  addBtnText: { fontSize: typography.button, fontWeight: typography.fontWeightBold, color: colors.white },

  toggleCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    minHeight: 72,
    gap: 12,
  },
  toggleText: { flex: 1, gap: 2 },
  toggleLabel: { fontSize: 20, fontWeight: typography.fontWeightBold, color: colors.textPrimary },
  toggleSub: { fontSize: 15, color: colors.textSecondary, lineHeight: 20 },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: 16 },
});

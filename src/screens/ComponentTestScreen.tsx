import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import SeniorButton from '../components/SeniorButton';
import SOSButton from '../components/SOSButton';
import FavoriteCard from '../components/FavoriteCard';
import VoiceInputButton from '../components/VoiceInputButton';
import WeatherWarningBanner from '../components/WeatherWarningBanner';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function ComponentTestScreen() {
  const [voiceResult, setVoiceResult] = useState('');

  return (
    <SafeAreaView style={styles.safe}>
      <WeatherWarningBanner />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Section title="SeniorButton">
          <SeniorButton
            label="택시 부르기"
            onPress={() => Alert.alert('primary large')}
            variant="primary"
            size="large"
            icon="🚕"
          />
          <SeniorButton
            label="집으로 가기"
            onPress={() => Alert.alert('secondary xl')}
            variant="secondary"
            size="xl"
            icon="🏠"
            style={{ marginTop: 12 }}
          />
          <SeniorButton
            label="SOS 긴급호출"
            onPress={() => Alert.alert('danger')}
            variant="danger"
            size="large"
            icon="🚨"
            style={{ marginTop: 12 }}
          />
          <SeniorButton
            label="비활성 버튼"
            onPress={() => {}}
            variant="primary"
            size="large"
            disabled
            style={{ marginTop: 12 }}
          />
        </Section>

        <Section title="FavoriteCard">
          <FavoriteCard
            label="집"
            icon="🏠"
            address="서울시 강남구 테헤란로 123"
            onPress={() => Alert.alert('집 선택')}
            color={colors.primary}
          />
          <FavoriteCard
            label="서울성모병원"
            icon="🏥"
            address="서울시 서초구 반포대로 222"
            onPress={() => Alert.alert('병원 선택')}
            color={colors.success}
          />
          <FavoriteCard
            label="큰딸네"
            icon="👨‍👩‍👧"
            address="서울시 송파구 올림픽로 300"
            onPress={() => Alert.alert('큰딸네 선택')}
            color={colors.accent}
          />
        </Section>

        <Section title="VoiceInputButton">
          <VoiceInputButton
            onResult={(text) => {
              setVoiceResult(text);
              Alert.alert('음성 인식 결과', text);
            }}
          />
          {voiceResult ? (
            <Text style={styles.voiceResult}>결과: {voiceResult}</Text>
          ) : null}
        </Section>

        <Section title="SOSButton (우측 하단 고정)">
          <Text style={styles.hint}>
            화면 우측 하단의 빨간 원 버튼을 3초 동안 누르면{'\n'}SOS가 활성화됩니다.
          </Text>
        </Section>

        <View style={{ height: 120 }} />
      </ScrollView>

      <SOSButton onActivate={() => Alert.alert('SOS 활성화', '긴급 호출이 시작됩니다!')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: typography.title,
    fontWeight: typography.fontWeightBold,
    color: colors.primary,
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingBottom: 8,
  },
  hint: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: typography.body * typography.lineHeight,
    textAlign: 'center',
    paddingVertical: 16,
  },
  voiceResult: {
    marginTop: 16,
    fontSize: typography.body,
    color: colors.success,
    fontWeight: typography.fontWeightBold,
    textAlign: 'center',
  },
});

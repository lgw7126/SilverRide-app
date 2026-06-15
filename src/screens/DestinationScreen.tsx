import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { strings } from '../constants/koreanStrings';
import { ttsService } from '../services/ttsService';
import { useRideStore, FavoritePlace } from '../stores/rideStore';
import FavoriteCard from '../components/FavoriteCard';
import VoiceInputButton from '../components/VoiceInputButton';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const VOICE_SECTION_HEIGHT = Math.round(SCREEN_HEIGHT * 0.30);

type Props = StackScreenProps<RootStackParamList, 'Destination'>;

export default function DestinationScreen({ navigation }: Props) {
  const { favoriteList, setDestination } = useRideStore();
  const [searchText, setSearchText] = useState('');
  const [voiceText, setVoiceText] = useState('');
  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    ttsService.speak('어디로 가실까요? 말씀해 주시거나 아래에서 선택해 주세요.');
  }, []);

  const navigateToConfirm = useCallback(
    (dest: FavoritePlace) => {
      setDestination(dest);
      navigation.navigate('RideConfirm', { destinationName: dest.label });
    },
    [navigation, setDestination]
  );

  const handleVoiceResult = useCallback(
    (text: string) => {
      setVoiceText(text);
      ttsService.speak(`${text}으로 가시겠어요?`);
      const dest: FavoritePlace = {
        id: 'voice',
        label: text,
        icon: '📍',
        address: text,
      };
      navigateToConfirm(dest);
    },
    [navigateToConfirm]
  );

  const handleFavoritePress = useCallback(
    (fav: FavoritePlace) => {
      navigateToConfirm(fav);
    },
    [navigateToConfirm]
  );

  const handleSearch = useCallback(() => {
    const trimmed = searchText.trim();
    if (!trimmed) return;
    const dest: FavoritePlace = {
      id: 'search',
      label: trimmed,
      icon: '🔍',
      address: trimmed,
    };
    navigateToConfirm(dest);
  }, [searchText, navigateToConfirm]);

  const filtered =
    searchText.length > 0
      ? favoriteList.filter(
          (f) =>
            f.label.includes(searchText) || f.address.includes(searchText)
        )
      : favoriteList;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* 상단 30% — 음성 입력 */}
      <View style={[styles.voiceSection, { height: VOICE_SECTION_HEIGHT }]}>
        <Text style={styles.voiceTitle}>말씀해 주세요</Text>
        <Text style={styles.voiceSub}>
          목적지를 말씀하시면 바로 출발해요
        </Text>
        {voiceText ? (
          <Text style={styles.voiceResult}>"{voiceText}"</Text>
        ) : (
          <View style={styles.voiceButtonWrap}>
            <VoiceInputButton onResult={handleVoiceResult} />
          </View>
        )}
      </View>

      {/* 구분선 */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>즐겨찾는 곳</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* 중간 — 즐겨찾기 목록 */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {filtered.length > 0 ? (
          filtered.map((fav) => (
            <FavoriteCard
              key={fav.id}
              label={fav.label}
              icon={fav.icon}
              address={fav.address}
              color={fav.color}
              onPress={() => handleFavoritePress(fav)}
            />
          ))
        ) : (
          <Text style={styles.noResult}>{strings.destination.noResult}</Text>
        )}
      </ScrollView>

      {/* 하단 — 텍스트 검색 */}
      <View style={styles.searchBar}>
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder={strings.destination.inputPlaceholder}
          placeholderTextColor={colors.textSecondary}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
          accessibilityLabel="목적지 텍스트 입력"
        />
        <TouchableOpacity
          onPress={handleSearch}
          style={styles.searchButton}
          accessibilityLabel="검색하기"
          accessibilityRole="button"
        >
          <Text style={styles.searchButtonText}>검색</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  voiceSection: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  voiceTitle: {
    fontSize: typography.title,
    fontWeight: typography.fontWeightBold,
    color: colors.white,
    marginBottom: 6,
  },
  voiceSub: {
    fontSize: typography.bodyMin,
    color: `${colors.white}CC`,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: typography.bodyMin * typography.lineHeight,
  },
  voiceButtonWrap: {
    marginTop: 4,
  },
  voiceResult: {
    fontSize: typography.body,
    fontWeight: typography.fontWeightBold,
    color: colors.white,
    marginTop: 8,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: typography.small,
    fontWeight: typography.fontWeightBold,
    color: colors.textSecondary,
    marginHorizontal: 12,
  },
  scrollArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  noResult: {
    textAlign: 'center',
    fontSize: typography.bodyMin,
    color: colors.textSecondary,
    marginTop: 40,
    lineHeight: typography.bodyMin * typography.lineHeight,
  },
  searchBar: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: 60,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: typography.bodyMin,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  searchButton: {
    width: 80,
    height: 60,
    borderRadius: 12,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: typography.body,
    fontWeight: typography.fontWeightBold,
    color: colors.white,
  },
});

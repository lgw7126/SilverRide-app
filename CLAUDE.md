# SilverRide — 시니어 전용 택시 앱

## 프로젝트 개요
- 제품명: SilverRide
- 플랫폼: React Native (Expo) — iOS / Android 동시 지원
- 타겟: 60세 이상 시니어 (디지털 취약 계층 포함) + 그 가족
- 핵심 차별점: 카카오T 대비 초대형 UI, 3탭 호출, 가족 연동, 음성 안내, SOS

## 기술 스택
- 프레임워크: React Native + Expo SDK 51
- 언어: TypeScript
- 내비게이션: React Navigation v6 (Stack + Bottom Tab)
- 상태 관리: Zustand
- 지도: react-native-maps + expo-location
- 음성 안내(TTS): expo-speech
- 음성 입력(STT): expo-av + @react-native-voice/voice
- 푸시 알림: expo-notifications
- 결제: 토스페이먼츠 SDK
- 스타일: StyleSheet (NativeWind 사용 금지 — 시니어 UI 정밀 제어 필요)
- 저장소: AsyncStorage (로컬), Firebase Firestore (원격)
- 인증: Firebase Auth (휴대폰 번호 인증)

## 디자인 시스템 (반드시 준수)

### 색상
- Primary: #1F4E79 (딥 블루 — 신뢰, 안정)
- Accent: #E8701A (오렌지 — 호출 버튼, CTA)
- Background: #FFFFFF
- Surface: #F5F7FA
- Text Primary: #1A1A1A
- Text Secondary: #666666
- Success: #2E7D32
- Warning: #F57F17
- Danger: #C62828
- SOS: #D32F2F

### 타이포그래피 (시니어 가독성 최우선)
- 본문 최소: 18sp
- 버튼 텍스트: 22sp Bold
- 제목: 28sp Bold
- 큰 숫자(요금 등): 40sp Bold
- 줄간격: 1.6 이상

### 컴포넌트 크기 (절대 작게 만들지 말 것)
- 버튼 최소 높이: 72px
- 아이콘 최소: 32px
- 터치 영역 최소: 60×60px
- 즐겨찾기 카드: 높이 100px 이상
- SOS 버튼: 항상 고정, 최소 80×80px

### UX 원칙
- 화면당 핵심 액션 최대 3개
- 모든 버튼에 텍스트 레이블 필수 (아이콘만 절대 금지)
- 모든 주요 액션 후 TTS 음성 안내 실행
- 오류 메시지: 전문 용어 금지, 쉬운 한국어
- 뒤로가기: 항상 좌측 상단 명시적 버튼 제공

## 화면 목록 (구현 순서)
1. SplashScreen — 로고 + 앱 이름
2. OnboardingScreen — 슬라이드 3장 (서비스 소개)
3. PhoneAuthScreen — 휴대폰 번호 인증
4. HomeScreen — 지도 + 즐겨찾기 버튼 + SOS
5. DestinationScreen — 목적지 선택 (음성/텍스트/즐겨찾기)
6. RideConfirmScreen — 예상 요금 + 호출 확인
7. WaitingScreen — 기사 배정 대기 + 실시간 위치
8. RidingScreen — 탑승 중 화면 + SOS
9. PaymentCompleteScreen — 결제 완료 + 간단 평가
10. MyPageScreen — 즐겨찾기 관리 + 보호자 연동 + 설정
11. FamilyLinkScreen — 보호자 연동 설정
12. FamilyMonitorScreen — (보호자용) 실시간 위치 모니터링
13. EmergencyScreen — SOS 활성화 화면

## 카카오T 대비 차별화 기능 (반드시 구현)
1. 치매 안심 모드: 목적지 도착 후 5분 내 미하차 시 보호자 자동 알림
2. 낙상 감지: 탑승 중 급격한 가속도 변화 감지 시 SOS 자동 발동
3. 단골 기사 예약: 별점 높은 기사를 즐겨찾기 → 우선 배정 요청
4. 음성 전용 모드: 화면을 보지 않고 음성만으로 호출 완료
5. 복약 알림 연동: 탑승 예약 시 "병원 다녀오면 약 드세요" 리마인더 설정
6. 날씨 우산 알림: 호출 시 우천 예보면 "우산 챙기세요" 팝업
7. 귀가 완료 알림: 목적지 도착 시 가족에게 "어르신이 안전하게 도착했습니다" 자동 문자
8. 느린 말하기 모드: TTS 속도 0.7x로 고정, 중요 정보 두 번 반복

## 폴더 구조
```
src/
├── components/
│   ├── SeniorButton.tsx
│   ├── SOSButton.tsx
│   ├── FavoriteCard.tsx
│   ├── VoiceInputButton.tsx
│   └── WeatherWarningBanner.tsx
├── screens/
├── navigation/
├── stores/
├── services/
│   ├── ttsService.ts
│   ├── locationService.ts
│   ├── emergencyService.ts
│   ├── familyAlertService.ts
│   ├── dementiaGuardService.ts
│   └── medicationReminderService.ts
├── hooks/
├── constants/
│   ├── colors.ts
│   ├── typography.ts
│   └── koreanStrings.ts
└── utils/
```

## 한국어 텍스트 원칙
- 모든 UI 텍스트는 koreanStrings.ts에 상수로 관리
- 존댓말 사용: "어디로 가실까요?", "잠시만 기다려 주세요"
- 오류: "죄송합니다, 잠시 후 다시 시도해 주세요"
- 버튼: "택시 부르기", "집으로 가기", "병원 가기"

## 코딩 규칙
- TypeScript strict mode
- 함수형 컴포넌트 + hooks만 사용
- 모든 컴포넌트에 accessibility label 필수
- TTS는 화면 전환마다 자동 실행 (ttsService.speak() 호출)
- 주석: 한국어로 작성

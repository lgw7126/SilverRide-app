# 실버라이드 (SilverRide)

어르신을 위한 편안한 택시 앱 — 60세 이상 시니어와 그 가족을 위한 React Native 앱입니다.

## 특징

- **초대형 UI**: 최소 버튼 높이 72px, 글씨 크기 18sp 이상
- **음성 안내 (TTS)**: 모든 화면 전환마다 한국어 음성 안내
- **음성 호출**: 화면을 보지 않고 말로만 택시 호출 완료
- **가족 연동**: 탑승·도착 시 가족에게 실시간 알림
- **SOS 긴급 버튼**: 모든 화면에서 접근 가능한 긴급 호출
- **치매 안심 모드**: 목적지 미도착 시 보호자 자동 알림
- **낙상 감지**: 가속도 센서로 이상 감지 시 자동 SOS

## 기술 스택

| 항목 | 사용 기술 |
|------|-----------|
| 프레임워크 | React Native + Expo SDK ~56 |
| 언어 | TypeScript (strict) |
| 내비게이션 | React Navigation v6 |
| 상태 관리 | Zustand |
| 지도 | react-native-maps + expo-location |
| TTS | expo-speech (ko-KR) |
| STT | @react-native-voice/voice |
| 인증 | Firebase Auth (전화번호) |
| 저장소 | AsyncStorage + Firebase Firestore |

## 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npx expo start

# iOS 시뮬레이터
npx expo run:ios

# Android 에뮬레이터
npx expo run:android
```

## 환경 변수

Firebase 설정을 위해 `src/config/firebase.ts` 파일을 생성하세요:

```ts
export const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};
```

## 폴더 구조

```
src/
├── components/       # 공통 컴포넌트 (SeniorButton, SOSButton, ...)
├── screens/          # 화면 컴포넌트 14개
├── navigation/       # AppNavigator (Stack + Tab)
├── stores/           # Zustand 스토어 (rideStore)
├── services/         # TTS, 위치, 긴급, 가족알림, 치매안심, 복약알림
├── hooks/            # useNetworkStatus
├── constants/        # colors, typography, koreanStrings
└── utils/            # errorHandler
```

## 화면 목록

1. SplashScreen — 로딩
2. OnboardingScreen — 서비스 소개 (3슬라이드)
3. PhoneAuthScreen — 전화번호 인증 (커스텀 키패드)
4. HomeScreen — 지도 + 즐겨찾기 + SOS
5. DestinationScreen — 목적지 선택
6. RideConfirmScreen — 요금 확인 + 호출
7. WaitingScreen — 기사 배정 대기
8. RidingScreen — 탑승 중
9. PaymentCompleteScreen — 결제 완료
10. MyPageScreen — 내 정보 + 즐겨찾기 관리
11. FamilyLinkScreen — 보호자 연동
12. FamilyMonitorScreen — 보호자용 위치 모니터링
13. EmergencyScreen — SOS 긴급 화면
14. VoiceOnlyScreen — 음성 전용 호출

## 접근성

- 모든 버튼에 `accessibilityLabel` + `accessibilityRole` 지정
- 장식용 이모지는 `accessibilityElementsHidden={true}` 처리
- 터치 영역 최소 60×60px 보장
- VoiceOver / TalkBack 동작 검증 필요

## 라이선스

MIT

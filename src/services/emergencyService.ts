import { Accelerometer, type AccelerometerMeasurement } from 'expo-sensors';
import { ttsService } from './ttsService';
import { strings } from '../constants/koreanStrings';

const FALL_THRESHOLD_G = 2.5;   // ≈ 25 m/s² (1G = 9.8 m/s²)
const SOS_COUNTDOWN_MS = 30_000;

export type FallCallback = (cancelFn: () => void) => void;
export type SOSCallback = () => void;

// 모듈 수준 상태 (싱글턴)
let accelSub: { remove(): void } | null = null;
let fallTimer: ReturnType<typeof setTimeout> | null = null;
let isCounting = false;

export const emergencyService = {
  async triggerSOS(
    location?: { latitude: number; longitude: number },
    userId?: string
  ): Promise<void> {
    ttsService.speak(strings.tts.sosActivated);
    console.log('[SOS] 긴급 신호 발동', { location, userId });
    // TODO: Firebase Functions → 보호자 FCM 푸시 + 현재 위치 전송
    // TODO: Firebase Firestore에 SOS 이벤트 기록
  },

  startFallDetection(onFallDetected: FallCallback, onSOSRequired: SOSCallback): void {
    if (accelSub) return; // 이미 실행 중
    isCounting = false;
    Accelerometer.setUpdateInterval(150);

    accelSub = Accelerometer.addListener(({ x, y, z }: AccelerometerMeasurement) => {
      const g = Math.sqrt(x * x + y * y + z * z);
      if (g > FALL_THRESHOLD_G && !isCounting) {
        isCounting = true;
        console.log(`[낙상 감지] 가속도 ${g.toFixed(2)}G 감지 — 카운트다운 시작`);
        ttsService.speak('낙상이 감지되었습니다. 괜찮으시면 취소를 눌러 주세요.');

        const cancel = () => {
          if (fallTimer) { clearTimeout(fallTimer); fallTimer = null; }
          isCounting = false;
          ttsService.speak('확인했습니다. 이상이 없으시군요. 안전하게 이용해 주세요.');
          console.log('[낙상 감지] 카운트다운 취소');
        };

        onFallDetected(cancel);

        fallTimer = setTimeout(() => {
          if (!isCounting) return;
          isCounting = false;
          console.log('[낙상 감지] 30초 경과 — SOS 자동 발동');
          void emergencyService.triggerSOS();
          onSOSRequired();
        }, SOS_COUNTDOWN_MS);
      }
    });
    console.log('[낙상 감지] 가속도 모니터링 시작');
  },

  stopFallDetection(): void {
    accelSub?.remove();
    accelSub = null;
    if (fallTimer) { clearTimeout(fallTimer); fallTimer = null; }
    isCounting = false;
    console.log('[낙상 감지] 모니터링 종료');
  },

  // 기존 API 호환성
  async activateSOS(): Promise<void> {
    await emergencyService.triggerSOS();
  },

  async handleFallDetected(): Promise<void> {
    console.log('[낙상 감지] SOS 자동 발동');
    await emergencyService.triggerSOS();
  },
};

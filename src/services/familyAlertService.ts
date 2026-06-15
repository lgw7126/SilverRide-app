import { ttsService } from './ttsService';
import { strings } from '../constants/koreanStrings';

export interface GeoLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export const familyAlertService = {
  async sendDepartureAlert(destination: string, eta: Date): Promise<void> {
    const etaStr = eta.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    const message = `어르신이 ${destination}(으)로 출발하셨습니다. 도착 예정: ${etaStr}`;
    ttsService.speak(`${destination}으로 출발합니다. 가족에게 알림을 보냈습니다.`);
    console.log('[가족 알림] 출발 알림:', message);
    // TODO: Firebase Functions → 보호자 FCM 푸시
    // TODO: 카카오 알림톡 API 연동
  },

  async sendArrivalAlert(location: GeoLocation): Promise<void> {
    ttsService.speak(strings.tts.familyArrivalNotice);
    console.log('[가족 알림] 도착 알림 전송:', location);
    // TODO: Firebase Functions → 보호자 FCM 푸시
    // TODO: 카카오 알림톡: "어르신이 안전하게 도착하셨습니다 ✅"
  },

  async sendDementiaAlert(location: GeoLocation): Promise<void> {
    const message = '어르신이 목적지 도착 후 5분 이상 차량에 계십니다. 확인 부탁드립니다.';
    ttsService.speak('목적지에 도착하셨습니다. 내리실 준비가 되셨나요?');
    console.log('[치매 안심] 미하차 알림:', { message, location });
    // TODO: Firebase Functions → 보호자 FCM 푸시
    // TODO: 카카오 알림톡 전송
  },

  async sendDelayAlert(delayMinutes: number): Promise<void> {
    const message = `어르신이 예상보다 ${delayMinutes}분 늦어지고 있습니다.`;
    console.log('[가족 알림] 지연 알림:', message);
    // TODO: Firebase Functions → 보호자 FCM 푸시
  },

  // 기존 API 호환성
  async sendArrivalNotice(destination: string): Promise<void> {
    ttsService.speak(strings.tts.familyArrivalNotice);
    console.log(`[귀가 알림] ${destination} 도착 알림 전송`);
  },

  startDementiaGuard(onAlert: () => void): ReturnType<typeof setTimeout> {
    return setTimeout(() => {
      console.log('[치매 안심] 미하차 감지 — 보호자 알림');
      onAlert();
    }, 5 * 60 * 1000);
  },
};

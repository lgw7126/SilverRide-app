import { ttsService } from './ttsService';
import { strings } from '../constants/koreanStrings';

export const familyAlertService = {
  async sendArrivalNotice(destination: string): Promise<void> {
    ttsService.speak(strings.tts.familyArrivalNotice);
    // TODO: Firebase Functions 또는 SMS API로 가족에게 문자 발송
    console.log(`[귀가 알림] ${destination} 도착 알림 전송`);
  },

  startDementiaGuard(onAlert: () => void): ReturnType<typeof setTimeout> {
    return setTimeout(() => {
      console.log('[치매 안심] 미하차 감지 — 보호자 알림');
      onAlert();
    }, 5 * 60 * 1000);
  },
};

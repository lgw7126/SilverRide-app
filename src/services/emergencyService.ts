import { ttsService } from './ttsService';
import { strings } from '../constants/koreanStrings';

export const emergencyService = {
  async activateSOS(): Promise<void> {
    ttsService.speak(strings.tts.sosActivated);
    // TODO: Firebase를 통해 보호자에게 푸시 알림 전송
    console.log('[SOS] 긴급 신호 발동');
  },

  async handleFallDetected(): Promise<void> {
    console.log('[낙상 감지] SOS 자동 발동');
    await this.activateSOS();
  },
};

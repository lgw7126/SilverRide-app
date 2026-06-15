import { ttsService } from './ttsService';
import { strings } from '../constants/koreanStrings';

export const medicationReminderService = {
  scheduleReminder(returnTimeMs: number): ReturnType<typeof setTimeout> {
    return setTimeout(() => {
      ttsService.speak(strings.tts.medicationReminder);
      console.log('[복약 알림] 병원 복약 리마인더 실행');
    }, returnTimeMs);
  },
};

import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { ttsService } from './ttsService';
import { strings } from '../constants/koreanStrings';

export const medicationReminderService = {
  async requestPermission(): Promise<boolean> {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  },

  async scheduleMedicationReminder(appointmentTime: Date): Promise<string | null> {
    const granted = await medicationReminderService.requestPermission();
    if (!granted) {
      console.warn('[복약 알림] 알림 권한 없음');
      return null;
    }

    // 예약 시간 + 2.5시간 = 귀가 예상 시각
    const reminderTime = new Date(appointmentTime.getTime() + 2.5 * 60 * 60 * 1000);
    const secondsFromNow = Math.max(60, Math.floor((reminderTime.getTime() - Date.now()) / 1000));

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💊 복약 알림',
        body: '병원 다녀오셨나요? 약 드실 시간입니다 💊',
        sound: true,
        data: { type: 'medication' },
      },
      trigger: {
        type: SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsFromNow,
        repeats: false,
      },
    });

    console.log(`[복약 알림] 예약 완료 — ${reminderTime.toLocaleString('ko-KR')}, id: ${id}`);
    return id;
  },

  async cancelReminder(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log(`[복약 알림] 취소 완료 — id: ${notificationId}`);
  },

  // 기존 API 호환성
  scheduleReminder(returnTimeMs: number): ReturnType<typeof setTimeout> {
    return setTimeout(() => {
      ttsService.speak(strings.tts.medicationReminder);
      console.log('[복약 알림] 병원 복약 리마인더 실행');
    }, returnTimeMs);
  },
};

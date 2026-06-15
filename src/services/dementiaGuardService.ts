import { familyAlertService } from './familyAlertService';

let guardTimer: ReturnType<typeof setTimeout> | null = null;

export const dementiaGuardService = {
  start(destination: string): void {
    this.stop();
    guardTimer = familyAlertService.startDementiaGuard(() => {
      console.log(`[치매 안심] ${destination} — 미하차 알림`);
    });
  },

  stop(): void {
    if (guardTimer) {
      clearTimeout(guardTimer);
      guardTimer = null;
    }
  },
};

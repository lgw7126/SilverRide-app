import type { LocationObject, LocationSubscription } from 'expo-location';
import { ttsService } from './ttsService';
import { familyAlertService } from './familyAlertService';
import { locationService } from './locationService';

const ARRIVAL_RADIUS_M = 200;
const GUARD_DELAY_MS = 5 * 60 * 1000; // 5분

interface Coords { latitude: number; longitude: number; }

// 두 좌표 간 거리 계산 (Haversine 공식)
function distanceMeters(a: Coords, b: Coords): number {
  const R = 6_371_000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const φ1 = (a.latitude * Math.PI) / 180;
  const φ2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

let locationSub: LocationSubscription | null = null;
let guardTimer: ReturnType<typeof setTimeout> | null = null;
let arrived = false;

function startGuardTimer(destination: string): void {
  guardTimer = setTimeout(() => {
    console.log(`[치매 안심] ${destination} — 5분 이상 미하차`);
    void familyAlertService.sendDementiaAlert({ latitude: 0, longitude: 0 });
  }, GUARD_DELAY_MS);
}

export const dementiaGuardService = {
  async startMonitoring(destination: string, destCoords?: Coords): Promise<void> {
    dementiaGuardService.stopMonitoring();
    arrived = false;

    if (!destCoords) {
      // 목적지 좌표 없으면 도착 즉시 5분 타이머 시작
      startGuardTimer(destination);
      return;
    }

    try {
      locationSub = await locationService.watchLocation((loc: LocationObject) => {
        if (arrived) return;
        const dist = distanceMeters(loc.coords, destCoords);
        if (dist <= ARRIVAL_RADIUS_M) {
          arrived = true;
          locationSub?.remove();
          locationSub = null;
          ttsService.speak('목적지에 도착하셨습니다. 내리실 준비가 되셨나요?');
          console.log(`[치매 안심] ${destination} 도착 감지 (${dist.toFixed(0)}m) — 5분 타이머 시작`);
          startGuardTimer(destination);
        }
      });
      console.log(`[치매 안심] ${destination} 위치 모니터링 시작`);
    } catch (e) {
      console.warn('[치매 안심] 위치 감지 실패:', e);
      startGuardTimer(destination);
    }
  },

  stopMonitoring(): void {
    locationSub?.remove();
    locationSub = null;
    if (guardTimer) { clearTimeout(guardTimer); guardTimer = null; }
    arrived = false;
    console.log('[치매 안심] 모니터링 종료');
  },

  // 기존 API 호환성
  start(destination: string): void {
    void dementiaGuardService.startMonitoring(destination);
  },

  stop(): void {
    dementiaGuardService.stopMonitoring();
  },
};

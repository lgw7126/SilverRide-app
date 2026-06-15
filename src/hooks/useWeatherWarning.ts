import { useState, useEffect } from 'react';
import { useRideStore } from '../stores/rideStore';

const DEFAULT_LAT = 37.5665;
const DEFAULT_LON = 126.978;

// WMO 기상 코드 기준 악천후 판정
function isBadWeatherCode(code: number): boolean {
  return (
    (code >= 51 && code <= 67) ||  // 이슬비/비
    (code >= 71 && code <= 77) ||  // 눈
    (code >= 80 && code <= 86) ||  // 소나기
    (code >= 95 && code <= 99)     // 뇌우
  );
}

function getMessageAndIcon(code: number, maxProb: number): { message: string; icon: string } {
  if (code >= 71 && code <= 77) {
    return { message: '오늘 눈이 옵니다. 미끄러우니 조심하세요 ❄️', icon: '❄️' };
  }
  if (code >= 95) {
    return { message: '오늘 천둥번개가 예보됩니다. 외출에 주의하세요 ⛈️', icon: '⛈️' };
  }
  if (maxProb > 50) {
    return { message: `강수 확률 ${maxProb}%. 우산을 챙겨 주세요 ☂️`, icon: '☂️' };
  }
  return { message: '비가 올 예정입니다. 우산을 챙겨 주세요 ☂️', icon: '☂️' };
}

export interface WeatherWarningState {
  hasWarning: boolean;
  message: string;
  icon: string;
  isLoading: boolean;
}

export function useWeatherWarning(): WeatherWarningState {
  const [state, setState] = useState<WeatherWarningState>({
    hasWarning: false,
    message: '',
    icon: '☀️',
    isLoading: true,
  });

  const currentLocation = useRideStore((s) => s.currentLocation);
  const lat = currentLocation?.coords.latitude ?? DEFAULT_LAT;
  const lon = currentLocation?.coords.longitude ?? DEFAULT_LON;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        const url =
          `https://api.open-meteo.com/v1/forecast` +
          `?latitude=${lat}&longitude=${lon}` +
          `&hourly=weathercode,precipitation_probability` +
          `&timezone=Asia%2FSeoul&forecast_days=1`;

        const res = await fetch(url);
        const data = (await res.json()) as {
          hourly?: {
            weathercode?: number[];
            precipitation_probability?: number[];
          };
        };

        if (cancelled) return;

        const codes = data?.hourly?.weathercode ?? [];
        const probs = data?.hourly?.precipitation_probability ?? [];

        // 오전 9시~오후 6시 (인덱스 9~17) 구간만 확인
        const dayCodes = codes.slice(9, 18);
        const dayProbs = probs.slice(9, 18);

        const worstCode = dayCodes.reduce((m, c) => (c > m ? c : m), 0);
        const maxProb = dayProbs.reduce((m, p) => (p > m ? p : m), 0);
        const hasWarning = isBadWeatherCode(worstCode) || maxProb > 50;

        setState({
          hasWarning,
          ...(hasWarning
            ? getMessageAndIcon(worstCode, maxProb)
            : { message: '', icon: '☀️' }),
          isLoading: false,
        });
      } catch {
        if (!cancelled) {
          setState({ hasWarning: false, message: '', icon: '☀️', isLoading: false });
        }
      }
    })();

    return () => { cancelled = true; };
  }, [lat, lon]);

  return state;
}

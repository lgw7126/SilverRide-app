import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { ttsService } from '../services/ttsService';

const PING_URL = 'https://www.google.com';
const POLL_INTERVAL_MS = 15_000;

async function checkOnline(): Promise<boolean> {
  try {
    const res = await fetch(PING_URL, { method: 'HEAD', cache: 'no-store' });
    return res.ok;
  } catch {
    return false;
  }
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const prevOnline = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    const online = await checkOnline();
    if (online !== prevOnline.current) {
      prevOnline.current = online;
      setIsOnline(online);
      if (!online) {
        ttsService.speak('인터넷에 연결되어 있지 않아요. 와이파이나 데이터를 확인해 주세요.');
      } else {
        ttsService.speak('인터넷에 다시 연결되었습니다.');
      }
    }
  }, []);

  useEffect(() => {
    void poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') void poll();
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      sub.remove();
    };
  }, [poll]);

  return isOnline;
}

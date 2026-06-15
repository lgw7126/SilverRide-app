import * as Speech from 'expo-speech';

const DEFAULT_RATE = 0.85;
const SLOW_RATE = 0.65;

let slowModeEnabled = false;

const queue: Array<{ text: string; rate: number }> = [];
let isPlaying = false;

const koOptions = (rate: number): Speech.SpeechOptions => ({
  language: 'ko-KR',
  rate,
  pitch: 1.0,
});

function drainQueue() {
  if (isPlaying || queue.length === 0) return;
  const next = queue.shift()!;
  isPlaying = true;
  Speech.speak(next.text, {
    ...koOptions(next.rate),
    onDone: () => {
      isPlaying = false;
      drainQueue();
    },
    onStopped: () => {
      isPlaying = false;
      // queue discarded when stop() is called
    },
    onError: () => {
      isPlaying = false;
      drainQueue();
    },
  });
}

export const ttsService = {
  setSlowMode(enabled: boolean): void {
    slowModeEnabled = enabled;
  },

  // 즉시 재생 — 기존 큐를 모두 비우고 즉시 말한다
  speak(text: string, rate?: number): void {
    const resolvedRate = rate ?? (slowModeEnabled ? SLOW_RATE : DEFAULT_RATE);
    Speech.stop();
    queue.length = 0;
    isPlaying = false;
    queue.push({ text, rate: resolvedRate });
    drainQueue();
  },

  // 큐에 추가 — 현재 재생 중인 TTS가 끝난 후 순서대로 재생
  enqueue(text: string, rate?: number): void {
    const resolvedRate = rate ?? (slowModeEnabled ? SLOW_RATE : DEFAULT_RATE);
    queue.push({ text, rate: resolvedRate });
    drainQueue();
  },

  speakSlowly(text: string): void {
    Speech.stop();
    queue.length = 0;
    isPlaying = false;
    // 같은 텍스트를 두 번 큐에 넣어 반복 재생
    queue.push({ text, rate: SLOW_RATE });
    queue.push({ text, rate: SLOW_RATE });
    drainQueue();
  },

  stop(): void {
    queue.length = 0;
    isPlaying = false;
    Speech.stop();
  },

  async isSpeaking(): Promise<boolean> {
    return Speech.isSpeakingAsync();
  },
};

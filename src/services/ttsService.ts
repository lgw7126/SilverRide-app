import * as Speech from 'expo-speech';

const DEFAULT_RATE = 0.85;
const SLOW_RATE = 0.65;

let slowModeEnabled = false;

const koOptions = (rate: number): Speech.SpeechOptions => ({
  language: 'ko-KR',
  rate,
  pitch: 1.0,
});

export const ttsService = {
  setSlowMode(enabled: boolean): void {
    slowModeEnabled = enabled;
  },

  speak(text: string, rate?: number): void {
    const resolvedRate = rate ?? (slowModeEnabled ? SLOW_RATE : DEFAULT_RATE);
    Speech.stop();
    Speech.speak(text, koOptions(resolvedRate));
  },

  speakSlowly(text: string): void {
    Speech.stop();
    Speech.speak(text, {
      ...koOptions(SLOW_RATE),
      onDone: () => {
        setTimeout(() => {
          Speech.speak(text, koOptions(SLOW_RATE));
        }, 1000);
      },
    });
  },

  stop(): void {
    Speech.stop();
  },

  async isSpeaking(): Promise<boolean> {
    return Speech.isSpeakingAsync();
  },
};

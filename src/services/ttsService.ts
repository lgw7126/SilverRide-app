import * as Speech from 'expo-speech';

const DEFAULT_RATE = 0.85;
const SLOW_RATE = 0.65;

const koOptions = (rate: number): Speech.SpeechOptions => ({
  language: 'ko-KR',
  rate,
  pitch: 1.0,
});

export const ttsService = {
  speak(text: string, rate: number = DEFAULT_RATE): void {
    Speech.stop();
    Speech.speak(text, koOptions(rate));
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

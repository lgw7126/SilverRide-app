import { Alert } from 'react-native';
import { ttsService } from '../services/ttsService';

type ErrorCode =
  | 'network'
  | 'location'
  | 'auth'
  | 'payment'
  | 'server'
  | 'unknown';

const MESSAGES: Record<ErrorCode, { title: string; body: string; tts: string }> = {
  network: {
    title: '인터넷 연결 없음',
    body: '인터넷에 연결되어 있지 않아요.\nWi-Fi나 데이터를 켜고 다시 시도해 주세요.',
    tts: '인터넷에 연결되어 있지 않아요. 와이파이나 데이터를 켜고 다시 시도해 주세요.',
  },
  location: {
    title: '위치 확인 안 됨',
    body: '현재 위치를 찾을 수 없어요.\n설정에서 위치 권한을 허용해 주세요.',
    tts: '현재 위치를 찾을 수 없어요. 설정에서 위치 권한을 허용해 주세요.',
  },
  auth: {
    title: '인증 오류',
    body: '인증번호가 맞지 않아요.\n다시 입력해 주세요.',
    tts: '인증번호가 맞지 않아요. 다시 입력해 주세요.',
  },
  payment: {
    title: '결제 실패',
    body: '결제가 완료되지 않았어요.\n카드 정보를 확인하고 다시 시도해 주세요.',
    tts: '결제가 완료되지 않았어요. 카드 정보를 확인하고 다시 시도해 주세요.',
  },
  server: {
    title: '서버 오류',
    body: '죄송합니다. 잠시 후 다시 시도해 주세요.',
    tts: '죄송합니다. 잠시 후 다시 시도해 주세요.',
  },
  unknown: {
    title: '오류가 발생했어요',
    body: '죄송합니다. 잠시 후 다시 시도해 주세요.',
    tts: '죄송합니다. 잠시 후 다시 시도해 주세요.',
  },
};

export function showError(code: ErrorCode, onRetry?: () => void): void {
  const msg = MESSAGES[code];
  ttsService.speak(msg.tts);

  const buttons = onRetry
    ? [
        { text: '취소', style: 'cancel' as const },
        { text: '다시 시도', onPress: onRetry },
      ]
    : [{ text: '확인' }];

  Alert.alert(msg.title, msg.body, buttons);
}

export function guessErrorCode(error: unknown): ErrorCode {
  if (!error) return 'unknown';
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('internet')) return 'network';
  if (msg.includes('location') || msg.includes('permission')) return 'location';
  if (msg.includes('auth') || msg.includes('credential') || msg.includes('otp')) return 'auth';
  if (msg.includes('payment') || msg.includes('card') || msg.includes('결제')) return 'payment';
  if (msg.includes('500') || msg.includes('server')) return 'server';
  return 'unknown';
}

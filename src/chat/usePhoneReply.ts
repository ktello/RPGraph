import { useState } from 'react';
import type { MessageRecord } from '../types';

export function usePhoneReply(conversationKey: string) {
  const [replyState, setReplyState] = useState<{
    conversationKey: string;
    message?: MessageRecord;
  }>(() => ({ conversationKey }));

  if (replyState.conversationKey !== conversationKey) {
    setReplyState({ conversationKey });
  }

  return {
    replyToMessage: replyState.message,
    selectReply: (message: MessageRecord) => setReplyState({ conversationKey, message }),
    clearReply: () => setReplyState({ conversationKey }),
  };
}

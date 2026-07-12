export type StorybookAssistantConversationMessage = {
  role: 'user' | 'assistant' | 'storybook' | 'error';
  text: string;
};

const conversationRoleLabels: Record<StorybookAssistantConversationMessage['role'], string> = {
  user: 'USER',
  assistant: 'ASSISTANT',
  storybook: 'STORYBOOK NOTICE',
  error: 'APP ERROR',
};

/** Formats the visible Storybook assistant conversation for the next model request. */
export function storybookAssistantConversationContext(
  messages: StorybookAssistantConversationMessage[],
) {
  if (messages.length === 0) {
    return '';
  }
  return [
    'Conversation so far (oldest to newest):',
    ...messages.map((message) => `${conversationRoleLabels[message.role]}: ${message.text}`),
  ].join('\n');
}

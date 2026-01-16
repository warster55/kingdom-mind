'use client';

// Re-export chat history functions from sanctuary-db
// This provides a clean import path for the useSanctuary hook
export {
  saveChatMessage,
  loadChatHistory,
  clearChatHistory,
  cleanupOldMessages,
  type ChatHistoryMessage,
} from './sanctuary-db';

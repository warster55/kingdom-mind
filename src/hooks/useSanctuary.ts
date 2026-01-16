'use client';

import { useState, useEffect, useCallback } from 'react';
import { getEncryptedBlob, setEncryptedBlob } from '@/lib/storage/sanctuary-db';
import { saveEncryptedMessage, loadEncryptedMessages, clearChatHistory } from '@/lib/storage/sanctuary-db';
import {
  initializeSanctuary,
  sendMentorMessage,
  encryptChatMessage,
  decryptChatMessages,
  type ChatMessage,
  type DisplayData
} from '@/lib/actions/chat';
import { INPUT_LIMITS } from '@/lib/security/sanitize';

export type { ChatMessage, DisplayData };
export { INPUT_LIMITS };

export interface SanctuaryState {
  isLoading: boolean;
  isNewUser: boolean;
  blob: string | null;
  display: DisplayData | null;
  error: string | null;
}

export function useSanctuary() {
  const [state, setState] = useState<SanctuaryState>({
    isLoading: true,
    isNewUser: false,
    blob: null,
    display: null,
    error: null,
  });

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  // Initialize - load existing sanctuary or create new one
  useEffect(() => {
    async function init() {
      try {
        // Load encrypted chat messages from IndexedDB and decrypt via server
        const encryptedRecords = await loadEncryptedMessages();
        if (encryptedRecords.length > 0) {
          const encryptedBlobs = encryptedRecords.map(r => r.encryptedBlob);
          const decryptedMessages = await decryptChatMessages(encryptedBlobs);
          if (decryptedMessages.length > 0) {
            setChatHistory(decryptedMessages);
          }
        }

        const existingBlob = await getEncryptedBlob();

        // Use server action to initialize/validate
        const result = await initializeSanctuary(existingBlob || undefined);

        if (result.error) {
          throw new Error(result.error);
        }

        // Store blob locally
        await setEncryptedBlob(result.blob);

        setState({
          isLoading: false,
          isNewUser: result.isNewUser,
          blob: result.blob,
          display: result.display,
          error: null,
        });
      } catch (error) {
        console.error('[Sanctuary] Init error:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to initialize sanctuary',
        }));
      }
    }

    init();
  }, []);

  // Send a message
  const sendMessage = useCallback(async (message: string) => {
    const trimmed = message.trim();

    // Client-side validation (server also validates - defense in depth)
    if (!trimmed || isStreaming) return;

    // Check length limit
    if (trimmed.length > INPUT_LIMITS.MAX_MESSAGE_LENGTH) {
      // Show error message to user
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Your message is too long. Please keep it under ${INPUT_LIMITS.MAX_MESSAGE_LENGTH} characters.`,
      };
      setChatHistory(prev => [...prev, errorMessage]);
      return;
    }

    setIsStreaming(true);

    // Add user message to history
    const userMessage: ChatMessage = { role: 'user', content: message };
    const userTimestamp = Date.now();
    setChatHistory(prev => [...prev, userMessage]);

    // Encrypt and persist user message to IndexedDB
    const encryptedUserMsg = await encryptChatMessage({
      ...userMessage,
      timestamp: userTimestamp,
    });
    await saveEncryptedMessage(encryptedUserMsg, userTimestamp);

    try {
      // Use server action instead of fetch
      const data = await sendMentorMessage(
        message,
        state.blob,
        [...chatHistory, userMessage]
      );

      if (data.error) {
        throw new Error(data.error);
      }

      // Add assistant response to history
      if (data.response) {
        const assistantMessage: ChatMessage = { role: 'assistant', content: data.response };
        const assistantTimestamp = Date.now();
        setChatHistory(prev => [...prev, assistantMessage]);

        // Encrypt and persist assistant message to IndexedDB
        const encryptedAssistantMsg = await encryptChatMessage({
          ...assistantMessage,
          timestamp: assistantTimestamp,
        });
        await saveEncryptedMessage(encryptedAssistantMsg, assistantTimestamp);
      }

      // Update state with new blob and display
      if (data.blob) {
        await setEncryptedBlob(data.blob);
        setState(prev => ({
          ...prev,
          blob: data.blob,
          display: data.display || prev.display,
        }));
      }

      return {
        response: data.response || '',
        breakthroughCount: data.breakthroughCount || 0,
      };
    } catch (error) {
      console.error('[Sanctuary] Send error:', error);

      // Add error response
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
      };
      setChatHistory(prev => [...prev, errorMessage]);

      return { response: errorMessage.content, breakthroughCount: 0 };
    } finally {
      setIsStreaming(false);
    }
  }, [state.blob, chatHistory, isStreaming]);

  // Clear chat history (but keep sanctuary data)
  const clearChat = useCallback(async () => {
    setChatHistory([]);
    await clearChatHistory();
  }, []);

  // Reset sanctuary (start fresh)
  const resetSanctuary = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Use server action to create fresh sanctuary
      const result = await initializeSanctuary();

      if (result.error) {
        throw new Error(result.error);
      }

      await setEncryptedBlob(result.blob);
      setChatHistory([]);
      await clearChatHistory();
      setState({
        isLoading: false,
        isNewUser: true,
        blob: result.blob,
        display: result.display,
        error: null,
      });
    } catch (error) {
      console.error('[Sanctuary] Reset error:', error);
      setState(prev => ({ ...prev, isLoading: false, error: 'Failed to reset' }));
    }
  }, []);

  return {
    ...state,
    chatHistory,
    isStreaming,
    sendMessage,
    clearChat,
    resetSanctuary,
  };
}

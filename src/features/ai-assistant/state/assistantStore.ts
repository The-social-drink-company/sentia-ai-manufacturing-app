import { create } from 'zustand';

import { aiInferenceService } from '../../../services/ai/aiInferenceService';
import type { AssistantContextSnapshot, AssistantMessage } from '../types';

interface AssistantState {
  conversationId?: string;
  messages: AssistantMessage[];
  isProcessing: boolean;
  error?: string | null;
  addUserMessage: (content: string, context?: AssistantContextSnapshot) => Promise<void>;
  reset: () => void;
}

function createMessage(role: AssistantMessage['role'], content: string, status: AssistantMessage['status'] = 'complete'): AssistantMessage {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  return {
    id,
    role,
    content,
    createdAt: new Date().toISOString(),
    status,
  };
}

export const useAssistantStore = create<AssistantState>((set, get) => ({
  conversationId: undefined,
  messages: [],
  isProcessing: false,
  error: null,
  async addUserMessage(content, context) {
    const userMessage = createMessage('user', content, 'complete');
    set((state) => ({
      messages: [...state.messages, userMessage],
      isProcessing: true,
      error: null,
    }));

    try {
      const response = await aiInferenceService.assistantQuery({
        message: content,
        context,
        conversationId: get().conversationId,
      });

      const assistantMessage: AssistantMessage = {
        id: response.messageId,
        role: 'assistant',
        content: response.content,
        createdAt: new Date().toISOString(),
        status: 'complete',
        citations: response.citations,
        chartSpec: response.chartSpec,
      };

      set({
        conversationId: response.conversationId,
        messages: [...get().messages, assistantMessage],
        isProcessing: false,
      });
    } catch (error) {
      console.error('[Assistant] Failed to fetch response', error);
      const assistantMessage = createMessage('assistant', 'I encountered an issue generating that insight. Please try again.', 'error');
      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isProcessing: false,
        error: (error as Error).message,
      }));
    }
  },
  reset() {
    set({
      conversationId: undefined,
      messages: [],
      isProcessing: false,
      error: null,
    });
  },
}));

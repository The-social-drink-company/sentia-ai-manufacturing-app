export type AssistantRole = 'user' | 'assistant' | 'system';

export interface AssistantMessage {
  id: string;
  role: AssistantRole;
  content: string;
  createdAt: string;
  status?: 'pending' | 'complete' | 'error';
  chartSpec?: unknown;
  citations?: Array<{ title: string; url?: string }>;
}

export interface AssistantContextSnapshot {
  route?: string;
  filters?: Record<string, unknown>;
  timeframe?: { from?: string; to?: string };
  userRole?: string;
}

export interface AssistantSuggestion {
  id: string;
  label: string;
  prompt: string;
}

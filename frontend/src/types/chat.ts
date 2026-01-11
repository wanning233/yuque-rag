// 聊天消息类型
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

// 会话类型
export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

// API 请求/响应类型
export interface ChatRequest {
  question: string;
}

export interface ChatResponse {
  answer: string;
}

export interface StreamChunk {
  content?: string;
  done?: boolean;
  error?: string;
}

// 主题类型
export type Theme = 'light' | 'dark';

// 应用状态类型
export interface AppState {
  currentSessionId: string | null;
  sessions: ChatSession[];
  theme: Theme;
}


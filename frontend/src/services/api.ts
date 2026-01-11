import axios from 'axios';
import { ChatRequest, ChatResponse, StreamChunk } from '../types/chat';

// API 基础 URL（开发环境使用代理）
const API_BASE_URL = import.meta.env.PROD ? 'http://localhost:8000' : '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60秒超时
});

/**
 * 发送聊天请求（一次性返回）
 */
export async function sendChatMessage(question: string): Promise<string> {
  const response = await api.post<ChatResponse>('/chat', { question });
  return response.data.answer;
}

/**
 * 发送流式聊天请求（SSE）
 */
export async function sendChatMessageStream(
  question: string,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
): Promise<void> {
  try {
    console.log('🚀 开始流式请求:', question);
    console.log('📡 API_BASE_URL:', API_BASE_URL);
    
    const response = await fetch(`${API_BASE_URL}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
    });

    console.log('✅ 响应状态:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('无法获取响应流');
    }

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        console.log('✅ 流式响应完成');
        onComplete();
        break;
      }

      // 解码数据块
      const chunk = decoder.decode(value, { stream: true });
      console.log('📦 收到数据块:', chunk);
      
      // 处理 SSE 格式的数据
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data: StreamChunk = JSON.parse(line.slice(6));
            console.log('📝 解析的数据:', data);
            
            if (data.error) {
              onError(new Error(data.error));
              return;
            }
            
            if (data.content) {
              console.log('💬 内容片段:', data.content);
              onChunk(data.content);
            }
            
            if (data.done) {
              console.log('✅ 收到完成标记');
              onComplete();
              return;
            }
          } catch (e) {
            console.error('❌ 解析 SSE 数据失败:', e, 'line:', line);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ 流式请求失败:', error);
    onError(error as Error);
  }
}

/**
 * 健康检查
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await api.get('/health');
    return response.data.status === 'ok';
  } catch {
    return false;
  }
}

export default api;


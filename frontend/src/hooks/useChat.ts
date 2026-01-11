import { useState } from 'react';
import { sendChatMessageStream } from '../services/api';
import { ChatMessage } from '../types/chat';

export const useChat = (
  onMessageAdd: (message: ChatMessage) => void,
  onMessageUpdate: (content: string, isStreaming: boolean) => void
) => {
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (question: string) => {
    console.log('🎤 发送消息:', question);
    setIsLoading(true);

    // 添加用户消息
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: Date.now(),
    };
    console.log('➕ 添加用户消息:', userMessage);
    onMessageAdd(userMessage);

    // 创建助手消息（初始为空）
    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };
    console.log('➕ 添加助手消息（空）:', assistantMessage);
    onMessageAdd(assistantMessage);

    let fullContent = '';

    try {
      await sendChatMessageStream(
        question,
        // 接收到数据块
        (chunk: string) => {
          fullContent += chunk;
          console.log('🔄 更新内容，累计长度:', fullContent.length);
          onMessageUpdate(fullContent, true);
        },
        // 完成
        () => {
          console.log('✅ 消息完成，最终内容长度:', fullContent.length);
          onMessageUpdate(fullContent, false);
          setIsLoading(false);
        },
        // 错误
        (error: Error) => {
          console.error('❌ 发送消息失败:', error);
          const errorContent = fullContent || '抱歉，生成回答时出现错误，请稍后重试。';
          onMessageUpdate(errorContent, false);
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error('❌ 发送消息异常:', error);
      onMessageUpdate('抱歉，发送消息失败，请检查网络连接。', false);
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    sendMessage,
  };
};


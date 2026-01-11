import { useState, useEffect } from 'react';
import { ChatSession, ChatMessage } from '../types/chat';

const STORAGE_KEY = 'yuque-rag-sessions';

export const useHistory = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // 从 localStorage 加载历史记录
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSessions(parsed);
        
        // 如果有会话，默认选中最新的
        if (parsed.length > 0) {
          const latest = parsed.sort((a: ChatSession, b: ChatSession) => 
            b.updatedAt - a.updatedAt
          )[0];
          setCurrentSessionId(latest.id);
        }
      }
    } catch (error) {
      console.error('加载历史记录失败:', error);
    }
  }, []);

  // 保存到 localStorage
  const saveToStorage = (newSessions: ChatSession[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
    } catch (error) {
      console.error('保存历史记录失败:', error);
    }
  };

  // 创建新会话
  const createSession = (): string => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: '新对话',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    const newSessions = [newSession, ...sessions];
    setSessions(newSessions);
    setCurrentSessionId(newSession.id);
    saveToStorage(newSessions);
    
    return newSession.id;
  };

  // 删除会话
  const deleteSession = (sessionId: string) => {
    const newSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(newSessions);
    
    // 如果删除的是当前会话，切换到最新的会话
    if (currentSessionId === sessionId) {
      if (newSessions.length > 0) {
        setCurrentSessionId(newSessions[0].id);
      } else {
        setCurrentSessionId(null);
      }
    }
    
    saveToStorage(newSessions);
  };

  // 添加消息到当前会话
  const addMessage = (message: ChatMessage) => {
    console.log('📝 addMessage 调用:', { currentSessionId, message });
    
    if (!currentSessionId) {
      // 如果没有当前会话，创建一个新会话并直接添加消息
      const newSession: ChatSession = {
        id: `session-${Date.now()}`,
        title: message.role === 'user' 
          ? message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '')
          : '新对话',
        messages: [message],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      console.log('🆕 创建新会话:', newSession);
      const newSessions = [newSession, ...sessions];
      setSessions(newSessions);
      setCurrentSessionId(newSession.id);
      saveToStorage(newSessions);
    } else {
      console.log('📌 添加到现有会话:', currentSessionId);
      updateSessionMessages(currentSessionId, message);
    }
  };

  // 更新会话消息
  const updateSessionMessages = (sessionId: string, message: ChatMessage) => {
    setSessions(prevSessions => {
      const newSessions = prevSessions.map(session => {
        if (session.id === sessionId) {
          const updatedMessages = [...session.messages, message];
          
          // 如果是第一条消息，用它作为会话标题
          let title = session.title;
          if (updatedMessages.length === 1 && message.role === 'user') {
            title = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '');
          }
          
          return {
            ...session,
            messages: updatedMessages,
            title,
            updatedAt: Date.now(),
          };
        }
        return session;
      });
      
      saveToStorage(newSessions);
      return newSessions;
    });
  };

  // 更新最后一条消息（用于流式更新）
  const updateLastMessage = (content: string, isStreaming = false) => {
    console.log('🔄 updateLastMessage:', { currentSessionId, contentLength: content.length, isStreaming });
    
    if (!currentSessionId) {
      console.warn('⚠️ 没有当前会话，无法更新消息');
      return;
    }
    
    setSessions(prevSessions => {
      const newSessions = prevSessions.map(session => {
        if (session.id === currentSessionId && session.messages.length > 0) {
          const messages = [...session.messages];
          const lastIndex = messages.length - 1;
          messages[lastIndex] = {
            ...messages[lastIndex],
            content,
            isStreaming,
          };
          
          console.log('✏️ 更新消息:', messages[lastIndex]);
          
          return {
            ...session,
            messages,
            updatedAt: Date.now(),
          };
        }
        return session;
      });
      
      // 流式更新时不需要每次都保存，会在完成时保存
      if (!isStreaming) {
        saveToStorage(newSessions);
      }
      
      return newSessions;
    });
  };

  // 获取当前会话
  const getCurrentSession = (): ChatSession | null => {
    return sessions.find(s => s.id === currentSessionId) || null;
  };

  return {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    createSession,
    deleteSession,
    addMessage,
    updateLastMessage,
    getCurrentSession,
  };
};


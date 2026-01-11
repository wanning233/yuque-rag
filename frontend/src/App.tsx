import { useState, useEffect, useRef } from 'react';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import ChatHistory from './components/ChatHistory';
import { useHistory } from './hooks/useHistory';
import { useChat } from './hooks/useChat';
import { Sun, Moon, Menu, X, BookOpen } from 'lucide-react';
import { Theme } from './types/chat';

function App() {
  const [theme, setTheme] = useState<Theme>('light');
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 历史记录管理
  const {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    createSession,
    deleteSession,
    addMessage,
    updateLastMessage,
    getCurrentSession,
  } = useHistory();

  // 聊天功能
  const { isLoading, sendMessage } = useChat(addMessage, updateLastMessage);

  // 主题切换
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [getCurrentSession()?.messages]);

  // 处理发送消息
  const handleSendMessage = (message: string) => {
    // addMessage 会自动处理创建会话的逻辑
    sendMessage(message);
  };

  // 处理新建会话
  const handleNewSession = () => {
    createSession();
  };

  const currentSession = getCurrentSession();
  
  // 添加调试日志
  console.log('🎨 App 渲染:', {
    sessionsCount: sessions.length,
    currentSessionId,
    currentSession: currentSession ? {
      id: currentSession.id,
      messagesCount: currentSession.messages.length,
      title: currentSession.title
    } : null
  });

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* 侧边栏 */}
      {showSidebar && (
        <ChatHistory
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={setCurrentSessionId}
          onNewSession={handleNewSession}
          onDeleteSession={deleteSession}
        />
      )}

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 头部 */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {showSidebar ? (
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                语雀 RAG 问答系统
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Sun className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>
        </header>

        {/* 消息区域 */}
        <div className="flex-1 overflow-y-auto">
          {!currentSession || currentSession.messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md px-4">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-primary-600 dark:text-primary-400" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  欢迎使用语雀 RAG 问答系统
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  基于语雀知识库的智能问答助手，支持检索增强生成（RAG）技术
                </p>
                <div className="text-left bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    功能特性：
                  </h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>✅ 智能检索知识库内容</li>
                    <li>✅ 实时流式回答展示</li>
                    <li>✅ Markdown 和代码高亮</li>
                    <li>✅ 对话历史记录</li>
                    <li>✅ 深色/浅色主题切换</li>
                  </ul>
                </div>
                <div className="mt-4 text-xs text-gray-500">
                  调试信息：sessions={sessions.length}, currentSessionId={currentSessionId}, 
                  messages={currentSession?.messages.length || 0}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="p-4 text-sm text-gray-500">
                显示 {currentSession.messages.length} 条消息
              </div>
              {currentSession.messages.map((message) => (
                <ChatMessage key={message.id} message={message} theme={theme} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* 输入区域 */}
        <ChatInput
          onSend={handleSendMessage}
          disabled={false}
          loading={isLoading}
        />
      </div>
    </div>
  );
}

export default App;


import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { ChatMessage as ChatMessageType } from '../types/chat';
import { User, Bot } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
  theme: 'light' | 'dark';
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, theme }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-4 p-4 ${isUser ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-850'}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-primary-600' : 'bg-green-600'
      }`}>
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>
      
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="font-medium mb-1 text-sm text-gray-700 dark:text-gray-300">
          {isUser ? '你' : 'AI 助手'}
        </div>
        
        {isUser ? (
          <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
            {message.content}
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={theme === 'dark' ? oneDark : oneLight}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
            {message.isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-gray-600 dark:bg-gray-400 animate-pulse" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;



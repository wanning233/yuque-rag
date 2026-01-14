import React, { useEffect, useState } from 'react';
import { ChatSession } from '../types/chat';
import { MessageSquare, Plus, Trash2, Clock } from 'lucide-react';

interface ChatHistoryProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
}) => {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  // 按时间排序（最新的在前）
  const sortedSessions = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onNewSession}
          className="w-full btn-primary flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>新对话</span>
        </button>
      </div>

      {/* 历史记录列表 */}
      <div className="flex-1 overflow-y-auto">
        {sortedSessions.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">暂无历史对话</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {sortedSessions.map((session) => (
              <div
                key={session.id}
                className={`group relative rounded-lg p-3 cursor-pointer transition-colors ${
                  session.id === currentSessionId
                    ? 'bg-primary-100 dark:bg-primary-900'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => onSelectSession(session.id)}
              >
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-500 dark:text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {session.title}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="w-3 h-3" />
                      {formatTime(session.updatedAt)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHistory;



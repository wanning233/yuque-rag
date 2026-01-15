import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  Text,
  Keyboard,
  Animated,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {MessageBubble} from '../components/MessageBubble';
import {ChatInput} from '../components/ChatInput';
import {Message} from '../types';
import {ChatService} from '../services/chatService';
import {Colors, Spacing} from '../config';
import {Storage} from '../utils/storage';
import {useHeaderContext} from '../contexts/HeaderContext';

export const ChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const isDark = useColorScheme() === 'dark';
  const currentStreamingMessageId = useRef<string | null>(null);
  const insets = useSafeAreaInsets();
  
  // 滚动相关状态
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const scrollDirection = useRef<'up' | 'down' | null>(null);
  const {headerOpacity} = useHeaderContext();
  const inputTranslateY = useRef(new Animated.Value(0)).current;

  // 加载历史消息
  useEffect(() => {
    loadHistory();
  }, []);

  // 监听键盘事件（Android）
  useEffect(() => {
    if (Platform.OS === 'android') {
      const keyboardWillShowListener = Keyboard.addListener(
        'keyboardDidShow',
        (e) => {
          setKeyboardHeight(e.endCoordinates.height);
          // 键盘弹起时滚动到底部
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({animated: true});
          }, 100);
        }
      );
      const keyboardWillHideListener = Keyboard.addListener(
        'keyboardDidHide',
        () => {
          setKeyboardHeight(0);
        }
      );

      return () => {
        keyboardWillShowListener.remove();
        keyboardWillHideListener.remove();
      };
    }
  }, []);

  // 清理滚动定时器
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({animated: true});
      }, 100);
    }
  }, [messages.length]);

  /**
   * 加载聊天历史
   */
  const loadHistory = async () => {
    try {
      const sessions = await Storage.getChatHistory();
      if (sessions.length > 0) {
        // 加载最新的会话
        const latestSession = sessions[sessions.length - 1];
        setMessages(latestSession.messages);
      }
    } catch (error) {
      console.error('加载历史失败:', error);
    }
  };

  /**
   * 保存聊天历史
   */
  const saveHistory = async (updatedMessages: Message[]) => {
    try {
      const sessions = await Storage.getChatHistory();
      const now = Date.now();
      
      if (sessions.length === 0) {
        // 创建新会话
        sessions.push({
          id: `session_${now}`,
          title: updatedMessages[0]?.content.substring(0, 30) || '新对话',
          messages: updatedMessages,
          createdAt: now,
          updatedAt: now,
        });
      } else {
        // 更新最新会话
        const latestSession = sessions[sessions.length - 1];
        latestSession.messages = updatedMessages;
        latestSession.updatedAt = now;
      }
      
      await Storage.saveChatHistory(sessions);
    } catch (error) {
      console.error('保存历史失败:', error);
    }
  };

  /**
   * 发送消息
   */
  const handleSend = async (content: string) => {
    if (isLoading) return;

    // 添加用户消息
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    // 创建 AI 消息占位符
    const aiMessageId = `ai_${Date.now()}`;
    currentStreamingMessageId.current = aiMessageId;
    
    const aiMessage: Message = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, aiMessage]);

    // 流式接收回复
    try {
      await ChatService.chatStream(
        content,
        // onChunk - 接收到内容片段
        (chunk: string) => {
          setMessages(prev => {
            const updated = [...prev];
            const lastMessage = updated[updated.length - 1];
            if (lastMessage && lastMessage.id === aiMessageId) {
              lastMessage.content += chunk;
            }
            return updated;
          });
        },
        // onComplete - 完成
        () => {
          setMessages(prev => {
            const updated = [...prev];
            const lastMessage = updated[updated.length - 1];
            if (lastMessage && lastMessage.id === aiMessageId) {
              lastMessage.isStreaming = false;
              // 保存历史
              saveHistory(updated);
            }
            return updated;
          });
          setIsLoading(false);
          currentStreamingMessageId.current = null;
        },
        // onError - 错误
        (error: string) => {
          setMessages(prev => {
            const updated = prev.filter(m => m.id !== aiMessageId);
            // 添加错误消息
            updated.push({
              id: `error_${Date.now()}`,
              role: 'assistant',
              content: `抱歉，发生错误：${error}`,
              timestamp: Date.now(),
            });
            return updated;
          });
          setIsLoading(false);
          currentStreamingMessageId.current = null;
        },
      );
    } catch (error: any) {
      console.error('发送消息失败:', error);
      setIsLoading(false);
      currentStreamingMessageId.current = null;
    }
  };

  const containerStyle = [
    styles.container,
    {backgroundColor: isDark ? Colors.backgroundDark : Colors.background},
    Platform.OS === 'android' && keyboardHeight > 0 && {
      paddingBottom: keyboardHeight + insets.bottom,
    },
  ];

  // 处理滚动事件
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const handleScroll = Animated.event(
    [{nativeEvent: {contentOffset: {y: scrollY}}}],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const deltaY = currentScrollY - lastScrollY.current;
        const scrollThreshold = 10; // 滚动阈值，避免小幅度滚动触发

        // 清除之前的定时器
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        // 如果滚动停止，显示两者
        scrollTimeoutRef.current = setTimeout(() => {
          scrollDirection.current = null;
          Animated.parallel([
            Animated.timing(headerOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(inputTranslateY, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }, 150);

        if (Math.abs(deltaY) > scrollThreshold) {
          if (deltaY > 0 && currentScrollY > 30) {
            // 向下滚动 - 隐藏顶部header
            if (scrollDirection.current !== 'down') {
              scrollDirection.current = 'down';
              Animated.timing(headerOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }).start();
            }
          } else if (deltaY < 0) {
            // 向上滚动 - 隐藏底部输入框
            if (scrollDirection.current !== 'up') {
              scrollDirection.current = 'up';
              Animated.timing(inputTranslateY, {
                toValue: 150,
                duration: 200,
                useNativeDriver: true,
              }).start();
            }
          }
        }

        // 接近顶部时显示两者
        if (currentScrollY < 20) {
          Animated.parallel([
            Animated.timing(headerOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(inputTranslateY, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
          scrollDirection.current = null;
        }

        lastScrollY.current = currentScrollY;
      },
    },
  );

  // 计算 header 高度（包含安全区域）
  const headerHeight = insets.top + 60; // 安全区域 + header 内容高度

  const content = (
    <>
      {messages.length === 0 ? (
        <View style={[styles.emptyContainer, {paddingTop: headerHeight}]}>
          <Text style={[styles.emptyText, {color: isDark ? Colors.textSecondaryDark : Colors.textSecondary}]}>
            👋 Hello! I am QuickQue assistant
          </Text>
          <Text style={[styles.emptySubtext, {color: isDark ? Colors.textSecondaryDark : Colors.textSecondary}]}>
            What can I help you with?
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({item}) => <MessageBubble message={item} />}
          contentContainerStyle={[
            styles.messageList,
            {
              paddingTop: headerHeight,
              paddingBottom: insets.bottom + 100,
            },
          ]}
          style={{backgroundColor: isDark ? Colors.backgroundDark : Colors.background}}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({animated: true});
          }}
        />
      )}
      <Animated.View
        style={{
          transform: [{translateY: inputTranslateY}],
        }}>
        <ChatInput
          onSend={handleSend}
          disabled={isLoading}
          placeholder={isLoading ? 'AI is thinking...' : 'Ask QuickQue anything...'}
        />
      </Animated.View>
    </>
  );

  if (Platform.OS === 'ios') {
    return (
      <KeyboardAvoidingView
        behavior="padding"
        style={containerStyle}
        keyboardVerticalOffset={insets.top}>
        {content}
      </KeyboardAvoidingView>
    );
  }

  return <View style={containerStyle}>{content}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageList: {
    paddingVertical: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});

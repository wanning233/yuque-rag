import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Colors, Spacing, FontSizes } from '../config';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Ask QuickQue anything...',
}) => {
  const [message, setMessage] = useState('');
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();

  const handleSend = () => {
    const trimmed = message.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setMessage('');
    }
  };

  const canSend = message.trim().length > 0 && !disabled;

  const textColor = isDark ? Colors.textDark : Colors.text;
  const borderColor = isDark ? Colors.borderDark : Colors.border;
  const placeholderColor = isDark
    ? Colors.textSecondaryDark
    : Colors.textSecondary;

  return (
    <View
      style={[
        styles.container,
        // { paddingBottom: Math.max(insets.bottom, Spacing.md) },
        { paddingBottom: insets.bottom },
      ]}
    >
      {/* 左侧加号按钮 */}
      <TouchableOpacity style={[styles.addButton, 
        { backgroundColor: isDark ? Colors.inputBackgroundDark : Colors.inputBackground, borderColor },
        { borderWidth: isDark ? 0.5 : 0 },
      ]}>
        <Icon
          name="add"
          size={30}
          // color={isDark ? Colors.textDark : Colors.text}
          color={Colors.primary}
        />
      </TouchableOpacity>

      {/* 输入框容器 */}
      <View
        style={[
          styles.inputContainer,
          { backgroundColor: isDark ? Colors.inputBackgroundDark : Colors.inputBackground, borderColor },
          { borderWidth: isDark ? 0.5 : 0 },
        ]}
      >
        <TextInput
          style={[styles.input, { color: textColor }]}
          placeholder={placeholder}
          placeholderTextColor={placeholderColor}
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={500}
          editable={!disabled}
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        {/* 右侧按钮组 */}
        <View style={styles.iconButtonContainer}>
          <TouchableOpacity style={styles.iconButton}>
            <Icon
              name="mic"
              size={24}
              // color={isDark ? Colors.textDark : Colors.text}
              color={Colors.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, styles.audioButton]}
            onPress={canSend ? handleSend : undefined}
          >
            <Icon
              name={canSend ? 'send' : 'graphic-eq'}
              size={canSend ? 18 : 24}
              color={
                isDark
                  ? Colors.text
                  : Colors.textDark
              }
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    gap: Spacing.base,
    // iOS 阴影
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    // Android 阴影
    elevation: 8,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
    // iOS 阴影
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1, // 阴影透明度
    shadowRadius: 0, // 阴影半径
    // Android 阴影
    elevation: 12, // 阴影层级
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    paddingHorizontal: Spacing.xs + 2,
    paddingLeft: Spacing.base,
    paddingVertical: Spacing.xs,
    minHeight: 44,
    maxHeight: 100,
    borderWidth: 0,
    // iOS 阴影
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1, // 阴影透明度
    shadowRadius: 0, // 阴影半径
    // Android 阴影
    elevation: 12, // 阴影层级
  },
  input: {
    flex: 1,
    fontSize: FontSizes.medium,
    maxHeight: 80,
    minHeight: 36,
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
    paddingBottom: Platform.OS === 'ios' ? 8 : 4,
  },
  iconButton: {
    width: 32,
    height: 32,
    justifyContent: 'center', 
    alignItems: 'center',
  },
  audioButton: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    // padding: Spacing.xs,
  },
  iconButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 4 : 2,
  },
});

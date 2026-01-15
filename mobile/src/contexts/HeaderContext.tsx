import React, {createContext, useContext, useRef} from 'react';
import {Animated} from 'react-native';

interface HeaderContextType {
  headerOpacity: Animated.Value;
}

const HeaderContext = createContext<HeaderContextType | null>(null);

export const HeaderProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const headerOpacity = useRef(new Animated.Value(1)).current;

  return (
    <HeaderContext.Provider value={{headerOpacity}}>
      {children}
    </HeaderContext.Provider>
  );
};

export const useHeaderContext = () => {
  const context = useContext(HeaderContext);
  if (!context) {
    // 返回默认值
    return {
      headerOpacity: new Animated.Value(1),
    };
  }
  return context;
};


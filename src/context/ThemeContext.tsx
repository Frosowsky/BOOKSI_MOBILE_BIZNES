import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextData {
  mode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem('@theme_mode').then((savedMode) => {
      if (savedMode) {
        setModeState(savedMode as ThemeMode);
      }
    });
  }, []);

  const setThemeMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    await AsyncStorage.setItem('@theme_mode', newMode);
  };

  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';

  return (
    <ThemeContext.Provider value={{ mode, isDark, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => useContext(ThemeContext);

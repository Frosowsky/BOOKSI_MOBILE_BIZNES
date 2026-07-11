import { useThemeContext } from '../context/ThemeContext';

const lightColors = {
  background: '#f8fafc',
  surface: '#ffffff',
  text: '#0f172a',
  textMuted: '#64748b',
  primary: '#3b82f6',
  border: '#e2e8f0',
  error: '#ef4444',
  success: '#22c55e',
  tabBar: '#ffffff',
  tabBarActive: '#0f172a',
  tabBarInactive: '#94a3b8',
  cardShadow: '#000000',
  buttonText: '#ffffff',
};

const darkColors = {
  background: '#0f172a',
  surface: '#1e293b',
  text: '#f8fafc',
  textMuted: '#94a3b8',
  primary: '#3b82f6',
  border: '#334155',
  error: '#f87171',
  success: '#4ade80',
  tabBar: '#1e293b',
  tabBarActive: '#3b82f6',
  tabBarInactive: '#64748b',
  cardShadow: '#000000',
  buttonText: '#ffffff',
};

export const useThemeColors = () => {
  const { isDark, mode, setThemeMode } = useThemeContext();

  return {
    isDark,
    mode,
    setThemeMode,
    colors: isDark ? darkColors : lightColors,
  };
};

/**
 * Buggee — App Theme Context
 * 
 * Provides dark/light theme to the entire app.
 * - Persists user preference via AsyncStorage (@buggee_theme_v1)
 * - Falls back to device system color scheme on first launch
 * - Exposes `useAppTheme()` hook for consuming components
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Appearance } from 'react-native';

import { AppTheme, darkTheme, lightTheme } from '@/constants/theme';

const STORAGE_KEY = '@buggee_theme_v1';

// ─── Context shape ────────────────────────────────────────────────────────────
interface ThemeContextType {
  isDark: boolean;
  colors: AppTheme;
  toggleTheme: () => void;
  setDark: (dark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: true,
  colors: darkTheme,
  toggleTheme: () => {},
  setDark: () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true); // default dark until loaded

  // Load persisted preference on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved !== null) {
          setIsDark(saved === 'dark');
        } else {
          // First launch: use device preference
          const systemScheme = Appearance.getColorScheme();
          setIsDark(systemScheme !== 'light');
        }
      } catch {
        // Fallback to dark
      }
    })();
  }, []);

  const setDark = useCallback(async (dark: boolean) => {
    setIsDark(dark);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
    } catch {}
  }, []);

  const toggleTheme = useCallback(() => {
    setDark(!isDark);
  }, [isDark, setDark]);

  const value: ThemeContextType = {
    isDark,
    colors: isDark ? darkTheme : lightTheme,
    toggleTheme,
    setDark,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAppTheme() {
  return useContext(ThemeContext);
}

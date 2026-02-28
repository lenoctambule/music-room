import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeColors {
  primary: string;
  primaryLight: string;
}

type ThemeName = 'indigo' | 'emerald' | 'rose' | 'amber';

interface ThemeContextValue {
  colors: ThemeColors;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
}

const THEMES: Record<ThemeName, ThemeColors> = {
  indigo: { primary: '#4f46e5', primaryLight: '#eef2ff' },
  emerald: { primary: '#059669', primaryLight: '#ecfdf5' },
  rose: { primary: '#e11d48', primaryLight: '#fff1f2' },
  amber: { primary: '#d97706', primaryLight: '#fffbeb' },
};

export const THEME_OPTIONS: { name: ThemeName; color: string }[] = [
  { name: 'indigo', color: '#4f46e5' },
  { name: 'emerald', color: '#059669' },
  { name: 'rose', color: '#e11d48' },
  { name: 'amber', color: '#d97706' },
];

const STORAGE_KEY = '@theme';

const ThemeContext = createContext<ThemeContextValue>({
  colors: THEMES.indigo,
  themeName: 'indigo',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeName] = useState<ThemeName>('indigo');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(saved => {
      if (saved && saved in THEMES) {
        setThemeName(saved as ThemeName);
      }
    });
  }, []);

  const setTheme = (name: ThemeName) => {
    setThemeName(name);
    AsyncStorage.setItem(STORAGE_KEY, name);
  };

  return (
    <ThemeContext.Provider value={{ colors: THEMES[themeName], themeName, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

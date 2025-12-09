// src/context/SettingsContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppLanguage = 'en' | 'ja';
export type AppTheme = 'light' | 'dark' | 'system';

export type SettingsContextValue = {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined,
);

type Props = {
  children: ReactNode;
};

export function SettingsProvider({ children }: Props) {
  const [language, setLanguageState] = useState<AppLanguage>('en');
  const [theme, setThemeState] = useState<AppTheme>('system');

  useEffect(() => {
    (async () => {
      try {
        const storedLang = await AsyncStorage.getItem('settings_language');
        const storedTheme = await AsyncStorage.getItem('settings_theme');

        if (storedLang === 'en' || storedLang === 'ja') {
          setLanguageState(storedLang);
        }
        if (
          storedTheme === 'light' ||
          storedTheme === 'dark' ||
          storedTheme === 'system'
        ) {
          setThemeState(storedTheme);
        }
      } catch (e) {
        console.warn('Failed to load settings', e);
      }
    })();
  }, []);

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    AsyncStorage.setItem('settings_language', lang).catch(() => {});
  };

  const setTheme = (t: AppTheme) => {
    setThemeState(t);
    AsyncStorage.setItem('settings_theme', t).catch(() => {});
  };

  const value: SettingsContextValue = {
    language,
    setLanguage,
    theme,
    setTheme,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return ctx;
}

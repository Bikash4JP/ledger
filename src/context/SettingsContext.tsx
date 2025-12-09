// src/context/SettingsContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppLanguage = 'en' | 'ja';

type Settings = {
  language: AppLanguage;
};

type SettingsContextValue = {
  settings: Settings;
  setLanguage: (lang: AppLanguage) => void;
};

const STORAGE_KEY = '@ledger_settings_v1';

const defaultSettings: Settings = {
  language: 'en',
};

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined,
);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [hydrated, setHydrated] = useState(false);

  // Load from storage
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setSettings((prev) => ({ ...prev, ...parsed }));
        }
      } catch (e) {
        console.warn('Failed to load settings', e);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // Save helper
  const saveSettings = async (next: Settings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('Failed to save settings', e);
    }
  };

  const setLanguage = (language: AppLanguage) => {
    setSettings((prev) => {
      const next: Settings = { ...prev, language };
      // fire and forget
      saveSettings(next);
      return next;
    });
  };

  const value = useMemo(
    () => ({
      settings,
      setLanguage,
    }),
    [settings],
  );

  // Optional: simple guard so we don't flash wrong default
  if (!hydrated) {
    return <>{children}</>;
  }

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

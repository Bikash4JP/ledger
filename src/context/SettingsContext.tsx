// src/context/SettingsContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { setCurrentUserEmail } from '../config/userIdentity';

export type AppLanguage = 'en' | 'ja';

type Settings = {
  language: AppLanguage;
  // naya: user ka email jisse cloud data link hoga
  syncEmail: string | null;
};

type SettingsContextValue = {
  settings: Settings;
  setLanguage: (lang: AppLanguage) => void;
  setSyncEmail: (email: string | null) => void;
};

const STORAGE_KEY = '@ledger_settings_v1';

const defaultSettings: Settings = {
  language: 'en',
  syncEmail: null,
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
          const next: Settings = { ...defaultSettings, ...parsed };
          setSettings(next);
          // hydrate global email helper
          setCurrentUserEmail(next.syncEmail ?? null);
        } else {
          setCurrentUserEmail(defaultSettings.syncEmail ?? null);
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

  const setSyncEmail = (email: string | null) => {
    setSettings((prev) => {
      const next: Settings = { ...prev, syncEmail: email };
      saveSettings(next);
      // global helper me bhi set karo -> API header ke liye
      setCurrentUserEmail(email);
      return next;
    });
  };

  const value = useMemo(
    () => ({
      settings,
      setLanguage,
      setSyncEmail,
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

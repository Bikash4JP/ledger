// ledger/src/context/SettingsContext.tsx
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
import { CurrencyOption, DEFAULT_CURRENCY } from '../utils/currency';

export type AppLanguage = 'en' | 'ja';

export type AuthProfile = {
  id: string;
  username: string;
  email: string;
  fullName?: string | null;
  businessName?: string | null;
};

type Settings = {
  language: AppLanguage;
  syncEmail: string | null;
  authProfile: AuthProfile | null;
  currency: CurrencyOption;
};

type SettingsContextValue = {
  settings: Settings;
  setLanguage: (lang: AppLanguage) => void;
  setSyncEmail: (email: string | null) => void;
  setAuthProfile: (profile: AuthProfile | null) => void;
  setCurrency: (currency: CurrencyOption) => void;
};

const STORAGE_KEY = '@ledger_settings_v2';

const defaultSettings: Settings = {
  language: 'en',
  syncEmail: null,
  authProfile: null,
  currency: DEFAULT_CURRENCY,
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
          const email =
            next.authProfile?.email ??
            next.syncEmail ??
            null;
          setCurrentUserEmail(email);
        } else {
          setCurrentUserEmail(null);
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
      void saveSettings(next);
      return next;
    });
  };

  const setSyncEmail = (email: string | null) => {
    setSettings((prev) => {
      const next: Settings = { ...prev, syncEmail: email };
      void saveSettings(next);
      const effectiveEmail =
        next.authProfile?.email ?? next.syncEmail ?? null;
      setCurrentUserEmail(effectiveEmail);
      return next;
    });
  };

  const setAuthProfile = (profile: AuthProfile | null) => {
    setSettings((prev) => {
      const next: Settings = {
        ...prev,
        authProfile: profile,
        syncEmail: profile?.email ?? prev.syncEmail ?? null,
      };
      void saveSettings(next);
      const effectiveEmail =
        next.authProfile?.email ?? next.syncEmail ?? null;
      setCurrentUserEmail(effectiveEmail);
      return next;
    });
  };

  const setCurrency = (currency: CurrencyOption) => {
    setSettings((prev) => {
      const next: Settings = { ...prev, currency };
      void saveSettings(next);
      return next;
    });
  };

  const value = useMemo(
    () => ({
      settings,
      setLanguage,
      setSyncEmail,
      setAuthProfile,
      setCurrency,
    }),
    [settings],
  );

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
    console.warn(
      '[SettingsContext] useSettings called outside SettingsProvider. Using default settings.',
    );
    return {
      settings: defaultSettings,
      setLanguage: () => {},
      setSyncEmail: () => {},
      setAuthProfile: () => {},
      setCurrency: () => {},
    };
  }

  return ctx;
}

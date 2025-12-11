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
};

type SettingsContextValue = {
  settings: Settings;
  setLanguage: (lang: AppLanguage) => void;
  setSyncEmail: (email: string | null) => void;
  setAuthProfile: (profile: AuthProfile | null) => void;
};

const STORAGE_KEY = '@ledger_settings_v2';

const defaultSettings: Settings = {
  language: 'en',
  syncEmail: null,
  authProfile: null,
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
          // global email helper: API headers ke liye
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
      saveSettings(next);
      return next;
    });
  };

  const setSyncEmail = (email: string | null) => {
    setSettings((prev) => {
      const next: Settings = {
        ...prev,
        syncEmail: email,
      };
      saveSettings(next);
      // agar authProfile nahi hai to bhi header email set kar sakte
      const effectiveEmail = next.authProfile?.email ?? next.syncEmail ?? null;
      setCurrentUserEmail(effectiveEmail);
      return next;
    });
  };

  const setAuthProfile = (profile: AuthProfile | null) => {
    setSettings((prev) => {
      const next: Settings = {
        ...prev,
        authProfile: profile,
        // agar profile null hai to syncEmail ko as-is rehne do
        syncEmail: profile?.email ?? prev.syncEmail ?? null,
      };
      saveSettings(next);
      const effectiveEmail = next.authProfile?.email ?? next.syncEmail ?? null;
      setCurrentUserEmail(effectiveEmail);
      return next;
    });
  };

  const value = useMemo(
    () => ({
      settings,
      setLanguage,
      setSyncEmail,
      setAuthProfile,
    }),
    [settings],
  );

  if (!hydrated) {
    // simple splash; tum chaho to yahan loader bhi daal sakte ho
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

// src/context/UiContext.tsx
import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from 'react';

type UiLanguage = 'en' | 'ja';

type UiContextType = {
  uiLanguage: UiLanguage;
  setUiLanguage: (lang: UiLanguage) => void;
  t: (key: string) => string;
};

const UiContext = createContext<UiContextType | undefined>(undefined);

const translations: Record<UiLanguage, Record<string, string>> = {
  en: {
    tab_home: 'Home',
    tab_entries: 'Entries',
    tab_ledgers: 'Ledgers',
    tab_reports: 'Reports',
    tab_settings: 'Settings',

    settings_title: 'Settings',
    settings_subtitle: 'Change app language and basic preferences.',
    settings_language_label: 'App language',
    settings_lang_en: 'English',
    settings_lang_ja: '日本語',
    settings_preview_title: 'Preview',
    settings_preview_sample:
      'This app lets you track ledgers, entries and reports like a simple Tally-style mobile app.',
  },
  ja: {
    tab_home: 'ホーム',
    tab_entries: '仕訳',
    tab_ledgers: '元帳',
    tab_reports: 'レポート',
    tab_settings: '設定',

    settings_title: '設定',
    settings_subtitle: 'アプリの言語や基本設定を変更できます。',
    settings_language_label: 'アプリ言語',
    settings_lang_en: '英語 (English)',
    settings_lang_ja: '日本語',
    settings_preview_title: 'プレビュー',
    settings_preview_sample:
      'このアプリでは、簡単なTally風のモバイルアプリとして仕訳・元帳・帳票を管理できます。',
  },
};

export const UiProvider = ({ children }: { children: ReactNode }) => {
  const [uiLanguage, setUiLanguage] = useState<UiLanguage>('en');

  const value = useMemo(
    () => ({
      uiLanguage,
      setUiLanguage,
      t: (key: string) =>
        translations[uiLanguage][key] ??
        translations.en[key] ??
        key,
    }),
    [uiLanguage],
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
};

export const useUi = (): UiContextType => {
  const ctx = useContext(UiContext);
  if (!ctx) {
    throw new Error('useUi must be used inside UiProvider');
  }
  return ctx;
};

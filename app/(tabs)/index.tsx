// app/(tabs)/index.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useData } from '../../src/context/AppDataContext';
import { useSettings } from '../../src/context/SettingsContext';

const COLORS = {
  primary: '#ac0c79',
  dark: '#121212',
  lightBg: '#ffffff',
  accent: '#2e9ff5',
  muted: '#777777',
  cardBorder: '#e0e0e0',
};

type Language = 'en' | 'ja';

const UI_TEXT: Record<
  Language,
  {
    appName: string;
    tagline: string;
    addEntry: string;
    viewReports: string;
    ledgersLabel: string;
    ledgersHint: string;
    entriesLabel: string;
    entriesHint: string;
    totalVolumeLabel: string;
    totalVolumeHint: string;
    quickNavTitle: string;
    quickEntriesTitle: string;
    quickEntriesText: string;
    quickLedgersTitle: string;
    quickLedgersText: string;
    quickReportsTitle: string;
    quickReportsText: string;
  }
> = {
  en: {
    appName: 'Budget Ledger',
    tagline: 'Simple double-entry ledger for mobile.',
    addEntry: '＋ Add Entry',
    viewReports: 'View Reports',
    ledgersLabel: 'Ledgers',
    ledgersHint: 'Parties / banks / expenses',
    entriesLabel: 'Entries',
    entriesHint: 'All vouchers recorded',
    totalVolumeLabel: 'Total Volume',
    totalVolumeHint: 'Sum of all transaction amounts (Dr/Cr side)',
    quickNavTitle: 'Quick Navigation',
    quickEntriesTitle: 'Entries',
    quickEntriesText: 'Add / review vouchers',
    quickLedgersTitle: 'Ledgers',
    quickLedgersText: 'Party / account balances',
    quickReportsTitle: 'Reports',
    quickReportsText: 'Trial balance and accounting summaries',
  },
  ja: {
    appName: 'Budget Ledger',
    tagline: 'モバイル向けのシンプルな複式簿記アプリ。',
    addEntry: '＋ 仕訳を追加',
    viewReports: 'レポートを見る',
    ledgersLabel: '元帳',
    ledgersHint: '取引先・銀行・経費など',
    entriesLabel: '仕訳件数',
    entriesHint: '登録されたすべての伝票',
    totalVolumeLabel: '総取引金額',
    totalVolumeHint: '全仕訳の金額合計（借方／貸方）',
    quickNavTitle: 'クイックナビ',
    quickEntriesTitle: '仕訳',
    quickEntriesText: '伝票の登録・確認',
    quickLedgersTitle: '元帳',
    quickLedgersText: '取引先・勘定残高',
    quickReportsTitle: 'レポート',
    quickReportsText: '試算表や損益計算書など',
  },
};

// 🔑 Onboarding flag (pehle settings me tha, ab home me)
const ONBOARDING_KEY = '@ledger_onboarding_seen_v1';

// Tutorial slides (same idea as before + last slide = login requirement)
const ONBOARDING_SLIDES = [
  {
    key: 'welcome',
    title: 'Welcome to Ledger',
    body: 'Track your personal and business money in one simple app.',
  },
  {
    key: 'entries',
    title: 'Quick Entries',
    body: 'Add cash in / out in seconds and keep your daily flow updated.',
  },
  {
    key: 'books',
    title: 'Automatic Books',
    body: 'Ledger automatically prepares basic accounting books from your entries.',
  },
  {
    key: 'cloud',
    title: 'Cloud Ready',
    body: 'Your entries are stored per account. Login from any device to see your data.',
  },
  {
    key: 'loginRequired',
    title: 'Login Required',
    body: 'You must login or register to use all features of this app.',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { ledgers, transactions } = useData();
  const { settings } = useSettings();

  const lang: Language = settings.language === 'ja' ? 'ja' : 'en';
  const t = UI_TEXT[lang];

  const totalLedgers = ledgers.length;
  const totalEntries = transactions.length;
  const totalVolume = useMemo(
    () => transactions.reduce((sum, trn) => sum + trn.amount, 0),
    [transactions],
  );

  const isLoggedIn = !!settings.authProfile;

  // -------- Onboarding state (pehle settings me tha) --------
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingIndex, setOnboardingIndex] = useState(0);

  useEffect(() => {
    const loadOnboarding = async () => {
      try {
        const seen = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (!seen) {
          setShowOnboarding(true);
        }
      } catch (e) {
        console.warn('Failed to read onboarding flag', e);
      }
    };
    loadOnboarding();
  }, []);

  const goToLoginTab = () => {
    // Directly jump to Settings tab, Account section
    router.push({
      pathname: '/(tabs)/setting',
      params: { section: 'account' },
    } as any);
  };

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    } catch (e) {
      console.warn('Failed to save onboarding flag', e);
    }
    setShowOnboarding(false);
    // Tutorial ke baad turant login/signup pe le jao
    goToLoginTab();
  };

  const goNextSlide = () => {
    if (onboardingIndex < ONBOARDING_SLIDES.length - 1) {
      setOnboardingIndex((i) => i + 1);
    } else {
      void finishOnboarding();
    }
  };

  const goPrevSlide = () => {
    if (onboardingIndex > 0) {
      setOnboardingIndex((i) => i - 1);
    }
  };

  const currentSlide = ONBOARDING_SLIDES[onboardingIndex];

  // -------- Helper: require login before navigation --------
  const requireAuth = (action: () => void) => {
    if (!isLoggedIn) {
      Alert.alert(
        'Login required',
        'Please login or register to use this feature.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go to login',
            onPress: () => goToLoginTab(),
          },
        ],
      );
      return;
    }
    action();
  };

  const handleAddEntry = () => {
    requireAuth(() => {
      router.push('/entry/new' as any);
    });
  };

  const handleGoReports = () => {
    requireAuth(() => {
      router.push('/(tabs)/reports' as any);
    });
  };

  const handleGoEntries = () => {
    requireAuth(() => {
      router.push('/(tabs)/entries' as any);
    });
  };

  const handleGoLedgers = () => {
    requireAuth(() => {
      router.push('/(tabs)/ledgers' as any);
    });
  };

  return (
    <>
      {/* 🔰 Onboarding modal overlay - first app use only */}
      <Modal
        visible={showOnboarding}
        animationType="fade"
        transparent
        statusBarTranslucent
      >
        <View style={styles.onboardingOverlay}>
          <View style={styles.onboardingCard}>
            <View style={styles.onboardingHeaderRow}>
              <Text style={styles.onboardingTitle}>{currentSlide.title}</Text>
              <TouchableOpacity onPress={finishOnboarding}>
                <Text style={styles.onboardingSkip}>Skip</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.onboardingBody}>
              <Text style={styles.onboardingBodyText}>
                {currentSlide.body}
              </Text>
            </View>

            <View style={styles.onboardingDotsRow}>
              {ONBOARDING_SLIDES.map((s, idx) => (
                <View
                  key={s.key}
                  style={[
                    styles.onboardingDot,
                    idx === onboardingIndex && styles.onboardingDotActive,
                  ]}
                />
              ))}
            </View>

            <View style={styles.onboardingFooterRow}>
              <TouchableOpacity
                disabled={onboardingIndex === 0}
                onPress={goPrevSlide}
                style={[
                  styles.onboardingButton,
                  onboardingIndex === 0 && styles.onboardingButtonDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.onboardingButtonText,
                    onboardingIndex === 0 &&
                      styles.onboardingButtonTextDisabled,
                  ]}
                >
                  Prev
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={goNextSlide}
                style={[
                  styles.onboardingButton,
                  styles.onboardingPrimaryButton,
                ]}
              >
                <Text style={[styles.onboardingButtonText, { color: '#fff' }]}>
                  {onboardingIndex === ONBOARDING_SLIDES.length - 1
                    ? 'Go to Login'
                    : 'Next'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 🏠 Main home content */}
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.headerBox}>
          <Text style={styles.appName}>{t.appName}</Text>
          <Text style={styles.appTagline}>{t.tagline}</Text>

          <View style={styles.headerButtonsRow}>
            <TouchableOpacity
              style={[styles.headerButton, styles.headerPrimaryButton]}
              onPress={handleAddEntry}
              activeOpacity={0.7}
            >
              <Text style={styles.headerPrimaryText}>{t.addEntry}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerButton, styles.headerSecondaryButton]}
              onPress={handleGoReports}
              activeOpacity={0.7}
            >
              <Text style={styles.headerSecondaryText}>{t.viewReports}</Text>
            </TouchableOpacity>
          </View>

          {!isLoggedIn && (
            <TouchableOpacity
              style={styles.loginHintBox}
              onPress={goToLoginTab}
              activeOpacity={0.7}
            >
              <Text style={styles.loginHintText}>
                🔐 Login or register to start using all features.
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{t.ledgersLabel}</Text>
            <Text style={styles.statValue}>{totalLedgers}</Text>
            <Text style={styles.statHint}>{t.ledgersHint}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{t.entriesLabel}</Text>
            <Text style={styles.statValue}>{totalEntries}</Text>
            <Text style={styles.statHint}>{t.entriesHint}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statWideCard]}>
            <Text style={styles.statLabel}>{t.totalVolumeLabel}</Text>
            <Text style={styles.statValue}>
              ¥{totalVolume.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </Text>
            <Text style={styles.statHint}>{t.totalVolumeHint}</Text>
          </View>
        </View>

        {/* Quick links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.quickNavTitle}</Text>
          <View style={styles.quickRow}>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={handleGoEntries}
              activeOpacity={0.7}
            >
              <Text style={styles.quickTitle}>{t.quickEntriesTitle}</Text>
              <Text style={styles.quickText}>{t.quickEntriesText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={handleGoLedgers}
              activeOpacity={0.7}
            >
              <Text style={styles.quickTitle}>{t.quickLedgersTitle}</Text>
              <Text style={styles.quickText}>{t.quickLedgersText}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.quickRow}>
            <TouchableOpacity
              style={styles.quickCardWide}
              onPress={handleGoReports}
              activeOpacity={0.7}
            >
              <Text style={styles.quickTitle}>{t.quickReportsTitle}</Text>
              <Text style={styles.quickText}>{t.quickReportsText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  headerBox: {
    backgroundColor: COLORS.dark,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.lightBg,
  },
  appTagline: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 4,
  },
  headerButtonsRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  headerButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  headerPrimaryButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    marginRight: 8,
  },
  headerSecondaryButton: {
    backgroundColor: 'transparent',
    borderColor: COLORS.lightBg,
  },
  headerPrimaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.lightBg,
  },
  headerSecondaryText: {
    fontSize: 13,
    color: COLORS.lightBg,
  },
  loginHintBox: {
    marginTop: 10,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#333333',
  },
  loginHintText: {
    fontSize: 12,
    color: '#ffffff',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 12,
    backgroundColor: '#fafafa',
  },
  statWideCard: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.muted,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 4,
  },
  statHint: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 4,
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  quickCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 12,
    backgroundColor: '#fdf9ff',
  },
  quickCardWide: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 12,
    backgroundColor: '#f3f8ff',
  },
  quickTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 4,
  },
  quickText: {
    fontSize: 12,
    color: COLORS.muted,
  },

  // onboarding styles (shifted from settings)
  onboardingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  onboardingCard: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  onboardingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  onboardingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
    flex: 1,
    paddingRight: 8,
  },
  onboardingSkip: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '500',
  },
  onboardingBody: {
    marginTop: 16,
    marginBottom: 16,
  },
  onboardingBodyText: {
    fontSize: 14,
    color: COLORS.dark,
    lineHeight: 20,
  },
  onboardingDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  onboardingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ddd',
    marginHorizontal: 3,
  },
  onboardingDotActive: {
    backgroundColor: COLORS.primary,
    width: 14,
  },
  onboardingFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  onboardingButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  onboardingPrimaryButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  onboardingButtonText: {
    fontSize: 13,
    color: COLORS.dark,
  },
  onboardingButtonTextDisabled: {
    color: '#bbb',
  },
  onboardingButtonDisabled: {
    borderColor: '#eee',
  },
});

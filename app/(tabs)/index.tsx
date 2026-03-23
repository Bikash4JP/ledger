//app\(tabs)\index.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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
import { useTheme } from '../../src/utils/theme';

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
    appName: 'MobiLedger',
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
    appName: 'MobiLedger',
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

const ONBOARDING_KEY = '@ledger_onboarding_seen_v1';

const ONBOARDING_SLIDES = [
  { key: 'welcome', title: 'Welcome to Ledger', body: 'Track your personal and business Transactions in one simple app.' },
  { key: 'entries', title: 'Quick Entries', body: 'Add cash in / out in seconds and keep your daily flow updated.' },
  { key: 'books', title: 'Automatic Books', body: 'Ledger automatically prepares basic accounting books from your entries.' },
  { key: 'cloud', title: 'Cloud Ready', body: 'Your entries are stored on your account, so you can Login from any device to see your data.' },
  { key: 'loginRequired', title: 'Login Required', body: 'You must login or register to use all features of this app.' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { ledgers, transactions } = useData();
  const { settings } = useSettings();
  const C = useTheme();

  const lang: Language = settings.language === 'ja' ? 'ja' : 'en';
  const t = UI_TEXT[lang];

  const totalLedgers = ledgers.length;
  const totalEntries = transactions.length;
  const totalVolume = useMemo(
    () => transactions.reduce((sum, trn) => sum + trn.amount, 0),
    [transactions],
  );

  const isLoggedIn = !!settings.authProfile;
  const currency = settings.currency;

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingIndex, setOnboardingIndex] = useState(0);

  useEffect(() => {
    const loadOnboarding = async () => {
      try {
        const seen = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (!seen) setShowOnboarding(true);
      } catch (e) {
        console.warn('Failed to read onboarding flag', e);
      }
    };
    loadOnboarding();
  }, []);

  const goToLoginTab = () => {
    router.push({ pathname: '/(tabs)/setting', params: { section: 'account' } } as any);
  };

  const finishOnboarding = async () => {
    try { await AsyncStorage.setItem(ONBOARDING_KEY, '1'); } catch (e) { console.warn('Failed to save onboarding flag', e); }
    setShowOnboarding(false);
    goToLoginTab();
  };

  const goNextSlide = () => {
    if (onboardingIndex < ONBOARDING_SLIDES.length - 1) setOnboardingIndex((i) => i + 1);
    else void finishOnboarding();
  };
  const goPrevSlide = () => { if (onboardingIndex > 0) setOnboardingIndex((i) => i - 1); };
  const currentSlide = ONBOARDING_SLIDES[onboardingIndex];

  const requireAuth = (action: () => void) => {
    if (!isLoggedIn) {
      Alert.alert('Login required', 'Please login or register to use this feature.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Go to login', onPress: () => goToLoginTab() },
      ]);
      return;
    }
    action();
  };

  const handleAddEntry = () => requireAuth(() => router.push({ pathname: '/entry/new', params: { tab: 'cash' } } as any));
  const handleGoReports = () => requireAuth(() => router.push('/(tabs)/reports' as any));
  const handleGoEntries = () => requireAuth(() => router.push('/(tabs)/entries' as any));
  const handleGoLedgers = () => requireAuth(() => router.push('/(tabs)/ledgers' as any));

  return (
    <>
      <Modal visible={showOnboarding} animationType="fade" transparent statusBarTranslucent>
        <View style={styles.onboardingOverlay}>
          <View style={[styles.onboardingCard, { backgroundColor: C.card }]}>
            <View style={styles.onboardingHeaderRow}>
              <Text style={[styles.onboardingTitle, { color: C.text }]}>{currentSlide.title}</Text>
              <TouchableOpacity onPress={finishOnboarding}>
                <Text style={[styles.onboardingSkip, { color: C.accent }]}>Skip</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.onboardingBody}>
              <Text style={[styles.onboardingBodyText, { color: C.text }]}>{currentSlide.body}</Text>
            </View>
            <View style={styles.onboardingDotsRow}>
              {ONBOARDING_SLIDES.map((s, idx) => (
                <View key={s.key} style={[styles.onboardingDot, idx === onboardingIndex && { backgroundColor: C.primary, width: 14 }]} />
              ))}
            </View>
            <View style={styles.onboardingFooterRow}>
              <TouchableOpacity disabled={onboardingIndex === 0} onPress={goPrevSlide}
                style={[styles.onboardingButton, { borderColor: C.cardBorder }, onboardingIndex === 0 && styles.onboardingButtonDisabled]}>
                <Text style={[styles.onboardingButtonText, { color: C.text }, onboardingIndex === 0 && { color: '#bbb' }]}>Prev</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={goNextSlide} style={[styles.onboardingButton, { backgroundColor: C.primary, borderColor: C.primary }]}>
                <Text style={[styles.onboardingButtonText, { color: '#fff' }]}>
                  {onboardingIndex === ONBOARDING_SLIDES.length - 1 ? 'Go to Login' : 'Next'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView style={[styles.container, { backgroundColor: C.bg }]} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.headerBox}>
          <Text style={styles.appName}>{t.appName}</Text>
          <Text style={styles.appTagline}>{t.tagline}</Text>
          <View style={styles.headerButtonsRow}>
            <TouchableOpacity style={[styles.headerButton, styles.headerPrimaryButton, { backgroundColor: C.primary, borderColor: C.primary }]} onPress={handleAddEntry} activeOpacity={0.7}>
              <Text style={styles.headerPrimaryText}>{t.addEntry}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.headerButton, styles.headerSecondaryButton]} onPress={handleGoReports} activeOpacity={0.7}>
              <Text style={styles.headerSecondaryText}>{t.viewReports}</Text>
            </TouchableOpacity>
          </View>
          {!isLoggedIn && (
            <TouchableOpacity style={styles.loginHintBox} onPress={goToLoginTab} activeOpacity={0.7}>
              <Text style={styles.loginHintText}>🔐 Login or register to start using all features.</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: C.statCard, borderColor: C.cardBorder }]}>
            <Text style={[styles.statLabel, { color: C.muted }]}>{t.ledgersLabel}</Text>
            <Text style={[styles.statValue, { color: C.primary }]}>{totalLedgers}</Text>
            <Text style={[styles.statHint, { color: C.muted }]}>{t.ledgersHint}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: C.statCard, borderColor: C.cardBorder }]}>
            <Text style={[styles.statLabel, { color: C.muted }]}>{t.entriesLabel}</Text>
            <Text style={[styles.statValue, { color: C.primary }]}>{totalEntries}</Text>
            <Text style={[styles.statHint, { color: C.muted }]}>{t.entriesHint}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statWideCard, { backgroundColor: C.statCard, borderColor: C.cardBorder }]}>
            <Text style={[styles.statLabel, { color: C.muted }]}>{t.totalVolumeLabel}</Text>
            <Text style={[styles.statValue, { color: C.primary }]}>
              {currency.symbol}{totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Text>
            <Text style={[styles.statHint, { color: C.muted }]}>{t.totalVolumeHint}</Text>
          </View>
        </View>

        {/* Quick links */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>{t.quickNavTitle}</Text>
          <View style={styles.quickRow}>
            <TouchableOpacity style={[styles.quickCard, { backgroundColor: C.card, borderColor: C.cardBorder }]} onPress={handleGoEntries} activeOpacity={0.7}>
              <Text style={[styles.quickTitle, { color: C.text }]}>{t.quickEntriesTitle}</Text>
              <Text style={[styles.quickText, { color: C.muted }]}>{t.quickEntriesText}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickCard, { backgroundColor: C.card, borderColor: C.cardBorder }]} onPress={handleGoLedgers} activeOpacity={0.7}>
              <Text style={[styles.quickTitle, { color: C.text }]}>{t.quickLedgersTitle}</Text>
              <Text style={[styles.quickText, { color: C.muted }]}>{t.quickLedgersText}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.quickRow}>
            <TouchableOpacity style={[styles.quickCardWide, { backgroundColor: C.card, borderColor: C.cardBorder }]} onPress={handleGoReports} activeOpacity={0.7}>
              <Text style={[styles.quickTitle, { color: C.text }]}>{t.quickReportsTitle}</Text>
              <Text style={[styles.quickText, { color: C.muted }]}>{t.quickReportsText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 24 },
  headerBox: { backgroundColor: '#121212', borderRadius: 16, padding: 16, marginBottom: 16 },
  appName: { fontSize: 22, fontWeight: '700', color: '#ffffff' },
  appTagline: { fontSize: 13, color: '#777777', marginTop: 4 },
  headerButtonsRow: { flexDirection: 'row', marginTop: 12 },
  headerButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  headerPrimaryButton: { marginRight: 8 },
  headerSecondaryButton: { backgroundColor: 'transparent', borderColor: '#ffffff' },
  headerPrimaryText: { fontSize: 13, fontWeight: '600', color: '#ffffff' },
  headerSecondaryText: { fontSize: 13, color: '#ffffff' },
  loginHintBox: { marginTop: 10, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, backgroundColor: '#333333' },
  loginHintText: { fontSize: 12, color: '#ffffff' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  statCard: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12 },
  statWideCard: { flex: 1 },
  statLabel: { fontSize: 12 },
  statValue: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  statHint: { fontSize: 11, marginTop: 4 },
  section: { marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  quickCard: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12 },
  quickCardWide: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12 },
  quickTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  quickText: { fontSize: 12 },
  onboardingOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  onboardingCard: { width: '100%', borderRadius: 20, padding: 16 },
  onboardingHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  onboardingTitle: { fontSize: 18, fontWeight: '600', flex: 1, paddingRight: 8 },
  onboardingSkip: { fontSize: 12, fontWeight: '500' },
  onboardingBody: { marginTop: 16, marginBottom: 16 },
  onboardingBodyText: { fontSize: 14, lineHeight: 20 },
  onboardingDotsRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 12, marginTop: 4 },
  onboardingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ddd', marginHorizontal: 3 },
  onboardingFooterRow: { flexDirection: 'row', justifyContent: 'space-between' },
  onboardingButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1 },
  onboardingButtonDisabled: { borderColor: '#eee' },
  onboardingButtonText: { fontSize: 13 },
});

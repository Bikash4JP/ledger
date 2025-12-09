// app/(tabs)/index.tsx
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
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

  const handleAddEntry = () => {
    router.push('/entry/new' as any);
  };

  const handleGoReports = () => {
    router.push('/(tabs)/reports' as any);
  };

  const handleGoEntries = () => {
    router.push('/(tabs)/entries' as any);
  };

  const handleGoLedgers = () => {
    router.push('/(tabs)/ledgers' as any);
  };

  return (
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
});

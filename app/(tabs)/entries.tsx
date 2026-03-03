//app/(tabs)/entries.tsx
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useData } from '../../src/context/AppDataContext';
import { useSettings } from '../../src/context/SettingsContext';

import type { Ledger } from '../../src/models/ledger';
import type { Transaction } from '../../src/models/transaction';

const normalizeDate = (value: string): string => {
  if (!value) return value;
  // "2025-12-11T00:00:00.000Z" → "2025-12-11"
  if (value.length >= 10) return value.slice(0, 10);
  return value;
};

const COLORS = {
  primary: '#ac0c79',
  dark: '#121212',
  lightBg: '#ffffff',
  accent: '#2e9ff5',
  muted: '#777777',
  border: '#e0e0e0',
};

type VoucherFilter = 'all' | 'Cash' | 'Journal' | 'Payment' | 'Receipt';
type Language = 'en' | 'ja';

type EnhancedTx = Transaction & {
  debitName: string;
  creditName: string;
};

// 🔤 UI text for EN / JA (sirf Entries screen ke liye)
const UI_TEXT: Record<
  Language,
  {
    header: string;
    subtitle: string;
    filtersTitle: string;
    fromLabel: string;
    toLabel: string;
    searchLabel: string;
    voucherLabel: string;
    voucherNames: Record<VoucherFilter, string>;
    emptyMessage: string;
  }
> = {
  en: {
    header: 'Entries',
    subtitle: 'All vouchers in one place. Tap any row to see full details.',
    filtersTitle: 'Filters',
    fromLabel: 'From (YYYY-MM-DD)',
    toLabel: 'To (YYYY-MM-DD)',
    searchLabel: 'Ledger / Narration',
    voucherLabel: 'Voucher Type',
    voucherNames: {
      all: 'All',
      Cash: 'Cash',
      Journal: 'Journal',
      Payment: 'Payment',
      Receipt: 'Receipt',
    },
    emptyMessage: 'No entries match the current filters.',
  },
  ja: {
    header: '仕訳一覧',
    subtitle: 'すべての伝票を一覧表示。タップすると詳細を確認できます。',
    filtersTitle: '絞り込み',
    fromLabel: '開始日 (YYYY-MM-DD)',
    toLabel: '終了日 (YYYY-MM-DD)',
    searchLabel: '元帳名 / 摘要',
    voucherLabel: '伝票区分',
    voucherNames: {
      all: 'すべて',
      Cash: '現金出納',
      Journal: '振替',
      Payment: '支払',
      Receipt: '入金',
    },
    emptyMessage: '条件に一致する仕訳がありません。',
  },
};

// 🧾 Standard ledger names → Japanese display
// NOTE: key = ledger.name in AppDataContext seed
const SYSTEM_LEDGER_JA: Record<string, string> = {
  // P&L / Trading
  'Sales A/c': '売上高',
  Sales: '売上高',
  'Sales Returns A/c': '売上返品',
  'Purchases A/c': '仕入',
  Purchases: '仕入',
  'Purchase Returns A/c': '仕入返品',
  'Opening Stock A/c': '期首商品棚卸高',
  'Closing Stock A/c': '期末商品棚卸高',
  'Wages A/c': '賃金',
  'Carriage Inward A/c': '運搬費（仕入）',
  'Fuel / Power A/c': '燃料・動力費',
  'Rent Paid A/c': '支払家賃',
  'Salaries A/c': '給与手当',
  'Interest Paid A/c': '支払利息',
  'Commission Paid A/c': '支払手数料',
  'Discount Allowed A/c': '値引・割戻（支払）',
  'Bad Debts A/c': '貸倒損失',
  'Depreciation A/c': '減価償却費',
  'Repairs A/c': '修繕費',
  'Advertising A/c': '広告宣伝費',
  'Rent Received A/c': '受取家賃',
  'Interest Received A/c': '受取利息',
  'Commission Received A/c': '受取手数料',
  'Discount Received A/c': '仕入割引',

  // Extra P&L examples
  'Insurance A/c': '保険料',
  'Electricity A/c': '電力料',
  'Telephone / Internet A/c': '通信費',
  'Travel Expenses A/c': '旅費交通費',
  'Office Expenses A/c': '事務費',
  'Printing & Stationery A/c': '印刷・文具費',
  'Legal Fees A/c': '法務費用',
  'Audit Fees A/c': '監査報酬',
  'Bank Charges A/c': '支払手数料（銀行）',

  // Balance sheet - Assets
  'Land A/c': '土地',
  'Building A/c': '建物',
  'Plant & Machinery A/c': '機械装置',
  'Furniture A/c': '備品・家具',
  'Vehicles A/c': '車両運搬具',
  'Cash in Hand': '現金',
  'Cash in Hand A/c': '現金',
  'Cash at Bank A/c': '当座預金',
  'Bank A/c': '当座預金',
  'Debtors A/c': '売掛金',
  'Accounts Receivable A/c': '売掛金',
  'Bills Receivable A/c': '受取手形',
  'Prepaid Expenses A/c': '前払費用',
  'Advance Payments A/c': '前払金',
  'Stock / Inventory A/c': '商品',
  'Investments A/c': '投資有価証券',
  'Goodwill A/c': 'のれん',
  'Patents A/c': '特許権',
  'Copyrights A/c': '著作権',

  // Balance sheet - Liabilities / Equity
  'Capital A/c': '資本金',
  'Bank Loan A/c': '借入金',
  'Creditors A/c': '買掛金',
  'Accounts Payable A/c': '買掛金',
  'Bills Payable A/c': '支払手形',
  'Outstanding Expenses A/c': '未払費用',
  'Interest Due A/c': '未払利息',
  'Drawings A/c': '引出金',
  'Reserves A/c': '準備金',
};

// Helper: get display name based on language
function getLedgerDisplayName(
  ledger: Ledger | undefined,
  lang: Language,
): string {
  if (!ledger) return '';
  if (lang === 'ja') {
    return SYSTEM_LEDGER_JA[ledger.name] ?? ledger.name;
  }
  return ledger.name;
}

export default function EntriesScreen() {
  const { transactions, ledgers } = useData();
  const { settings } = useSettings();
  const router = useRouter();

  const lang: Language = settings.language === 'ja' ? 'ja' : 'en';
  const texts = UI_TEXT[lang];

  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [voucherFilter, setVoucherFilter] = useState<VoucherFilter>('all');

  const ledgerMap = useMemo(() => {
    const map: Record<string, Ledger> = {};
    ledgers.forEach((l) => {
      map[l.id] = l;
    });
    return map;
  }, [ledgers]);

  const enhancedTx: EnhancedTx[] = useMemo(() => {
    const list: EnhancedTx[] = transactions.map((t: Transaction) => {
      const debit = ledgerMap[t.debitLedgerId];
      const credit = ledgerMap[t.creditLedgerId];

      return {
        ...t,
        // yahan date clean karke store karenge
        date: normalizeDate(t.date),
        // 🔁 Standard ledger → JP, user-created ledger → as is
        debitName: debit
          ? getLedgerDisplayName(debit, lang)
          : t.debitLedgerId,
        creditName: credit
          ? getLedgerDisplayName(credit, lang)
          : t.creditLedgerId,
      };
    });

    // Newest on top
    return list.sort((a, b) => {
      if (a.date === b.date) return b.id.localeCompare(a.id);
      return a.date < b.date ? 1 : -1;
    });
  }, [transactions, ledgerMap, lang]);

  const filteredTx: EnhancedTx[] = useMemo(() => {
    return enhancedTx.filter((t) => {
      if (voucherFilter !== 'all' && t.voucherType !== voucherFilter) {
        return false;
      }

      if (fromDate && t.date < fromDate) return false;
      if (toDate && t.date > toDate) return false;

      const q = search.trim().toLowerCase();
      if (!q) return true;

      const haystack = [
        t.debitName.toLowerCase(),
        t.creditName.toLowerCase(),
        (t.narration || '').toLowerCase(),
      ];

      return haystack.some((h) => h.includes(q));
    });
  }, [enhancedTx, voucherFilter, fromDate, toDate, search]);

  const renderVoucherChip = (value: VoucherFilter) => {
    const selected = voucherFilter === value;
    return (
      <TouchableOpacity
        key={value}
        style={[styles.voucherChip, selected && styles.voucherChipSelected]}
        onPress={() => setVoucherFilter(value)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.voucherChipText,
            selected && styles.voucherChipTextSelected,
          ]}
        >
          {texts.voucherNames[value]}
        </Text>
      </TouchableOpacity>
    );
  };

  const goToAddEntry = () => {
    // Ab default cash-book tab ko open karne ke liye param bhej rahe hain
    router.push({
      pathname: '/entry/new',
      params: { tab: 'cash' },
    } as any);
  };

  const openEntryDetail = (id: string) => {
    router.push({ pathname: '/entry/[id]', params: { id } });
  };

  return (
    <View style={styles.root}>
      {/* Header + Add button */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>{texts.header}</Text>
          <Text style={styles.subtitle}>{texts.subtitle}</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={goToAddEntry}>
          <Text style={styles.addButtonText}>+ Add Entry</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filterCard}>
        <Text style={styles.filterTitle}>{texts.filtersTitle}</Text>

        <View style={styles.filterRow}>
          <View style={styles.filterCol}>
            <Text style={styles.filterLabel}>{texts.fromLabel}</Text>
            <TextInput
              style={styles.filterInput}
              value={fromDate}
              onChangeText={setFromDate}
            />
          </View>
          <View style={styles.filterCol}>
            <Text style={styles.filterLabel}>{texts.toLabel}</Text>
            <TextInput
              style={styles.filterInput}
              value={toDate}
              onChangeText={setToDate}
            />
          </View>
        </View>

        <Text style={[styles.filterLabel, { marginTop: 8 }]}>
          {texts.searchLabel}
        </Text>
        <TextInput
          style={styles.filterInput}
          value={search}
          onChangeText={setSearch}
        />

        <Text style={[styles.filterLabel, { marginTop: 8 }]}>
          {texts.voucherLabel}
        </Text>
        <View style={styles.voucherRow}>
          {renderVoucherChip('all')}
          {renderVoucherChip('Cash')}
          {renderVoucherChip('Journal')}
          {renderVoucherChip('Payment')}
          {renderVoucherChip('Receipt')}
        </View>
      </View>

      {/* Entries list */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {filteredTx.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>{texts.emptyMessage}</Text>
          </View>
        ) : (
          filteredTx.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={styles.entryCard}
              activeOpacity={0.8}
              onPress={() => openEntryDetail(t.id)}
            >
              <View style={styles.entryRowTop}>
                <Text style={styles.entryDate}>{t.date}</Text>
                <Text style={styles.entryAmount}>
                  ¥{t.amount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>

              <View style={styles.entryRowMiddle}>
                <Text style={styles.entryVoucher}>
                  {texts.voucherNames[t.voucherType as VoucherFilter] ??
                    t.voucherType}
                </Text>
                <Text style={styles.entryPair} numberOfLines={1}>
                  {t.debitName}{' '}
                  <Text style={styles.entryArrow}>→</Text>{' '}
                  {t.creditName}
                </Text>
              </View>

              {t.narration ? (
                <Text style={styles.entryNarration} numberOfLines={2}>
                  {t.narration}
                </Text>
              ) : null}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
    padding: 16,
    paddingBottom: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.dark,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
    maxWidth: 220,
  },
  addButton: {
    backgroundColor: COLORS.dark,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    alignSelf: 'flex-start',
  },
  addButtonText: {
    color: COLORS.lightBg,
    fontWeight: '600',
    fontSize: 13,
  },

  filterCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    backgroundColor: '#fdf7fb',
    marginBottom: 10,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 6,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterCol: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 11,
    color: COLORS.muted,
    marginBottom: 3,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    color: COLORS.dark,
    backgroundColor: COLORS.lightBg,
  },
  voucherRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  voucherChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  voucherChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  voucherChipText: {
    fontSize: 11,
    color: COLORS.dark,
  },
  voucherChipTextSelected: {
    color: COLORS.lightBg,
    fontWeight: '600',
  },

  listContainer: {
    flex: 1,
    marginTop: 4,
  },
  emptyBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.muted,
  },

  entryCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    backgroundColor: '#ffffff',
    padding: 10,
    marginBottom: 8,
  },
  entryRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  entryDate: {
    fontSize: 12,
    color: COLORS.muted,
  },
  entryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  entryRowMiddle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  entryVoucher: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: '600',
  },
  entryPair: {
    fontSize: 12,
    color: COLORS.dark,
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  entryArrow: {
    color: COLORS.muted,
  },
  entryNarration: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
});

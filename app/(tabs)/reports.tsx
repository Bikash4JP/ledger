// app/(tabs)/reports.tsx
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useData } from '../../src/context/AppDataContext';
import { useSettings } from '../../src/context/SettingsContext';
import { useT } from '../../src/i18n/labels';
import { AppLanguage, getLedgerLabel } from '../../src/utils/ledgerLabels';

import type { Ledger } from '../../src/models/ledger';

const COLORS = {
  primary: '#ac0c79',
  dark: '#121212',
  lightBg: '#ffffff',
  accent: '#2e9ff5',
  muted: '#777777',
  border: '#e0e0e0',
};

type ReportMode = 'overall' | 'monthly' | 'yearly';

type TrialRow = {
  ledgerId: string;
  name: string;
  debit: number;
  credit: number;
};

type PlRow = {
  ledgerId: string;
  name: string;
  amount: number;
};

type BsRow = {
  ledgerId: string;
  name: string;
  amount: number;
};

function parseDateSafe(dateStr: string): Date | null {
  if (!dateStr) return null;
  const normalized = dateStr.replace(/\./g, '-').replace(/\//g, '-');
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function ReportsScreen() {
  const { ledgers, transactions } = useData();
  const { settings } = useSettings();
  const t = useT(); // UI Translation hook
  const lang: AppLanguage = (settings.language as AppLanguage) || 'en';
  
  const [mode, setMode] = useState<ReportMode>('overall');
  const today = useMemo(() => new Date(), []);

  const periodLabel = useMemo(() => {
    const y = today.getFullYear();
    const m = `${today.getMonth() + 1}`.padStart(2, '0');

    switch (mode) {
      case 'monthly':
        return `${t('reports.modes.monthly')} (${y}-${m})`;
      case 'yearly':
        return `${t('reports.modes.yearly')} (${y})`;
      default:
        return t('reports.period.all');
    }
  }, [mode, today, t]);

  const filteredTransactions = useMemo(() => {
    if (mode === 'overall') return transactions;
    return transactions.filter((tx) => {
      const d = parseDateSafe(tx.date);
      if (!d) return false;
      return mode === 'monthly' 
        ? (d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth())
        : d.getFullYear() === today.getFullYear();
    });
  }, [mode, transactions, today]);

  const ledgerMap = useMemo(() => {
    const map: Record<string, Ledger> = {};
    ledgers.forEach((l) => { map[l.id] = l; });
    return map;
  }, [ledgers]);

  // ========== TRIAL BALANCE ==========
  const trialRows: TrialRow[] = useMemo(() => {
    return ledgers.map((l) => {
      let dr = 0, cr = 0;
      filteredTransactions.forEach((tx) => {
        if (tx.debitLedgerId === l.id) dr += tx.amount;
        if (tx.creditLedgerId === l.id) cr += tx.amount;
      });
      return { 
        ledgerId: l.id, 
        name: getLedgerLabel(l, lang), // Account Name Translated
        debit: dr, 
        credit: cr 
      };
    }).filter(r => r.debit > 0 || r.credit > 0);
  }, [ledgers, filteredTransactions, lang]);

  const trialTotals = useMemo(() => trialRows.reduce((acc, r) => ({
    debit: acc.debit + r.debit, credit: acc.credit + r.credit
  }), { debit: 0, credit: 0 }), [trialRows]);

  // ========== P&L ==========
  const { expenseRows, incomeRows, totalExpense, totalIncome, netProfit, netLoss } = useMemo(() => {
    const ex: PlRow[] = [], inc: PlRow[] = [];
    trialRows.forEach(r => {
      const l = ledgerMap[r.ledgerId];
      if (!l) return;
      if (l.nature === 'Expense') {
        const amt = r.debit - r.credit;
        if (amt > 0) ex.push({ ledgerId: r.ledgerId, name: r.name, amount: amt });
      } else if (l.nature === 'Income') {
        const amt = r.credit - r.debit;
        if (amt > 0) inc.push({ ledgerId: r.ledgerId, name: r.name, amount: amt });
      }
    });
    const te = ex.reduce((s, r) => s + r.amount, 0), ti = inc.reduce((s, r) => s + r.amount, 0);
    const diff = ti - te;
    return { expenseRows: ex, incomeRows: inc, totalExpense: te, totalIncome: ti, netProfit: diff > 0 ? diff : 0, netLoss: diff < 0 ? -diff : 0 };
  }, [trialRows, ledgerMap]);

  // ========== BALANCE SHEET ==========
  const { assetRows, liabilityRows, totalAssets, totalLiabilities } = useMemo(() => {
    const as: BsRow[] = [], li: BsRow[] = [];
    trialRows.forEach(r => {
      const l = ledgerMap[r.ledgerId];
      if (!l) return;
      let bal = (l.nature === 'Asset' || l.nature === 'Expense') ? r.debit - r.credit : r.credit - r.debit;
      if (bal <= 0) return;
      if (l.nature === 'Asset') as.push({ ledgerId: r.ledgerId, name: r.name, amount: bal });
      else if (l.nature === 'Liability') li.push({ ledgerId: r.ledgerId, name: r.name, amount: bal });
    });
    if (netProfit > 0) li.push({ ledgerId: 'PL_P', name: t('reports.pl.netProfit'), amount: netProfit });
    else if (netLoss > 0) as.push({ ledgerId: 'PL_L', name: t('reports.pl.netLoss'), amount: netLoss });
    return { 
      assetRows: as, 
      liabilityRows: li, 
      totalAssets: as.reduce((s,r)=>s+r.amount,0), 
      totalLiabilities: li.reduce((s,r)=>s+r.amount,0) 
    };
  }, [trialRows, ledgerMap, netProfit, netLoss, t]);

  const renderModeTag = (v: ReportMode, lbl: string) => (
    <TouchableOpacity 
      key={v} 
      style={[styles.modeChip, mode === v && styles.modeChipSelected]} 
      onPress={() => setMode(v)}
      activeOpacity={0.7}
    >
      <Text style={[styles.modeChipText, mode === v && styles.modeChipTextSelected]}>{lbl}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>{t('reports.header.title')}</Text>
          <Text style={styles.subtitle}>{t('reports.header.subtitle')}</Text>
          <Text style={styles.periodLabel}>{periodLabel}</Text>
        </View>
      </View>

      <View style={styles.modesRow}>
        {renderModeTag('overall', t('reports.modes.overall'))}
        {renderModeTag('monthly', t('reports.modes.monthly'))}
        {renderModeTag('yearly', t('reports.modes.yearly'))}
      </View>

      {/* TRIAL BALANCE */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('reports.trial.title')}</Text>
        <View style={styles.tableHeader}>
          <Text style={styles.tableCellLedger}>{t('reports.trial.ledger')}</Text>
          <Text style={[styles.tableCellAmt, styles.right]}>{t('reports.trial.debit')}</Text>
          <Text style={[styles.tableCellAmt, styles.right]}>{t('reports.trial.credit')}</Text>
        </View>
        {trialRows.map(r => (
          <View key={r.ledgerId} style={styles.tableRow}>
            <Text style={styles.tableCellLedger}>{r.name}</Text>
            <Text style={[styles.tableCellAmt, styles.right]}>¥{r.debit.toLocaleString()}</Text>
            <Text style={[styles.tableCellAmt, styles.right]}>¥{r.credit.toLocaleString()}</Text>
          </View>
        ))}
        <View style={styles.tableFooterLine} />
        <View style={styles.tableRow}>
          <Text style={[styles.tableCellLedger, styles.totalLabel]}>{t('reports.trial.total')}</Text>
          <Text style={[styles.tableCellAmt, styles.right, styles.totalAmount]}>¥{trialTotals.debit.toLocaleString()}</Text>
          <Text style={[styles.tableCellAmt, styles.right, styles.totalAmount]}>¥{trialTotals.credit.toLocaleString()}</Text>
        </View>
      </View>

      {/* P&L */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('reports.pl.title')}</Text>
        <View style={styles.plColumnsRow}>
          <View style={styles.plColumn}>
            <Text style={styles.plColumnTitle}>{t('reports.pl.expenses')}</Text>
            {expenseRows.map(r => (
              <View key={r.ledgerId} style={styles.plRow}>
                <Text style={styles.plName}>{r.name}</Text>
                <Text style={styles.plAmountRight}>¥{r.amount.toLocaleString()}</Text>
              </View>
            ))}
            <View style={styles.plTotalRow}>
              <Text style={styles.plTotalLabel}>{t('reports.pl.totalExpenses')}</Text>
              <Text style={styles.plTotalAmount}>¥{totalExpense.toLocaleString()}</Text>
            </View>
          </View>
          <View style={styles.plColumn}>
            <Text style={styles.plColumnTitle}>{t('reports.pl.incomes')}</Text>
            {incomeRows.map(r => (
              <View key={r.ledgerId} style={styles.plRow}>
                <Text style={styles.plName}>{r.name}</Text>
                <Text style={styles.plAmountRight}>¥{r.amount.toLocaleString()}</Text>
              </View>
            ))}
            <View style={styles.plTotalRow}>
              <Text style={styles.plTotalLabel}>{t('reports.pl.totalIncomes')}</Text>
              <Text style={styles.plTotalAmount}>¥{totalIncome.toLocaleString()}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* BALANCE SHEET */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('reports.bs.title')}</Text>
        <View style={styles.bsColumnsRow}>
          <View style={styles.bsColumn}>
            <Text style={styles.bsColumnTitle}>{t('reports.bs.liabilities')}</Text>
            {liabilityRows.map(r => (
              <View key={r.ledgerId} style={styles.bsRow}>
                <Text style={styles.bsName}>{r.name}</Text>
                <Text style={styles.bsAmountRight}>¥{r.amount.toLocaleString()}</Text>
              </View>
            ))}
            <View style={styles.bsTotalRow}>
              <Text style={styles.bsTotalLabel}>{t('reports.bs.totalLiabilities')}</Text>
              <Text style={styles.bsTotalAmount}>¥{totalLiabilities.toLocaleString()}</Text>
            </View>
          </View>
          <View style={styles.bsColumn}>
            <Text style={styles.bsColumnTitle}>{t('reports.bs.assets')}</Text>
            {assetRows.map(r => (
              <View key={r.ledgerId} style={styles.bsRow}>
                <Text style={styles.bsName}>{r.name}</Text>
                <Text style={styles.bsAmountRight}>¥{r.amount.toLocaleString()}</Text>
              </View>
            ))}
            <View style={styles.bsTotalRow}>
              <Text style={styles.bsTotalLabel}>{t('reports.bs.totalAssets')}</Text>
              <Text style={styles.bsTotalAmount}>¥{totalAssets.toLocaleString()}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* PLANNED REPORTS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('reports.planned.title')}</Text>
        <View style={styles.reportGrid}>
          <View style={styles.reportCard}>
            <Text style={styles.reportTitle}>{t('reports.planned.plTitle')}</Text>
            <Text style={styles.reportText}>{t('reports.planned.plText')}</Text>
          </View>
          <View style={styles.reportCard}>
            <Text style={styles.reportTitle}>{t('reports.planned.bsTitle')}</Text>
            <Text style={styles.reportText}>{t('reports.planned.bsText')}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightBg },
  content: { padding: 16, paddingBottom: 40 },
  headerRow: { marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.dark },
  subtitle: { fontSize: 13, color: COLORS.muted, marginTop: 4 },
  periodLabel: { fontSize: 13, fontWeight: '600', color: COLORS.accent, marginTop: 2 },
  modesRow: { flexDirection: 'row', marginBottom: 20 },
  modeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#f0f0f0', marginRight: 8 },
  modeChipSelected: { backgroundColor: COLORS.primary },
  modeChipText: { fontSize: 13, color: COLORS.dark },
  modeChipTextSelected: { color: COLORS.lightBg, fontWeight: '600' },
  section: { marginBottom: 30, backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.dark, marginBottom: 12 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 2, borderColor: COLORS.border, paddingBottom: 6, marginBottom: 6 },
  tableRow: { flexDirection: 'row', paddingVertical: 6 },
  tableCellLedger: { flex: 2, fontSize: 13, color: COLORS.dark },
  tableCellAmt: { flex: 1, fontSize: 13, color: COLORS.dark },
  right: { textAlign: 'right' },
  totalLabel: { fontWeight: '700' },
  totalAmount: { fontWeight: '700', color: COLORS.primary },
  tableFooterLine: { height: 1, backgroundColor: COLORS.border, marginVertical: 6 },
  plColumnsRow: { flexDirection: 'row' },
  plColumn: { flex: 1, marginHorizontal: 4 },
  plColumnTitle: { fontSize: 13, fontWeight: '600', color: COLORS.muted, marginBottom: 8, borderBottomWidth: 1, borderColor: COLORS.border },
  plRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  plName: { flex: 1, fontSize: 12, color: COLORS.dark },
  plAmountRight: { textAlign: 'right', fontSize: 12, color: COLORS.dark },
  plTotalRow: { borderTopWidth: 1, borderColor: COLORS.border, marginTop: 4, paddingTop: 4 },
  plTotalLabel: { fontSize: 12, fontWeight: '600' },
  plTotalAmount: { fontSize: 12, fontWeight: '600' },
  bsColumnsRow: { flexDirection: 'row' },
  bsColumn: { flex: 1, marginHorizontal: 4 },
  bsColumnTitle: { fontSize: 13, fontWeight: '600', color: COLORS.muted, marginBottom: 8, borderBottomWidth: 1, borderColor: COLORS.border },
  bsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  bsName: { flex: 1, fontSize: 12, color: COLORS.dark },
  bsAmountRight: { textAlign: 'right', fontSize: 12, color: COLORS.dark },
  bsTotalRow: { borderTopWidth: 1, borderColor: COLORS.border, marginTop: 4, paddingTop: 4 },
  bsTotalLabel: { fontSize: 12, fontWeight: '600' },
  bsTotalAmount: { fontSize: 12, fontWeight: '600' },
  reportGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  reportCard: { width: '48%', backgroundColor: '#fafafa', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  reportTitle: { fontSize: 14, fontWeight: '600', color: COLORS.dark },
  reportText: { fontSize: 11, color: COLORS.muted, marginTop: 4 },
});
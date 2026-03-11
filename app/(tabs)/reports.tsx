// app/(tabs)/reports.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useData } from '../../src/context/AppDataContext';
import { useSettings } from '../../src/context/SettingsContext';
import { useT } from '../../src/i18n/labels';
import { AppLanguage, getLedgerLabel } from '../../src/utils/ledgerLabels';
import { fetchExchangeRate } from '../../src/utils/currency';

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

type TrialRow = { ledgerId: string; name: string; debit: number; credit: number; };
type PlRow    = { ledgerId: string; name: string; amount: number; };
type BsRow    = { ledgerId: string; name: string; amount: number; };

function getDateParts(dateStr: string) {
  if (!dateStr) return null;
  const normalized = dateStr.split('T')[0].replace(/\./g, '-').replace(/\//g, '-');
  const parts = normalized.split('-');
  if (parts.length < 3) return null;
  return {
    year: parseInt(parts[0], 10),
    month: parseInt(parts[1], 10) - 1,
    day: parseInt(parts[2], 10),
  };
}

export default function ReportsScreen() {
  const { ledgers, transactions } = useData();
  const { settings } = useSettings();
  const t = useT();
  const lang: AppLanguage = (settings.language as AppLanguage) || 'en';
  const currency = settings.currency;

  // ── Exchange rate ────────────────────────────────────────────
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [rateLoading, setRateLoading] = useState(false);
  const lastFetchedCode = useRef<string>('JPY');

  useEffect(() => {
    if (currency.code === 'JPY') {
      setExchangeRate(1);
      lastFetchedCode.current = 'JPY';
      return;
    }
    if (lastFetchedCode.current === currency.code) return;
    setRateLoading(true);
    fetchExchangeRate('JPY', currency.code).then((rate) => {
      setExchangeRate(rate);
      lastFetchedCode.current = currency.code;
      setRateLoading(false);
    });
  }, [currency.code]);

  const isConverted = currency.code !== 'JPY';
  const sym = currency.symbol;

  /** Format amount with the selected currency symbol. Adds ~ prefix when converted. */
  const fmt = (amount: number) => {
    const converted = amount * exchangeRate;
    const prefix = isConverted ? '~' : '';
    return `${prefix}${sym}${converted.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  // ── Period filter ────────────────────────────────────────────
  const [mode, setMode] = useState<ReportMode>('overall');

  const today = useMemo(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }, []);

  const periodLabel = useMemo(() => {
    const y = today.year;
    const m = `${today.month + 1}`.padStart(2, '0');
    switch (mode) {
      case 'monthly': return `${t('reports.modes.monthly')} (${y}-${m})`;
      case 'yearly':  return `${t('reports.modes.yearly')} (${y})`;
      default:        return t('reports.period.all');
    }
  }, [mode, today, t]);

  const filteredTransactions = useMemo(() => {
    if (mode === 'overall') return transactions;
    return transactions.filter((tx) => {
      const parts = getDateParts(tx.date);
      if (!parts) return false;
      if (mode === 'monthly') return parts.year === today.year && parts.month === today.month;
      if (mode === 'yearly')  return parts.year === today.year;
      return true;
    });
  }, [mode, transactions, today]);

  const ledgerMap = useMemo(() => {
    const map: Record<string, Ledger> = {};
    ledgers.forEach((l) => { map[l.id] = l; });
    return map;
  }, [ledgers]);

  // ── Trial Balance ────────────────────────────────────────────
  const trialRows: TrialRow[] = useMemo(() => {
    return ledgers.map((l) => {
      let dr = 0, cr = 0;
      filteredTransactions.forEach((tx) => {
        if (tx.debitLedgerId  === l.id) dr += tx.amount;
        if (tx.creditLedgerId === l.id) cr += tx.amount;
      });
      return { ledgerId: l.id, name: getLedgerLabel(l, lang), debit: dr, credit: cr };
    }).filter(r => r.debit > 0 || r.credit > 0);
  }, [ledgers, filteredTransactions, lang]);

  const trialTotals = useMemo(() =>
    trialRows.reduce((acc, r) => ({ debit: acc.debit + r.debit, credit: acc.credit + r.credit }),
    { debit: 0, credit: 0 }),
  [trialRows]);

  // ── P&L ─────────────────────────────────────────────────────
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
    return { expenseRows: ex, incomeRows: inc, totalExpense: te, totalIncome: ti,
      netProfit: diff > 0 ? diff : 0, netLoss: diff < 0 ? -diff : 0 };
  }, [trialRows, ledgerMap]);

  // ── Balance Sheet ────────────────────────────────────────────
  const { assetRows, liabilityRows, totalAssets, totalLiabilities } = useMemo(() => {
    const as: BsRow[] = [], li: BsRow[] = [];
    trialRows.forEach(r => {
      const l = ledgerMap[r.ledgerId];
      if (!l) return;
      let bal = (l.nature === 'Asset' || l.nature === 'Expense') ? r.debit - r.credit : r.credit - r.debit;
      if (bal <= 0) return;
      if (l.nature === 'Asset')     as.push({ ledgerId: r.ledgerId, name: r.name, amount: bal });
      else if (l.nature === 'Liability') li.push({ ledgerId: r.ledgerId, name: r.name, amount: bal });
    });
    if (netProfit > 0) li.push({ ledgerId: 'PL_P', name: t('reports.pl.netProfit'), amount: netProfit });
    else if (netLoss > 0) as.push({ ledgerId: 'PL_L', name: t('reports.pl.netLoss'), amount: netLoss });
    return {
      assetRows: as, liabilityRows: li,
      totalAssets: as.reduce((s, r) => s + r.amount, 0),
      totalLiabilities: li.reduce((s, r) => s + r.amount, 0),
    };
  }, [trialRows, ledgerMap, netProfit, netLoss, t]);

  const renderModeTag = (v: ReportMode, lbl: string) => (
    <TouchableOpacity key={v} style={[styles.modeChip, mode === v && styles.modeChipSelected]}
      onPress={() => setMode(v)} activeOpacity={0.7}>
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

      {/* Currency rate badge */}
      {isConverted && (
        <View style={styles.rateBadge}>
          {rateLoading ? (
            <><ActivityIndicator size="small" color={COLORS.primary} /><Text style={styles.rateText}> {t('settings.currency.loading')}</Text></>
          ) : (
            <Text style={styles.rateText}>
              {t('settings.currency.rate')}: 1 JPY = {exchangeRate.toFixed(6)} {sym} ({currency.code}) · {t('settings.currency.approx')}
            </Text>
          )}
        </View>
      )}

      <View style={styles.modesRow}>
        {renderModeTag('overall', t('reports.modes.overall'))}
        {renderModeTag('monthly', t('reports.modes.monthly'))}
        {renderModeTag('yearly',  t('reports.modes.yearly'))}
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
            <Text style={[styles.tableCellAmt, styles.right]}>{fmt(r.debit)}</Text>
            <Text style={[styles.tableCellAmt, styles.right]}>{fmt(r.credit)}</Text>
          </View>
        ))}
        <View style={styles.tableFooterLine} />
        <View style={styles.tableRow}>
          <Text style={[styles.tableCellLedger, styles.totalLabel]}>{t('reports.trial.total')}</Text>
          <Text style={[styles.tableCellAmt, styles.right, styles.totalAmount]}>{fmt(trialTotals.debit)}</Text>
          <Text style={[styles.tableCellAmt, styles.right, styles.totalAmount]}>{fmt(trialTotals.credit)}</Text>
        </View>
      </View>

      {/* PROFIT & LOSS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('reports.pl.title')}</Text>
        <View style={styles.plColumnsRow}>
          <View style={styles.plColumn}>
            <View style={styles.columnContent}>
              <Text style={styles.plColumnTitle}>{t('reports.pl.expenses')}</Text>
              {expenseRows.map(r => (
                <View key={r.ledgerId} style={styles.plRow}>
                  <Text style={styles.plName}>{r.name}</Text>
                  <Text style={styles.plAmountRight}>{fmt(r.amount)}</Text>
                </View>
              ))}
            </View>
            <View style={styles.plTotalRow}>
              <Text style={styles.plTotalLabel}>{t('reports.pl.totalExpenses')}</Text>
              <Text style={styles.plTotalAmount}>{fmt(totalExpense)}</Text>
            </View>
          </View>

          <View style={styles.verticalDivider} />

          <View style={styles.plColumn}>
            <View style={styles.columnContent}>
              <Text style={styles.plColumnTitle}>{t('reports.pl.incomes')}</Text>
              {incomeRows.map(r => (
                <View key={r.ledgerId} style={styles.plRow}>
                  <Text style={styles.plName}>{r.name}</Text>
                  <Text style={styles.plAmountRight}>{fmt(r.amount)}</Text>
                </View>
              ))}
            </View>
            <View style={styles.plTotalRow}>
              <Text style={styles.plTotalLabel}>{t('reports.pl.totalIncomes')}</Text>
              <Text style={styles.plTotalAmount}>{fmt(totalIncome)}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* BALANCE SHEET */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('reports.bs.title')}</Text>
        <View style={styles.bsColumnsRow}>
          <View style={styles.bsColumn}>
            <View style={styles.columnContent}>
              <Text style={styles.bsColumnTitle}>{t('reports.bs.liabilities')}</Text>
              {liabilityRows.map(r => (
                <View key={r.ledgerId} style={styles.bsRow}>
                  <Text style={styles.bsName}>{r.name}</Text>
                  <Text style={styles.bsAmountRight}>{fmt(r.amount)}</Text>
                </View>
              ))}
            </View>
            <View style={styles.bsTotalRow}>
              <Text style={styles.bsTotalLabel}>{t('reports.bs.totalLiabilities')}</Text>
              <Text style={styles.bsTotalAmount}>{fmt(totalLiabilities)}</Text>
            </View>
          </View>

          <View style={styles.verticalDivider} />

          <View style={styles.bsColumn}>
            <View style={styles.columnContent}>
              <Text style={styles.bsColumnTitle}>{t('reports.bs.assets')}</Text>
              {assetRows.map(r => (
                <View key={r.ledgerId} style={styles.bsRow}>
                  <Text style={styles.bsName}>{r.name}</Text>
                  <Text style={styles.bsAmountRight}>{fmt(r.amount)}</Text>
                </View>
              ))}
            </View>
            <View style={styles.bsTotalRow}>
              <Text style={styles.bsTotalLabel}>{t('reports.bs.totalAssets')}</Text>
              <Text style={styles.bsTotalAmount}>{fmt(totalAssets)}</Text>
            </View>
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
  rateBadge: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', backgroundColor: '#f5f0fb', borderRadius: 8, padding: 8, marginBottom: 12, gap: 6 },
  rateText: { fontSize: 11, color: COLORS.primary, fontWeight: '500', flexShrink: 1 },
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
  plColumnsRow: { flexDirection: 'row', minHeight: 100 },
  bsColumnsRow: { flexDirection: 'row', minHeight: 100 },
  plColumn: { flex: 1, justifyContent: 'space-between' },
  bsColumn: { flex: 1, justifyContent: 'space-between' },
  columnContent: { flex: 1, marginHorizontal: 4 },
  verticalDivider: { width: 1, backgroundColor: COLORS.border, marginHorizontal: 4 },
  plColumnTitle: { fontSize: 13, fontWeight: '600', color: COLORS.muted, marginBottom: 8, borderBottomWidth: 1, borderColor: COLORS.border, paddingBottom: 4 },
  plRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  plName: { flex: 1, fontSize: 12, color: COLORS.dark },
  plAmountRight: { textAlign: 'right', fontSize: 12, color: COLORS.dark },
  plTotalRow: { borderTopWidth: 1, borderColor: COLORS.border, marginTop: 10, paddingTop: 6, marginHorizontal: 4 },
  plTotalLabel: { fontSize: 12, fontWeight: '600' },
  plTotalAmount: { fontSize: 12, fontWeight: '600' },
  bsColumnTitle: { fontSize: 13, fontWeight: '600', color: COLORS.muted, marginBottom: 8, borderBottomWidth: 1, borderColor: COLORS.border, paddingBottom: 4 },
  bsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  bsName: { flex: 1, fontSize: 12, color: COLORS.dark },
  bsAmountRight: { textAlign: 'right', fontSize: 12, color: COLORS.dark },
  bsTotalRow: { borderTopWidth: 1, borderColor: COLORS.border, marginTop: 10, paddingTop: 6, marginHorizontal: 4 },
  bsTotalLabel: { fontSize: 12, fontWeight: '600' },
  bsTotalAmount: { fontSize: 12, fontWeight: '600' },
});
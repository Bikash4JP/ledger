// app/ledger/[id].tsx
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { useData } from '../../src/context/AppDataContext';
import { useSettings } from '../../src/context/SettingsContext';
import type { Ledger } from '../../src/models/ledger';
import type { Transaction } from '../../src/models/transaction';
import { AppLanguage, getGroupLabel, getLedgerLabel, getNatureLabel } from '../../src/utils/ledgerLabels';
import { fetchExchangeRate } from '../../src/utils/currency';

const COLORS = {
  primary: '#ac0c79',
  dark: '#121212',
  lightBg: '#ffffff',
  accent: '#2e9ff5',
  muted: '#777777',
  border: '#d0d0d0',
  danger: '#d32f2f',
};

const OPENING_LEDGER_LABEL = 'Opening Balance Adjustment';

type Language = 'en' | 'ja';

const UI_TEXT: Record<Language, any> = {
  en: {
    ledger: 'Ledger',
    statementTitle: 'LEDGER STATEMENT',
    closingBalance: 'Closing balance:',
    period: 'Period',
    from: 'From',
    to: 'To',
    selectDate: 'Select date',
    clear: 'Clear',
    exportPdf: 'Export PDF',
    date: 'Date',
    particulars: 'Particulars',
    dr: 'Dr',
    cr: 'Cr',
    balance: 'Balance',
    total: 'TOTAL',
    noChildLedgers: 'No child ledgers found under this parent.',
    noEntries: 'No entries for this period.',
    ledgerMaster: 'Ledger Master',
    masterHint: 'Edit name, category and sub-category for this ledger.',
    ledgerName: 'Ledger Name',
    category: 'Category (Nature)',
    subCategory: 'Sub-category / Group',
    treatAsParty: 'Treat as Party A/c',
    delete: 'Delete',
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Saving…',
    validation: 'Validation',
    enterName: 'Please enter ledger name.',
    enterGroup: 'Please enter sub-category / group name.',
    savedSuccess: 'Ledger master updated successfully.',
    error: 'Error',
    deleteLedgerTitle: 'Delete Ledger?',
    deleteLedgerHint: 'This will delete the ledger master. You can only delete if it has no entries.',
    deleted: 'Deleted',
    ledgerDeleted: 'Ledger deleted.',
    cannotDelete: 'Cannot delete',
    deleteError: 'This ledger has entries or could not be deleted.',
    back: '← Back',
    notFound: 'Ledger not found.',
    shareTitle: 'Share ledger statement PDF',
    exportEmpty: 'No entries for this period to export.',
    beginning: 'Beginning',
    today: 'Today',
  },
  ja: {
    ledger: '元帳',
    statementTitle: '元帳明細書',
    closingBalance: '期末残高:',
    period: '期間',
    from: '開始',
    to: '終了',
    selectDate: '日付を選択',
    clear: 'クリア',
    exportPdf: 'PDF出力',
    date: '日付',
    particulars: '勘定科目 / 内容',
    dr: '借方',
    cr: '貸方',
    balance: '残高',
    total: '合計',
    noChildLedgers: 'このグループ内に子元帳は見つかりませんでした。',
    noEntries: 'この期間の仕訳はありません。',
    ledgerMaster: '元帳マスター編集',
    masterHint: '元帳の名前、カテゴリー、グループを編集します。',
    ledgerName: '元帳名',
    category: 'カテゴリー',
    subCategory: 'サブカテゴリー / グループ',
    treatAsParty: '取引先勘定として扱う',
    delete: '削除',
    cancel: 'キャンセル',
    save: '保存',
    saving: '保存中…',
    validation: '確認',
    enterName: '元帳名を入力してください。',
    enterGroup: 'グループ名を入力してください。',
    savedSuccess: '元帳マスターを更新しました。',
    error: 'エラー',
    deleteLedgerTitle: '元帳を削除しますか？',
    deleteLedgerHint: '元帳マスターを削除します。仕訳が空の場合のみ削除可能です。',
    deleted: '削除完了',
    ledgerDeleted: '元帳を削除しました。',
    cannotDelete: '削除できません',
    deleteError: 'この元帳には仕訳があるか、削除できない設定になっています。',
    back: '← 戻る',
    notFound: '元帳が見つかりませんでした。',
    shareTitle: '元帳明細PDFを共有',
    exportEmpty: '出力するデータがありません。',
    beginning: '開始',
    today: '本日',
  }
};

type LedgerLine = {
  id: string;
  date: string;
  particular: string;
  remarks: string;
  debit: number;
  credit: number;
  balance: number;
  isSyntheticOpening?: boolean;
  targetLedgerId?: string; 
};

type BaseLine = Omit<LedgerLine, 'balance'> & {
  isOpeningTx?: boolean;
};

function formatNumberWithOptionalDecimals(value: number): string {
  const n = Number(value) || 0;
  const isInt = Math.abs(n - Math.round(n)) < 1e-9;
  if (isInt) {
    return Math.round(n).toLocaleString(undefined, { maximumFractionDigits: 0 });
  }
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Format an amount with a dynamic currency symbol (and ~ prefix if converted). */
function formatAmount(value: number, symbol: string, isConverted = false): string {
  if (!value) return `${symbol}0`;
  const prefix = isConverted ? '~' : '';
  return `${prefix}${symbol}${formatNumberWithOptionalDecimals(Math.abs(value))}`;
}

function parseDateString(value: string): Date {
  if (!value) return new Date();
  const [y, m, d] = value.split('-').map((v) => parseInt(v, 10));
  if (!y || !m || !d) return new Date();
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? new Date() : dt;
}

function formatDateToInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatBalance(value: number, t: any): string {
  if (value === 0) return '0';
  const side = value > 0 ? t.dr : t.cr;
  return `${formatNumberWithOptionalDecimals(Math.abs(value))} ${side}`;
}

export default function LedgerDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { ledgers, transactions, updateLedger, deleteLedger } = useData();
  const { settings } = useSettings();
  const language: Language = settings.language === 'ja' ? 'ja' : 'en';
  const t = UI_TEXT[language];
  const currency = settings.currency;

  // Exchange rate for ledger statement display
  const [exchangeRate, setExchangeRate] = React.useState<number>(1);
  const [rateLoading, setRateLoading] = React.useState(false);
  const lastFetchedCode = React.useRef<string>('JPY');

  React.useEffect(() => {
    if (currency.code === 'JPY') { setExchangeRate(1); lastFetchedCode.current = 'JPY'; return; }
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
  const fmtAmt = (v: number) => formatAmount(v * exchangeRate, sym, isConverted);

  const ledger = useMemo(
    () => ledgers.find((l: Ledger) => l.id === id),
    [ledgers, id],
  );

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<'from' | 'to'>('from');
  const [pickerDate, setPickerDate] = useState<Date>(new Date());

  const [showMaster, setShowMaster] = useState(false);
  const [editName, setEditName] = useState('');
  const [editGroupName, setEditGroupName] = useState('');
  const [editNature, setEditNature] = useState<Ledger['nature']>('Asset');
  const [editIsParty, setEditIsParty] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);

  const normalizeDate = (value: string): string => value.substring(0, 10);

  useEffect(() => {
    if (ledger) {
      setEditName(ledger.name);
      setEditGroupName(ledger.groupName);
      setEditNature(ledger.nature);
      setEditIsParty(!!ledger.isParty);
    }
  }, [ledger]);

  const isGroupView = useMemo(() => {
    if (!ledger) return false;
    if (!!ledger.isGroup) return true;
    return ledgers.some((l) => (l.categoryLedgerId ?? null) === ledger.id);
  }, [ledger, ledgers]);

  const effectiveToDate = useMemo(() => toDate || formatDateToInput(new Date()), [toDate]);

  const groupLines: LedgerLine[] = useMemo(() => {
    if (!ledger || !isGroupView) return [];
    const children = ledgers
      .filter((l) => (l.categoryLedgerId ?? null) === ledger.id)
      .sort((a, b) => a.name.localeCompare(b.name));

    return children.map((child) => {
      let periodDebit = 0;
      let periodCredit = 0;
      let closing = 0;

      for (const trans of transactions as Transaction[]) {
        const dt = normalizeDate(trans.date);
        const inPeriod = (!fromDate || dt >= fromDate) && (!toDate || dt <= toDate);
        if (inPeriod) {
          if (trans.debitLedgerId === child.id) periodDebit += trans.amount;
          if (trans.creditLedgerId === child.id) periodCredit += trans.amount;
        }
        if (dt <= effectiveToDate) {
          if (trans.debitLedgerId === child.id) closing += trans.amount;
          if (trans.creditLedgerId === child.id) closing -= trans.amount;
        }
      }

      return {
        id: `child-${child.id}`,
        date: effectiveToDate,
        particular: getLedgerLabel(child, language as AppLanguage),
        remarks: getGroupLabel(child.groupName, language as AppLanguage),
        debit: periodDebit,
        credit: periodCredit,
        balance: closing,
        targetLedgerId: child.id,
      };
    });
  }, [ledger, isGroupView, ledgers, transactions, fromDate, toDate, effectiveToDate, language]);

  const baseLines: BaseLine[] = useMemo(() => {
    if (!ledger || isGroupView) return [];
    const ledgerTx = transactions.filter(
      (trans: Transaction) => trans.debitLedgerId === ledger.id || trans.creditLedgerId === ledger.id,
    );

    return ledgerTx.map((trans: Transaction) => {
      const isDebit = trans.debitLedgerId === ledger.id;
      const otherLedgerId = isDebit ? trans.creditLedgerId : trans.debitLedgerId;
      const otherLedger = ledgers.find((l: Ledger) => l.id === otherLedgerId) ?? null;

      const otherName = otherLedger ? getLedgerLabel(otherLedger, language as AppLanguage) : otherLedgerId;
      const isOpeningTx =
        (otherLedger?.name || '').toLowerCase().includes('opening balance') ||
        (otherLedger?.name || '').toLowerCase() === OPENING_LEDGER_LABEL.toLowerCase();

      return {
        id: trans.id,
        date: normalizeDate(trans.date),
        particular: otherName,
        remarks: trans.narration || '',
        debit: isDebit ? trans.amount : 0,
        credit: !isDebit ? trans.amount : 0,
        isOpeningTx,
      };
    });
  }, [ledger, isGroupView, ledgers, transactions, language]);

  const openingBalanceValue = useMemo(() => {
    if (!fromDate) return 0;
    return baseLines
      .filter((l) => l.date && l.date < fromDate)
      .reduce((sum, l) => sum + (l.debit - l.credit), 0);
  }, [baseLines, fromDate]);

  const lines: LedgerLine[] = useMemo(() => {
    if (!ledger) return [];
    if (isGroupView) return groupLines;

    const period = baseLines.filter((line) => {
      if (fromDate && line.date < fromDate) return false;
      if (toDate && line.date > toDate) return false;
      return true;
    });

    const sortByDateThenId = (a: BaseLine, b: BaseLine) => {
      if (a.date === b.date) return a.id.localeCompare(b.id);
      return a.date < b.date ? -1 : 1;
    };

    if (!fromDate) {
      const openingTx = period.filter((p) => !!p.isOpeningTx).sort((a, b) => a.id.localeCompare(b.id));
      const rest = period.filter((p) => !p.isOpeningTx).sort(sortByDateThenId);

      const ordered: BaseLine[] = [...openingTx.map((l) => ({ ...l, date: '' })), ...rest];

      let running = 0;
      return ordered.map((line) => {
        running += line.debit - line.credit;
        return { ...line, balance: running };
      });
    }

    const ordered = [...period].sort(sortByDateThenId);

    const openingRow: LedgerLine | null =
      openingBalanceValue !== 0
        ? {
            id: 'opening-balance-bf',
            date: '',
            particular: language === 'ja' ? '前月繰越' : 'Opening balance B/F',
            remarks: '',
            debit: openingBalanceValue > 0 ? openingBalanceValue : 0,
            credit: openingBalanceValue < 0 ? Math.abs(openingBalanceValue) : 0,
            balance: openingBalanceValue,
            isSyntheticOpening: true,
          }
        : null;

    let running = openingBalanceValue;
    const withBalance: LedgerLine[] = ordered.map((line) => {
      running += line.debit - line.credit;
      return { ...line, balance: running };
    });

    return openingRow ? [openingRow, ...withBalance] : withBalance;
  }, [ledger, isGroupView, groupLines, baseLines, fromDate, toDate, openingBalanceValue, language]);

  const totals = useMemo(() => {
    return lines.reduce(
      (acc, line) => {
        if (line.isSyntheticOpening) return acc;
        acc.debit += line.debit;
        acc.credit += line.credit;
        return acc;
      },
      { debit: 0, credit: 0 },
    );
  }, [lines]);

  const closingBalanceValue = useMemo(() => {
    if (lines.length === 0) return 0;
    if (isGroupView) return lines.reduce((sum, l) => sum + (l.balance || 0), 0);
    return lines[lines.length - 1].balance || 0;
  }, [lines, isGroupView]);

  if (!ledger) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <Stack.Screen options={{ title: t.ledger }} />
        <View style={[styles.container, styles.notFoundContainer]}>
          <Text style={styles.notFoundText}>{t.notFound}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>{t.back}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const closingBalanceText =
    closingBalanceValue === 0
      ? '0'
      : `${fmtAmt(Math.abs(closingBalanceValue))} ${closingBalanceValue > 0 ? t.dr : t.cr}`;

  const handleSaveMaster = async () => {
    const name = editName.trim();
    const groupName = editGroupName.trim();

    if (!name) return Alert.alert(t.validation, t.enterName);
    if (!groupName) return Alert.alert(t.validation, t.enterGroup);

    try {
      setSaving(true);
      await updateLedger(ledger.id, {
        name,
        groupName,
        nature: editNature,
        isParty: editIsParty,
      });

      Alert.alert(t.save, t.savedSuccess);
      setShowMaster(false);
    } catch (err: any) {
      console.error('[LedgerDetail] update failed', err);
      Alert.alert(t.error, err?.message || t.error);
    } finally {
      setSaving(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      if (lines.length === 0) {
        Alert.alert(t.ledger, t.exportEmpty);
        return;
      }

      const safeName = ledger.name.replace(/[^\w\-]+/g, '_') || 'ledger';
      const fromLabel = fromDate || t.beginning;
      const toLabel = toDate || t.today;
      const fileName = `${safeName}_${fromLabel}_${toLabel}.pdf`;

      const rowsHtml = lines
        .map(
          (line) => `
        <tr>
          <td>${line.date || ''}</td>
          <td>
            <strong style="font-weight:700;color:#000;">${line.particular}</strong><br/>
            ${line.remarks ? `<span style="font-size:10px;color:#000;font-style:italic;">${line.remarks}</span>` : ''}
          </td>
          <td style="text-align:right;">${line.debit ? formatNumberWithOptionalDecimals(line.debit) : ''}</td>
          <td style="text-align:right;">${line.credit ? formatNumberWithOptionalDecimals(line.credit) : ''}</td>
          <td style="text-align:right;">${formatBalance(line.balance, t)}</td>
        </tr>
      `,
        )
        .join('\n');

      const html = `
        <!doctype html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>${t.statementTitle}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 11px; color: #000; padding: 16px; }
              h1,h2,h3 { margin:0; padding:0; color:#000; }
              .app-name { font-size: 10px; color:#000; text-align:center; }
              .stmt-title { font-size: 13px; font-weight: 700; text-align:center; margin-top: 2px; letter-spacing: 1px; color:#000; }
              .ledger-title { font-size: 18px; font-weight: 700; text-align:center; margin-top: 8px; color:#000; }
              .ledger-meta { font-size: 11px; text-align:center; color:#000; margin-top: 2px; }
              .period { font-size: 10px; text-align:center; margin-top: 4px; color:#000; }
              .closing { font-size: 10px; text-align:center; margin-top: 2px; color:#000; }
              table { width: 100%; border-collapse: collapse; margin-top: 12px; color:#000; }
              thead tr { border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; }
              th,td { padding: 4px 3px; color:#000; }
              tbody td { border-bottom: 1px solid rgba(0,0,0,0.5); }
              th { font-size: 10px; text-align: left; font-weight:700; }
              .amount { text-align: right; }
              tfoot td { border-top: 1px solid #000; border-bottom: 1px solid #000; font-weight:700; background:#fff; }
            </style>
          </head>
          <body>
            <div class="app-name">MobiLedger</div>
            <div class="stmt-title">${t.statementTitle}</div>
            <div class="ledger-title">${getLedgerLabel(ledger, language as AppLanguage)}</div>
            <div class="ledger-meta">${getGroupLabel(ledger.groupName, language as AppLanguage)} · ${getNatureLabel(ledger.nature, language as AppLanguage)}</div>
            <div class="period">${t.period}: ${fromDate || t.beginning} ～ ${toDate || t.today}</div>
            <div class="closing">${t.closingBalance} ${closingBalanceText}</div>

            <table>
              <thead>
                <tr>
                  <th style="width:16%;">${t.date}</th>
                  <th style="width:40%;">${t.particulars}</th>
                  <th style="width:14%; text-align:right;">${t.dr}</th>
                  <th style="width:14%; text-align:right;">${t.cr}</th>
                  <th style="width:16%; text-align:right;">${t.balance}</th>
                </tr>
              </thead>
              <tbody>${rowsHtml}</tbody>
              <tfoot>
                <tr>
                  <td></td>
                  <td>${t.total}</td>
                  <td class="amount">${formatNumberWithOptionalDecimals(totals.debit)}</td>
                  <td class="amount">${formatNumberWithOptionalDecimals(totals.credit)}</td>
                  <td class="amount">${formatBalance(closingBalanceValue, t)}</td>
                </tr>
              </tfoot>
            </table>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });

      let targetUri = uri;
      const dir = FileSystem.cacheDirectory;
      if (dir) {
        const newPath = dir + fileName;
        await FileSystem.moveAsync({ from: uri, to: newPath });
        targetUri = newPath;
      }

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert(t.ledger, `PDF created at: ${targetUri}\n(Sharing is not available on this device)`);
        return;
      }

      await Sharing.shareAsync(targetUri, {
        mimeType: 'application/pdf',
        dialogTitle: t.shareTitle,
      });
    } catch (err) {
      console.error('[LedgerDetail] PDF export failed', err);
      Alert.alert(t.error, t.error);
    }
  };

  const renderNatureChip = (value: Ledger['nature']) => {
    const selected = editNature === value;
    return (
      <TouchableOpacity
        key={value}
        style={[styles.natureChip, selected && styles.natureChipSelected]}
        onPress={() => setEditNature(value)}
        activeOpacity={0.7}
      >
        <Text style={[styles.natureChipText, selected && styles.natureChipTextSelected]}>
          {getNatureLabel(value, language as AppLanguage)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Stack.Screen options={{ title: getLedgerLabel(ledger, language as AppLanguage) }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.printHeaderCard}>
          <Text style={styles.appNameText}>MobiLedger</Text>
          <Text style={styles.statementTitle}>{t.statementTitle}</Text>

          <TouchableOpacity onPress={() => setShowMaster(true)} activeOpacity={0.7}>
            <Text style={styles.ledgerTitleText}>{getLedgerLabel(ledger, language as AppLanguage)}</Text>
          </TouchableOpacity>

          <Text style={styles.ledgerMetaText}>
            {getGroupLabel(ledger.groupName, language as AppLanguage)} · {getNatureLabel(ledger.nature, language as AppLanguage)}
          </Text>

          <View style={styles.headerBottomRow}>
            <Text style={styles.headerSmallLabel}>
              {t.closingBalance} <Text style={styles.headerBalanceText}>{closingBalanceText}</Text>
            </Text>
          </View>
        </View>

        {/* Currency rate badge */}
        {isConverted && (
          <View style={styles.rateBadge}>
            {rateLoading
              ? <ActivityIndicator size="small" color="#ac0c79" />
              : <Text style={styles.rateText}>~{sym} · 1 JPY = {exchangeRate.toFixed(6)} {currency.code}</Text>
            }
          </View>
        )}

        <View style={styles.filterCard}>
          <Text style={styles.filterTitle}>{t.period}</Text>
          <View style={styles.filterRow}>
            <View style={styles.filterCol}>
              <Text style={styles.filterLabel}>{t.from}</Text>
              <TouchableOpacity style={styles.filterInputButton} onPress={() => { setDatePickerTarget('from'); setPickerDate(parseDateString(fromDate)); setShowDatePicker(true); }}>
                <Text style={fromDate ? styles.filterInputText : styles.filterInputPlaceholder}>
                  {fromDate || t.selectDate}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.filterCol}>
              <Text style={styles.filterLabel}>{t.to}</Text>
              <TouchableOpacity style={styles.filterInputButton} onPress={() => { setDatePickerTarget('to'); setPickerDate(parseDateString(toDate)); setShowDatePicker(true); }}>
                <Text style={toDate ? styles.filterInputText : styles.filterInputPlaceholder}>
                  {toDate || t.selectDate}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.filterActionsRow}>
            <TouchableOpacity
              style={styles.filterClearButton}
              onPress={() => {
                setFromDate('');
                setToDate('');
              }}
            >
              <Text style={styles.filterClearText}>{t.clear}</Text>
            </TouchableOpacity>

            <View style={styles.exportRow}>
              <TouchableOpacity style={styles.exportButton} onPress={handleExportPdf}>
                <Text style={styles.exportButtonText}>{t.exportPdf}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colDate, styles.tableHeaderText]}>{t.date}</Text>
            <Text style={[styles.colParticular, styles.tableHeaderText]}>{t.particulars}</Text>
            <Text style={[styles.colAmount, styles.tableHeaderText, styles.right]}>{t.dr}</Text>
            <Text style={[styles.colAmount, styles.tableHeaderText, styles.right]}>{t.cr}</Text>
            <Text style={[styles.colBalance, styles.tableHeaderText, styles.right]}>{t.balance}</Text>
          </View>

          {lines.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                {isGroupView ? t.noChildLedgers : t.noEntries}
              </Text>
            </View>
          ) : (
            <>
              {lines.map((line) => {
                const isClickable = isGroupView && !!line.targetLedgerId;

                const RowWrap: React.FC<{ children: React.ReactNode }> = ({ children }) =>
                  isClickable ? (
                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => line.targetLedgerId && router.push({ pathname: '/ledger/[id]', params: { id: line.targetLedgerId } })}
                      style={[styles.tableRow, styles.clickableRow]}
                    >
                      {children}
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.tableRow}>{children}</View>
                  );

                return (
                  <RowWrap key={line.id}>
                    <View style={styles.colDate}>
                      <Text style={styles.dateText}>{line.date || ''}</Text>
                    </View>

                    <View style={styles.particularCell}>
                      <View style={styles.particularRow}>
                        <Text style={[styles.particularText, isClickable && styles.clickableText]}>
                          {line.particular}
                        </Text>
                        {isClickable ? <Text style={styles.chevronText}>›</Text> : null}
                      </View>

                      {line.remarks ? <Text style={styles.remarksText}>{line.remarks}</Text> : null}
                    </View>

                    <View style={styles.amountCell}>
                      <Text style={[styles.amountText, styles.right]}>
                        {line.debit ? formatNumberWithOptionalDecimals(line.debit) : ''}
                      </Text>
                    </View>
                    <View style={styles.amountCell}>
                      <Text style={[styles.amountText, styles.right]}>
                        {line.credit ? formatNumberWithOptionalDecimals(line.credit) : ''}
                      </Text>
                    </View>
                    <View style={styles.balanceCell}>
                      <Text style={[styles.amountText, styles.right]}>{formatNumberWithOptionalDecimals(Math.abs(line.balance))} {line.balance >= 0 ? t.dr : t.cr}</Text>
                    </View>
                  </RowWrap>
                );
              })}

              <View style={[styles.tableRow, styles.totalRow]}>
                <View style={styles.colDate} />
                <View style={styles.particularCell}>
                  <Text style={styles.totalLabel}>{t.total}</Text>
                </View>
                <View style={styles.amountCell}>
                  <Text style={[styles.amountText, styles.totalAmount, styles.right]}>
                    {formatNumberWithOptionalDecimals(totals.debit)}
                  </Text>
                </View>
                <View style={styles.amountCell}>
                  <Text style={[styles.amountText, styles.totalAmount, styles.right]}>
                    {formatNumberWithOptionalDecimals(totals.credit)}
                  </Text>
                </View>
                <View style={styles.balanceCell}>
                  <Text style={[styles.amountText, styles.totalAmount, styles.right]}>
                    {formatNumberWithOptionalDecimals(Math.abs(closingBalanceValue))} {closingBalanceValue >= 0 ? t.dr : t.cr}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(ev, dt) => { 
            if(Platform.OS==='android') setShowDatePicker(false); 
            if(dt && ev.type==='set') { 
              const val = formatDateToInput(dt); 
              if(datePickerTarget==='from') setFromDate(val); 
              else setToDate(val); 
            } 
          }}
        />
      )}

      {showMaster && (
        <View style={styles.overlay}>
          <View style={styles.masterCard}>
            <Text style={styles.masterTitle}>{t.ledgerMaster}</Text>
            <Text style={styles.masterHint}>{t.masterHint}</Text>

            <Text style={[styles.masterLabel, { marginTop: 8 }]}>{t.ledgerName}</Text>
            <TextInput style={styles.masterInput} value={editName} onChangeText={setEditName} />

            <Text style={[styles.masterLabel, { marginTop: 8 }]}>{t.category}</Text>
            <View style={styles.natureRow}>
              {['Asset', 'Liability', 'Income', 'Expense'].map((n) => renderNatureChip(n as any))}
            </View>

            <Text style={[styles.masterLabel, { marginTop: 8 }]}>{t.subCategory}</Text>
            <TextInput
              style={styles.masterInput}
              value={editGroupName}
              onChangeText={setEditGroupName}
            />

            <View style={styles.partyRow}>
              <Text style={styles.masterLabel}>{t.treatAsParty}</Text>
              <Switch value={editIsParty} onValueChange={setEditIsParty} />
            </View>

            <View style={styles.masterButtonsRow}>
              <TouchableOpacity
                style={styles.masterDeleteButton}
                onPress={() => {
                  Alert.alert(t.deleteLedgerTitle, t.deleteLedgerHint, [
                    { text: t.cancel, style: 'cancel' },
                    { text: t.delete, style: 'destructive', onPress: async () => {
                      try { await deleteLedger(ledger.id); Alert.alert(t.deleted, t.ledgerDeleted, [{ text: 'OK', onPress: () => router.replace('/(tabs)/ledgers') }]); }
                      catch (err: any) { Alert.alert(t.cannotDelete, err?.message || t.deleteError); }
                    }}
                  ]);
                }}
              >
                <Text style={styles.masterDeleteText}>{t.delete}</Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={styles.masterCancelButton}
                  onPress={() => setShowMaster(false)}
                >
                  <Text style={styles.masterCancelText}>{t.cancel}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.masterSaveButton, saving && { opacity: 0.6 }]}
                  onPress={() => !saving && void handleSaveMaster()}
                >
                  <Text style={styles.masterSaveText}>{saving ? t.saving : t.save}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.dark },
  container: { flex: 1, backgroundColor: COLORS.lightBg },
  content: { padding: 16, paddingBottom: 24 },
  rateBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f5f0fb', borderRadius: 8, padding: 8, marginBottom: 8 },
  rateText: { fontSize: 11, color: '#ac0c79', fontWeight: '500', flexShrink: 1 },

  notFoundContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  notFoundText: { fontSize: 14, color: COLORS.muted, marginBottom: 12 },
  backButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border },
  backButtonText: { color: COLORS.dark, fontSize: 13 },

  printHeaderCard: { borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#ffffff', marginBottom: 12 },
  appNameText: { fontSize: 11, color: COLORS.muted, textAlign: 'center' },
  statementTitle: { fontSize: 14, fontWeight: '700', color: COLORS.dark, textAlign: 'center', marginTop: 2, letterSpacing: 1.2 },
  ledgerTitleText: { fontSize: 20, fontWeight: '700', color: COLORS.dark, textAlign: 'center', marginTop: 8 },
  ledgerMetaText: { fontSize: 12, color: COLORS.muted, textAlign: 'center', marginTop: 2 },
  headerBottomRow: { marginTop: 8, alignItems: 'center' },
  headerSmallLabel: { fontSize: 11, color: COLORS.muted },
  headerBalanceText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },

  filterCard: { borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 10, backgroundColor: '#f9fbff', marginBottom: 12 },
  filterTitle: { fontSize: 13, fontWeight: '600', color: COLORS.dark, marginBottom: 6 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterCol: { flex: 1 },
  filterLabel: { fontSize: 11, color: COLORS.muted, marginBottom: 3 },
  filterInputButton: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 8, backgroundColor: COLORS.lightBg },
  filterInputText: { fontSize: 12, color: COLORS.dark },
  filterInputPlaceholder: { fontSize: 12, color: '#aaaaaa' },
  filterActionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  filterClearButton: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  filterClearText: { fontSize: 11, color: COLORS.muted },
  exportRow: { flexDirection: 'row', gap: 8 },
  exportButton: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18, backgroundColor: COLORS.primary },
  exportButtonText: { fontSize: 12, color: COLORS.lightBg, fontWeight: '600' },

  tableCard: { borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.lightBg, paddingHorizontal: 8, paddingTop: 6, paddingBottom: 8 },

  tableHeader: { flexDirection: 'row', borderTopWidth: 2, borderTopColor: '#000000', borderBottomWidth: 2, borderBottomColor: '#000000', paddingBottom: 4, marginBottom: 4 },
  colDate: { flex: 1.1 },
  colParticular: { flex: 2.4 },
  colAmount: { flex: 1 },
  colBalance: { flex: 1.1 },
  tableHeaderText: { fontSize: 11, fontWeight: '700', color: COLORS.dark },

  tableRow: { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)' },

  clickableRow: { backgroundColor: '#fff' },
  particularRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  clickableText: { color: COLORS.accent, fontWeight: '600' },
  chevronText: { color: COLORS.muted, fontSize: 18, lineHeight: 18, marginLeft: 6 },

  dateText: { fontSize: 11, color: COLORS.muted },
  particularCell: { flex: 2.4 },
  particularText: { fontSize: 12, color: COLORS.dark },
  remarksText: { fontSize: 10, color: COLORS.muted, marginTop: 1 },
  amountCell: { flex: 1, justifyContent: 'center' },
  balanceCell: { flex: 1.1, justifyContent: 'center' },
  amountText: { fontSize: 12, color: COLORS.dark, textAlign: 'right' },
  right: { textAlign: 'right' },

  totalRow: { backgroundColor: '#fdf7fb', borderTopWidth: 1, borderTopColor: '#000000', borderBottomWidth: 1, borderBottomColor: '#000000' },
  totalLabel: { fontSize: 12, fontWeight: '700', color: COLORS.dark },
  totalAmount: { fontWeight: '700', color: COLORS.primary },

  emptyBox: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 13, color: COLORS.muted },

  overlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  masterCard: { width: '100%', maxWidth: 420, borderRadius: 16, backgroundColor: '#ffffff', padding: 14 },
  masterTitle: { fontSize: 16, fontWeight: '600', color: COLORS.dark },
  masterHint: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  masterLabel: { fontSize: 12, color: COLORS.muted, marginBottom: 4 },
  masterInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 7, fontSize: 13, color: COLORS.dark, backgroundColor: '#f5f5f5' },
  natureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  natureChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  natureChipSelected: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  natureChipText: { fontSize: 12, color: COLORS.dark },
  natureChipTextSelected: { color: COLORS.lightBg, fontWeight: '600' },
  partyRow: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  masterButtonsRow: { marginTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  masterButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18 },
  masterCancelButton: { borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#ffffff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18 },
  masterCancelText: { fontSize: 13, color: COLORS.dark },
  masterSaveButton: { backgroundColor: COLORS.primary, paddingHorizontal: 16, borderRadius: 18, justifyContent: 'center' },
  masterSaveText: { fontSize: 13, color: COLORS.lightBg, fontWeight: '600' },
  masterDeleteButton: { borderWidth: 1, borderColor: '#ffe0e0', backgroundColor: '#fff4f4', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18 },
  masterDeleteText: { fontSize: 13, color: COLORS.danger, fontWeight: '600' },
});
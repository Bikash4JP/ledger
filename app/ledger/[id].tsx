// app/ledger/[id].tsx
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
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
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { useData } from '../../src/context/AppDataContext';
import { useSettings } from '../../src/context/SettingsContext';
import type { Ledger } from '../../src/models/ledger';
import type { Transaction } from '../../src/models/transaction';
import { AppLanguage, getGroupLabel, getLedgerLabel, getNatureLabel } from '../../src/utils/ledgerLabels';

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

function formatAmount(value: number): string {
  if (!value) return '¥0';
  return `¥${formatNumberWithOptionalDecimals(Math.abs(value))}`;
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

export default function LedgerDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { ledgers, transactions, updateLedger, deleteLedger } = useData();
  const { settings } = useSettings();
  const language: Language = settings.language === 'ja' ? 'ja' : 'en';
  const t = UI_TEXT[language];

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
    const ledgerTx = transactions.filter(t => t.debitLedgerId === ledger.id || t.creditLedgerId === ledger.id);

    return ledgerTx.map((trans: Transaction) => {
      const isDebit = trans.debitLedgerId === ledger.id;
      const otherLedgerId = isDebit ? trans.creditLedgerId : trans.debitLedgerId;
      const otherLedger = ledgers.find((l: Ledger) => l.id === otherLedgerId) ?? null;
      const otherName = otherLedger ? getLedgerLabel(otherLedger, language as AppLanguage) : otherLedgerId;

      return {
        id: trans.id,
        date: normalizeDate(trans.date),
        particular: otherName,
        remarks: trans.narration || '',
        debit: isDebit ? trans.amount : 0,
        credit: !isDebit ? trans.amount : 0,
        isOpeningTx: (otherLedger?.name || '').toLowerCase().includes('opening balance'),
      };
    });
  }, [ledger, isGroupView, ledgers, transactions, language]);

  const openingBalanceValue = useMemo(() => {
    if (!fromDate) return 0;
    return baseLines.filter(l => l.date < fromDate).reduce((sum, l) => sum + (l.debit - l.credit), 0);
  }, [baseLines, fromDate]);

  const lines: LedgerLine[] = useMemo(() => {
    if (!ledger) return [];
    if (isGroupView) return groupLines;

    const period = baseLines.filter(line => (!fromDate || line.date >= fromDate) && (!toDate || line.date <= toDate));
    const ordered = [...period].sort((a, b) => a.date === b.date ? a.id.localeCompare(b.id) : a.date < b.date ? -1 : 1);

    const openingRow: LedgerLine | null = openingBalanceValue !== 0 ? {
      id: 'opening-bf', date: '', particular: language === 'ja' ? '前月繰越' : 'Opening balance B/F',
      remarks: '', debit: openingBalanceValue > 0 ? openingBalanceValue : 0,
      credit: openingBalanceValue < 0 ? Math.abs(openingBalanceValue) : 0,
      balance: openingBalanceValue, isSyntheticOpening: true,
    } : null;

    let running = openingBalanceValue;
    const withBalance = ordered.map(line => {
      running += line.debit - line.credit;
      return { ...line, balance: running };
    });

    return openingRow ? [openingRow, ...withBalance] : withBalance;
  }, [ledger, isGroupView, groupLines, baseLines, fromDate, toDate, openingBalanceValue, language]);

  const totals = useMemo(() => lines.reduce((acc, line) => {
    if (!line.isSyntheticOpening) { acc.debit += line.debit; acc.credit += line.credit; }
    return acc;
  }, { debit: 0, credit: 0 }), [lines]);

  const closingBalanceValue = useMemo(() => {
    if (lines.length === 0) return 0;
    return isGroupView ? lines.reduce((sum, l) => sum + l.balance, 0) : lines[lines.length - 1].balance;
  }, [lines, isGroupView]);

  if (!ledger) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.notFoundContainer}><Text style={styles.notFoundText}>{t.notFound}</Text></View>
      </SafeAreaView>
    );
  }

  const closingBalanceText = closingBalanceValue === 0 ? '0' : `${formatAmount(Math.abs(closingBalanceValue))} ${closingBalanceValue > 0 ? t.dr : t.cr}`;

  const handleSaveMaster = async () => {
    const name = editName.trim();
    const groupName = editGroupName.trim();
    if (!name || !groupName) return Alert.alert(t.validation, t.enterName);
    try {
      setSaving(true);
      await updateLedger(ledger.id, { name, groupName, nature: editNature, isParty: editIsParty });
      Alert.alert(t.save, t.savedSuccess);
      setShowMaster(false);
    } catch (err: any) { Alert.alert(t.error, err?.message); } finally { setSaving(false); }
  };

  const handleExportPdf = async () => {
    if (lines.length === 0) return Alert.alert(t.ledger, t.exportEmpty);
    const html = `<html><head><meta charset="utf-8" /><style>body{font-family:sans-serif;font-size:10px;padding:15px;}table{width:100%;border-collapse:collapse;margin-top:10px;}th,td{border-bottom:1px solid #eee;padding:5px;text-align:left;}th{background:#f9f9f9;}</style></head><body><h2 style="text-align:center;">${t.statementTitle}</h2><p><strong>${getLedgerLabel(ledger, language as AppLanguage)}</strong></p><table><thead><tr><th>${t.date}</th><th>${t.particulars}</th><th style="text-align:right;">${t.dr}</th><th style="text-align:right;">${t.cr}</th><th style="text-align:right;">${t.balance}</th></tr></thead><tbody>${lines.map(l => `<tr><td>${l.date}</td><td>${l.particular}</td><td style="text-align:right;">${l.debit || ''}</td><td style="text-align:right;">${l.credit || ''}</td><td style="text-align:right;">${formatNumberWithOptionalDecimals(l.balance)}</td></tr>`).join('')}</tbody></table></body></html>`;
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: t.shareTitle });
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
          <Text style={styles.ledgerMetaText}>{getGroupLabel(ledger.groupName, language as AppLanguage)} · {getNatureLabel(ledger.nature, language as AppLanguage)}</Text>
          <View style={styles.headerBottomRow}><Text style={styles.headerSmallLabel}>{t.closingBalance} <Text style={styles.headerBalanceText}>{closingBalanceText}</Text></Text></View>
        </View>

        <View style={styles.filterCard}>
          <Text style={styles.filterTitle}>{t.period}</Text>
          <View style={styles.filterRow}>
            <View style={styles.filterCol}><Text style={styles.filterLabel}>{t.from}</Text><TouchableOpacity style={styles.filterInputButton} onPress={() => { setDatePickerTarget('from'); setPickerDate(parseDateString(fromDate)); setShowDatePicker(true); }}><Text style={fromDate ? styles.filterInputText : styles.filterInputPlaceholder}>{fromDate || t.selectDate}</Text></TouchableOpacity></View>
            <View style={styles.filterCol}><Text style={styles.filterLabel}>{t.to}</Text><TouchableOpacity style={styles.filterInputButton} onPress={() => { setDatePickerTarget('to'); setPickerDate(parseDateString(toDate)); setShowDatePicker(true); }}><Text style={toDate ? styles.filterInputText : styles.filterInputPlaceholder}>{toDate || t.selectDate}</Text></TouchableOpacity></View>
          </View>
          <View style={styles.filterActionsRow}><TouchableOpacity style={styles.filterClearButton} onPress={() => { setFromDate(''); setToDate(''); }}><Text style={styles.filterClearText}>{t.clear}</Text></TouchableOpacity><TouchableOpacity style={styles.exportButton} onPress={handleExportPdf}><Text style={styles.exportButtonText}>{t.exportPdf}</Text></TouchableOpacity></View>
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
            <View style={styles.emptyBox}><Text style={styles.emptyText}>{isGroupView ? t.noChildLedgers : t.noEntries}</Text></View>
          ) : (
            <>
              {lines.map((line) => (
                <TouchableOpacity key={line.id} disabled={!(isGroupView && !!line.targetLedgerId)} onPress={() => line.targetLedgerId && router.push({ pathname: '/ledger/[id]', params: { id: line.targetLedgerId } })} style={styles.tableRow}>
                  <View style={styles.colDate}><Text style={styles.dateText}>{line.date || ''}</Text></View>
                  <View style={styles.particularCell}><Text style={[styles.particularText, isGroupView && !!line.targetLedgerId && styles.clickableText]}>{line.particular}</Text>{line.remarks ? <Text style={styles.remarksText}>{line.remarks}</Text> : null}</View>
                  <View style={styles.amountCell}><Text style={[styles.amountText, styles.right]}>{line.debit ? formatNumberWithOptionalDecimals(line.debit) : ''}</Text></View>
                  <View style={styles.amountCell}><Text style={[styles.amountText, styles.right]}>{line.credit ? formatNumberWithOptionalDecimals(line.credit) : ''}</Text></View>
                  <View style={styles.balanceCell}><Text style={[styles.amountText, styles.right]}>{formatNumberWithOptionalDecimals(Math.abs(line.balance))} {line.balance >= 0 ? t.dr : t.cr}</Text></View>
                </TouchableOpacity>
              ))}
              <View style={[styles.tableRow, styles.totalRow]}>
                <View style={styles.colDate} /><View style={styles.particularCell}><Text style={styles.totalLabel}>{t.total}</Text></View>
                <View style={styles.amountCell}><Text style={[styles.amountText, styles.totalAmount, styles.right]}>{formatNumberWithOptionalDecimals(totals.debit)}</Text></View>
                <View style={styles.amountCell}><Text style={[styles.amountText, styles.totalAmount, styles.right]}>{formatNumberWithOptionalDecimals(totals.credit)}</Text></View>
                <View style={styles.balanceCell}><Text style={[styles.amountText, styles.totalAmount, styles.right]}>{formatNumberWithOptionalDecimals(Math.abs(closingBalanceValue))} {closingBalanceValue >= 0 ? t.dr : t.cr}</Text></View>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {showDatePicker && <DateTimePicker value={pickerDate} mode="date" display={Platform.OS === 'ios' ? 'inline' : 'default'} onChange={(ev, dt) => { if(Platform.OS==='android') setShowDatePicker(false); if(dt && ev.type==='set') { const val = formatDateToInput(dt); if(datePickerTarget==='from') setFromDate(val); else setToDate(val); } }} />}

      {showMaster && (
        <View style={styles.overlay}><View style={styles.masterCard}>
          <Text style={styles.masterTitle}>{t.ledgerMaster}</Text><Text style={styles.masterLabel}>{t.masterHint}</Text>
          <Text style={styles.masterLabel}>{t.ledgerName}</Text><TextInput style={styles.masterInput} value={editName} onChangeText={setEditName} />
          <Text style={styles.masterLabel}>{t.category}</Text>
          <View style={styles.natureRow}>{['Asset', 'Liability', 'Income', 'Expense'].map(n => <TouchableOpacity key={n} style={[styles.natureChip, editNature === n && styles.natureChipSelected]} onPress={() => setEditNature(n as any)}><Text style={[styles.natureChipText, editNature === n && styles.natureChipTextSelected]}>{getNatureLabel(n, language as AppLanguage)}</Text></TouchableOpacity>)}</View>
          <Text style={styles.masterLabel}>{t.subCategory}</Text><TextInput style={styles.masterInput} value={editGroupName} onChangeText={setEditGroupName} />
          <View style={styles.partyRow}><Text style={styles.masterLabel}>{t.treatAsParty}</Text><Switch value={editIsParty} onValueChange={setEditIsParty} /></View>
          <View style={styles.masterButtonsRow}><TouchableOpacity style={[styles.masterButton, styles.masterCancelButton]} onPress={() => setShowMaster(false)}><Text>{t.cancel}</Text></TouchableOpacity><TouchableOpacity style={[styles.masterButton, styles.masterSaveButton]} onPress={handleSaveMaster} disabled={saving}><Text style={styles.masterSaveText}>{saving ? t.saving : t.save}</Text></TouchableOpacity></View>
        </View></View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.dark },
  container: { flex: 1, backgroundColor: COLORS.lightBg },
  content: { padding: 16, paddingBottom: 24 },
  notFoundContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFoundText: { fontSize: 14, color: COLORS.muted },
  printHeaderCard: { borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 16, backgroundColor: '#ffffff', marginBottom: 12 },
  appNameText: { fontSize: 11, color: COLORS.muted, textAlign: 'center' },
  statementTitle: { fontSize: 14, fontWeight: '700', textAlign: 'center', marginTop: 2 },
  ledgerTitleText: { fontSize: 20, fontWeight: '700', textAlign: 'center', marginTop: 8 },
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
  exportButton: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18, backgroundColor: COLORS.primary },
  exportButtonText: { fontSize: 12, color: COLORS.lightBg, fontWeight: '600' },
  tableCard: { borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.lightBg, paddingHorizontal: 8, paddingTop: 6, paddingBottom: 8 },
  tableHeader: { flexDirection: 'row', borderTopWidth: 2, borderTopColor: '#000', borderBottomWidth: 2, borderBottomColor: '#000', paddingBottom: 4, marginBottom: 4 },
  colDate: { flex: 1.1 }, colParticular: { flex: 2.4 }, colAmount: { flex: 1 }, colBalance: { flex: 1.1 },
  tableHeaderText: { fontSize: 11, fontWeight: '700', color: COLORS.dark },
  tableRow: { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)' },
  dateText: { fontSize: 11, color: COLORS.muted },
  particularCell: { flex: 2.4 },
  particularText: { fontSize: 12, color: COLORS.dark },
  clickableText: { color: COLORS.accent, fontWeight: '600' },
  remarksText: { fontSize: 10, color: COLORS.muted, marginTop: 1 },
  amountCell: { flex: 1, justifyContent: 'center' },
  balanceCell: { flex: 1.1, justifyContent: 'center' },
  amountText: { fontSize: 12, color: COLORS.dark, textAlign: 'right' },
  right: { textAlign: 'right' },
  totalRow: { backgroundColor: '#fdf7fb', borderTopWidth: 1, borderTopColor: '#000', borderBottomWidth: 1, borderBottomColor: '#000' },
  totalLabel: { fontSize: 12, fontWeight: '700', color: COLORS.dark },
  totalAmount: { fontWeight: '700', color: COLORS.primary },
  emptyBox: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 13, color: COLORS.muted },
  overlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 16 },
  masterCard: { width: '100%', borderRadius: 16, backgroundColor: '#ffffff', padding: 14 },
  masterTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  masterLabel: { fontSize: 12, color: COLORS.muted, marginTop: 8, marginBottom: 4 },
  masterInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 8, fontSize: 13, backgroundColor: '#f5f5f5' },
  natureRow: { flexDirection: 'row', gap: 6 },
  natureChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  natureChipSelected: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  natureChipText: { fontSize: 12 },
  natureChipTextSelected: { color: COLORS.lightBg, fontWeight: '600' },
  partyRow: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  masterButtonsRow: { marginTop: 14, flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  masterButton: { padding: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  masterCancelButton: { padding: 10 },
  masterSaveButton: { backgroundColor: COLORS.primary, paddingHorizontal: 16, borderRadius: 18, justifyContent: 'center' },
  masterSaveText: { color: COLORS.lightBg, fontWeight: '600' },
});
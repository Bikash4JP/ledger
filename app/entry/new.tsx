// app/entry/new.tsx
import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useData } from '../../src/context/AppDataContext';
import { useSettings } from '../../src/context/SettingsContext';
import type { Ledger } from '../../src/models/ledger';
import { getLedgerLabel } from '../../src/utils/ledgerLabels';

const COLORS = {
  primary: '#ac0c79',
  dark: '#121212',
  lightBg: '#ffffff',
  accent: '#2e9ff5',
  muted: '#777777',
  border: '#d0d0d0',
  danger: '#d32f2f',
};

type EntryType = 'cashBook' | 'journal';
type Language = 'en' | 'ja';

const UI_TEXT: Record<Language, any> = {
  en: {
    addEntry: 'Add Entry',
    cashBook: 'Cash Book',
    journal: 'Journal',
    validation: 'Validation',
    error: 'Error',
    success: 'Success',
    enterLedgerName: 'Please enter ledger name.',
    selectParent: 'Please select a Parent/Category (or type a parent name to create it).',
    failedCreateLedger: 'Failed to create ledger.',
    missingLedgerPrefix: 'Ledger "',
    missingLedgerSuffix: '" does not exist yet. Please create it first.',
    openingBalance: 'Opening balance',
    savedSuccess: 'Entries saved successfully.',
    failedSave: 'Failed to save entry. Please check your connection / backend.',
    enterAmount: 'Please enter amount.',
    cashLedgerMissing: 'Cash ledger missing. Please create a "Cash A/C" ledger first.',
    selectRelatedLedger: 'Please select or create the related ledger (Rent, Party, etc.).',
    mismatch: 'Debit is not equal to Credit.',
    journalLimit: 'Currently: either multiple Debits with a single Credit, or multiple Credits with a single Debit is supported.',
    createLedger: 'Create New Ledger',
    createLedgerHint: 'This will be added as a ledger with optional opening balance.',
    ledgerName: 'Ledger Name',
    ledgerType: 'Ledger Type',
    asset: 'Asset',
    liability: 'Liability',
    income: 'Income',
    expense: 'Expense',
    parentCategory: 'Create as Parent Category?',
    parentHint: 'ON = Parent/Group ledger (roll-up). OFF = Normal ledger inside a parent.',
    parentPlaceholder: 'Search parent (e.g. Bank A/c)',
    standard: '(standard)',
    autoCreatePrefix: 'Parent "',
    autoCreateSuffix: '" will be created automatically on Save.',
    openingBalanceLabel: 'Opening Balance (optional)',
    cancel: 'Cancel',
    creatingAccounts: 'Creating accounts...',
    accountCreated: 'New account created',
    saveAndUse: 'Save & Use',
    cashBookEntry: 'Cash Book Entry',
    date: 'Date (YYYY-MM-DD)',
    cashOut: 'Cash Out',
    cashIn: 'Cash In',
    particular: 'Particular',
    particularPlaceholder: 'Select the related a/c',
    amount: 'Amount',
    narration: 'Narration',
    saveCash: 'Save Cash Entry',
    saving: 'Saving...',
    journalEntry: 'Journal Entry',
    debit: 'Debit',
    drLedger: 'Dr Ledger',
    addDebit: '+ Add Debit Line',
    credit: 'Credit',
    crLedger: 'Cr Ledger',
    addCredit: '+ Add Credit Line',
    totalDr: 'Total Dr:',
    totalCr: 'Total Cr:',
    journalError: 'Dr and Cr totals must be equal for a valid journal.',
    saveJournal: 'Save Journal Entry',
    paymentTo: 'Payment to ',
    receiptFrom: 'Receipt from ',
    journalDefault: 'Journal entry',
    createPlaceholder: '+ Create "'
  },
  ja: {
    addEntry: '仕訳登録',
    cashBook: '現金出納帳',
    journal: '振替伝票',
    validation: '確認',
    error: 'エラー',
    success: '成功',
    enterLedgerName: '元帳名を入力してください。',
    selectParent: '親カテゴリーを選択するか、名前を入力して新規作成してください。',
    failedCreateLedger: '元帳の作成に失敗しました。',
    missingLedgerPrefix: '元帳「',
    missingLedgerSuffix: '」はまだ存在しません。先に作成してください。',
    openingBalance: '開始残高',
    savedSuccess: '仕訳が正常に保存されました。',
    failedSave: '保存に失敗しました。接続やサーバーの状態を確認してください。',
    enterAmount: '金額を入力してください。',
    cashLedgerMissing: '現金勘定がありません。「現金」元帳を先に作成してください。',
    selectRelatedLedger: '相手勘定（家賃、取引先など）を選択または作成してください。',
    mismatch: '借方と貸方の金額が一致しません。',
    journalLimit: '現在は、複数の借方対単一の貸方、または単一の借方対複数の貸方のみサポートしています。',
    createLedger: '新しい元帳を作成',
    createLedgerHint: '開始残高（任意）を設定して元帳を追加します。',
    ledgerName: '元帳名',
    ledgerType: '元帳の種類',
    asset: '資産',
    liability: '負債',
    income: '収益',
    expense: '費用',
    parentCategory: '親カテゴリーとして作成',
    parentHint: 'ON = 集計用の親グループ。OFF = グループ内の通常の元帳。',
    parentPlaceholder: '親グループを検索 (例: 銀行勘定)',
    standard: '(標準)',
    autoCreatePrefix: '親グループ「',
    autoCreateSuffix: '」は保存時に自動作成されます。',
    openingBalanceLabel: '開始残高 (任意)',
    cancel: 'キャンセル',
    creatingAccounts: '作成中...',
    accountCreated: '作成完了',
    saveAndUse: '保存して使用',
    cashBookEntry: '現金出納帳入力',
    date: '日付 (YYYY-MM-DD)',
    cashOut: '出金',
    cashIn: '入金',
    particular: '相手勘定',
    particularPlaceholder: '相手勘定を選択',
    amount: '金額',
    narration: '摘要',
    saveCash: '現金仕訳を保存',
    saving: '保存中...',
    journalEntry: '振替伝票入力',
    debit: '借方',
    drLedger: '借方勘定',
    addDebit: '+ 借方行を追加',
    credit: '貸方',
    crLedger: '貸方勘定',
    addCredit: '+ 貸方行を追加',
    totalDr: '借方合計:',
    totalCr: '貸方合計:',
    journalError: '振替伝票では借方と貸方の合計が一致する必要があります。',
    saveJournal: '振替仕訳を保存',
    paymentTo: '支払先: ',
    receiptFrom: '受取先: ',
    journalDefault: '振替仕訳',
    createPlaceholder: '+ 「'
  }
};

type Line = {
  id: string;
  ledgerName: string;
  amount: string;
  showSuggestions?: boolean;
};

type CreateLedgerContext =
  | { source: 'cash'; name: string }
  | { source: 'other'; name: string }
  | { source: 'journal-dr'; lineId: string; name: string }
  | { source: 'journal-cr'; lineId: string; name: string };

type ParentSuggestion = {
  id?: string;
  name: string;
  isRealLedger: boolean;
};

const uniqueByName = (items: Ledger[]): Ledger[] => {
  const seen = new Set<string>();
  const result: Ledger[] = [];
  for (const l of items) {
    const key = l.name.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(l);
  }
  return result;
};

export default function NewEntryScreen() {
  const router = useRouter();
  const { ledgers, addTransaction, addLedger } = useData();
  const { settings } = useSettings();
  const language: Language = settings.language === 'ja' ? 'ja' : 'en';
  const t = UI_TEXT[language];

  const insets = useSafeAreaInsets();
  const keyboardVerticalOffset = Platform.OS === 'ios' ? insets.top + 64 : 0;

  const getLedgerDisplayName = React.useCallback(
    (ledger: Ledger | null | undefined) => {
      if (!ledger) return '';
      return getLedgerLabel(ledger, language);
    },
    [language],
  );

  const [entryType, setEntryType] = useState<EntryType>('cashBook');
  const [isSavingEntry, setIsSavingEntry] = useState(false);
  const saveLockRef = React.useRef(false);

  // ----- CASH BOOK STATE -----
  const [cashDirection, setCashDirection] = useState<'in' | 'out'>('out');
  const [otherLedgerId, setOtherLedgerId] = useState<string | undefined>();
  const [otherLedgerQuery, setOtherLedgerQuery] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [cashNarration, setCashNarration] = useState('');
  const [cashDate, setCashDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [showCashDatePicker, setShowCashDatePicker] = useState(false);
  const [showCashSuggestions, setShowCashSuggestions] = useState(true);

  // ----- JOURNAL STATE -----
  const [journalDate, setJournalDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [journalNarration, setJournalNarration] = useState('');
  const [showJournalDatePicker, setShowJournalDatePicker] = useState(false);

  const [debitLines, setDebitLines] = useState<Line[]>([
    { id: 'dr-1', ledgerName: '', amount: '', showSuggestions: true },
  ]);
  const [creditLines, setCreditLines] = useState<Line[]>([
    { id: 'cr-1', ledgerName: '', amount: '', showSuggestions: true },
  ]);

  const todayDateStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // ----- CREATE LEDGER POPUP STATE -----
  const [createCtx, setCreateCtx] = useState<CreateLedgerContext | null>(null);
  const [newLedgerName, setNewLedgerName] = useState('');
  const [newLedgerNature, setNewLedgerNature] = useState<Ledger['nature']>('Asset');
  const [newLedgerOpeningAmount, setNewLedgerOpeningAmount] = useState('');
  const [newLedgerOpeningType, setNewLedgerOpeningType] = useState<'Dr' | 'Cr'>('Dr');
  const [newLedgerIsGroup, setNewLedgerIsGroup] = useState(false);
  const [parentQuery, setParentQuery] = useState('');
  const [parentLedgerId, setParentLedgerId] = useState<string | undefined>();
  const [showParentSuggestions, setShowParentSuggestions] = useState(true);
  const [isCreatingLedger, setIsCreatingLedger] = useState(false);
  const [ledgerCreateStage, setLedgerCreateStage] = useState<'idle' | 'creating' | 'done'>('idle');

  const closeCreateLedgerModalAfterDone = () => {
    setTimeout(() => {
      setCreateCtx(null);
      setIsCreatingLedger(false);
      setLedgerCreateStage('idle');
    }, 650);
  };

  const cashLedgers = useMemo(
    () => uniqueByName(ledgers.filter((l: Ledger) => l.name.toLowerCase().includes('cash'))),
    [ledgers],
  );

  const findMatchingLedgers = (query: string): Ledger[] => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return uniqueByName(
      ledgers.filter((l: Ledger) => 
        l.name.toLowerCase().includes(q) || 
        getLedgerLabel(l, language).toLowerCase().includes(q)
      ),
    ).slice(0, 8);
  };

  const findExistingByExactName = (name: string): Ledger | undefined => {
    const q = name.trim().toLowerCase();
    if (!q) return undefined;
    return ledgers.find((l: Ledger) => l.name.trim().toLowerCase() === q);
  };

  const parseAmount = (v: string): number => {
    const num = parseFloat(v.replace(/,/g, ''));
    return Number.isNaN(num) ? 0 : Math.abs(num);
  };

  const parentLedgers = useMemo(() => {
    return uniqueByName(ledgers.filter((l: Ledger) => !!l.isGroup));
  }, [ledgers]);

  const standardGroupNames = useMemo(() => {
    const set = new Set<string>();
    for (const l of ledgers) {
      const g = (l.groupName || '').trim();
      if (g) set.add(g);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [ledgers]);

  const findMatchingParents = (query: string): ParentSuggestion[] => {
    const q = query.trim().toLowerCase();
    const real = parentLedgers
      .filter((l) => !q || l.name.toLowerCase().includes(q))
      .slice(0, 10)
      .map<ParentSuggestion>((l) => ({ id: l.id, name: l.name, isRealLedger: true }));

    const groupCandidates = standardGroupNames
      .filter((name) => !q || name.toLowerCase().includes(q))
      .slice(0, 20);

    const realNameSet = new Set(real.map((r) => r.name.trim().toLowerCase()));
    const groupSug: ParentSuggestion[] = groupCandidates
      .filter((g) => !realNameSet.has(g.trim().toLowerCase()))
      .map((g) => ({ name: g, isRealLedger: false }));

    return [...real, ...groupSug].slice(0, 10);
  };

  const resolveParent = (): Ledger | undefined => {
    if (parentLedgerId) return ledgers.find((l) => l.id === parentLedgerId);
    const q = parentQuery.trim().toLowerCase();
    if (!q) return undefined;
    return parentLedgers.find((p) => p.name.trim().toLowerCase() === q);
  };

  const getOrCreateOpeningLedger = async (): Promise<Ledger> => {
    let opening = ledgers.find((l: Ledger) => l.name.toLowerCase() === 'opening balance adjustment');
    if (opening) return opening;
    const created = await addLedger({
      name: 'Opening Balance Adjustment',
      groupName: 'Capital & Reserves',
      nature: 'Liability',
      isParty: false,
      isGroup: false,
      parentLedgerId: null,
    });
    if (!created) throw new Error('Failed to create Opening Balance Adjustment ledger');
    return created;
  };

  const openCreateLedger = (ctx: CreateLedgerContext) => {
    setCreateCtx(ctx);
    setNewLedgerName(ctx.name);
    setNewLedgerNature('Asset');
    setNewLedgerOpeningAmount('');
    setNewLedgerOpeningType('Dr');
    setNewLedgerIsGroup(false);
    setParentQuery('');
    setParentLedgerId(undefined);
    setShowParentSuggestions(true);
    setIsCreatingLedger(false);
    setLedgerCreateStage('idle');
  };

  const handleCreateLedgerSave = async () => {
    if (!createCtx || isCreatingLedger) return;
    const name = newLedgerName.trim();
    if (!name) {
      Alert.alert(t.validation, t.enterLedgerName);
      return;
    }
    setIsCreatingLedger(true);
    setLedgerCreateStage('creating');
    try {
      const existing = findExistingByExactName(name);
      if (existing) {
        applyCreatedLedger(existing, createCtx);
        setLedgerCreateStage('done');
        closeCreateLedgerModalAfterDone();
        return;
      }
      let parent: Ledger | undefined = undefined;
      if (!newLedgerIsGroup) {
        parent = resolveParent();
        if (!parent && parentQuery.trim()) {
          const createdParent = await addLedger({
            name: parentQuery.trim(),
            groupName: newLedgerNature === 'Asset' ? 'Assets' : newLedgerNature === 'Liability' ? 'Liabilities' : newLedgerNature === 'Income' ? 'Income' : 'Expenses',
            nature: newLedgerNature,
            isParty: false,
            isGroup: true,
            parentLedgerId: null,
          });
          if (createdParent) parent = createdParent;
        }
        if (!parent) {
          setIsCreatingLedger(false);
          setLedgerCreateStage('idle');
          Alert.alert(t.validation, t.selectParent);
          return;
        }
      }
      const newLedger = await addLedger({
        name,
        groupName: parent ? parent.groupName : (newLedgerNature === 'Asset' ? 'Assets' : 'Liabilities'),
        nature: newLedgerNature,
        isParty: newLedgerNature === 'Asset' || newLedgerNature === 'Liability',
        isGroup: newLedgerIsGroup,
        parentLedgerId: newLedgerIsGroup ? null : parent?.id ?? null,
      });
      if (!newLedger) {
        setIsCreatingLedger(false);
        setLedgerCreateStage('idle');
        Alert.alert(t.error, t.failedCreateLedger);
        return;
      }
      const openingAmountNum = parseAmount(newLedgerOpeningAmount);
      if (openingAmountNum > 0) {
        const openingLedger = await getOrCreateOpeningLedger();
        const date = entryType === 'journal' ? journalDate || todayDateStr : todayDateStr;
        if (newLedgerOpeningType === 'Dr') {
          await addTransaction({ date, debitLedgerId: newLedger.id, creditLedgerId: openingLedger.id, amount: openingAmountNum, narration: t.openingBalance, voucherType: 'Journal' });
        } else {
          await addTransaction({ date, debitLedgerId: openingLedger.id, creditLedgerId: newLedger.id, amount: openingAmountNum, narration: t.openingBalance, voucherType: 'Journal' });
        }
      }
      applyCreatedLedger(newLedger, createCtx);
      setLedgerCreateStage('done');
      closeCreateLedgerModalAfterDone();
    } catch (err) {
      console.error(err);
      setIsCreatingLedger(false);
      setLedgerCreateStage('idle');
      Alert.alert(t.error, t.failedCreateLedger);
    }
  };

  const applyCreatedLedger = (ledger: Ledger, ctx: CreateLedgerContext) => {
    if (ctx.source === 'other') {
      setOtherLedgerId(ledger.id);
      setOtherLedgerQuery(getLedgerDisplayName(ledger));
      setShowCashSuggestions(false);
    } else if (ctx.source === 'journal-dr') {
      setDebitLines((prev) => prev.map((l: Line) => l.id === ctx.lineId ? { ...l, ledgerName: getLedgerDisplayName(ledger), showSuggestions: false } : l));
    } else if (ctx.source === 'journal-cr') {
      setCreditLines((prev) => prev.map((l: Line) => l.id === ctx.lineId ? { ...l, ledgerName: getLedgerDisplayName(ledger), showSuggestions: false } : l));
    }
  };

  const beginSave = (): boolean => {
    if (saveLockRef.current) return false;
    saveLockRef.current = true;
    setIsSavingEntry(true);
    return true;
  };
  const endSave = () => {
    saveLockRef.current = false;
    setIsSavingEntry(false);
  };

  const handleSaveCashBook = async () => {
    if (!beginSave()) return;
    try {
      const amount = parseAmount(cashAmount);
      if (!amount || amount <= 0) { Alert.alert(t.validation, t.enterAmount); return; }
      const usedCashLedger = cashLedgers[0];
      if (!usedCashLedger) { Alert.alert(t.error, t.cashLedgerMissing); return; }
      let usedOtherLedger = otherLedgerId ? ledgers.find((l) => l.id === otherLedgerId) : findExistingByExactName(otherLedgerQuery);
      if (!usedOtherLedger) { Alert.alert(t.validation, t.selectRelatedLedger); return; }
      const date = cashDate.trim() || todayDateStr;
      const narration = cashNarration.trim() || (cashDirection === 'out' ? `${t.paymentTo}${usedOtherLedger.name}` : `${t.receiptFrom}${usedOtherLedger.name}`);
      if (cashDirection === 'out') {
        await addTransaction({ date, debitLedgerId: usedOtherLedger.id, creditLedgerId: usedCashLedger.id, amount, narration, voucherType: 'Payment' });
      } else {
        await addTransaction({ date, debitLedgerId: usedCashLedger.id, creditLedgerId: usedOtherLedger.id, amount, narration, voucherType: 'Receipt' });
      }
      Alert.alert(t.success, t.savedSuccess, [{ text: 'OK', onPress: () => router.replace('/(tabs)/entries') }]);
    } catch (err) {
      Alert.alert(t.error, t.failedSave);
    } finally {
      endSave();
    }
  };

  const handleSaveJournal = async () => {
    if (!beginSave()) return;
    try {
      const drLines = debitLines.map(l => ({ ...l, amountNum: parseAmount(l.amount) })).filter(l => l.ledgerName.trim() && l.amountNum > 0);
      const crLines = creditLines.map(l => ({ ...l, amountNum: parseAmount(l.amount) })).filter(l => l.ledgerName.trim() && l.amountNum > 0);
      if (drLines.length === 0 || crLines.length === 0) { Alert.alert(t.validation, t.enterAmount); return; }
      const totalDr = drLines.reduce((s, l) => s + l.amountNum, 0);
      const totalCr = crLines.reduce((s, l) => s + l.amountNum, 0);
      if (Math.abs(totalDr - totalCr) > 0.001) { Alert.alert(t.validation, t.mismatch); return; }
      if (crLines.length > 1 && drLines.length > 1) { Alert.alert(t.error, t.journalLimit); return; }

      const missing: any[] = [];
      const drResolved = drLines.map(l => { const found = findExistingByExactName(l.ledgerName); if(!found) missing.push({type:'dr', ...l}); return found; });
      const crResolved = crLines.map(l => { const found = findExistingByExactName(l.ledgerName); if(!found) missing.push({type:'cr', ...l}); return found; });

      if (missing.length > 0) {
        const first = missing[0];
        openCreateLedger({ source: first.type === 'dr' ? 'journal-dr' : 'journal-cr', lineId: first.id, name: first.ledgerName });
        Alert.alert(t.createLedger, `${t.missingLedgerPrefix}${first.ledgerName}${t.missingLedgerSuffix}`);
        return;
      }
      const date = journalDate.trim() || todayDateStr;
      const narration = journalNarration.trim() || t.journalDefault;
      const ops: any[] = [];
      if (crResolved.length === 1 && crResolved[0]) {
        const crLedgerId = crResolved[0].id;
        drResolved.forEach((dr, i) => dr && ops.push(addTransaction({ date, debitLedgerId: dr.id, creditLedgerId: crLedgerId, amount: drLines[i].amountNum, narration, voucherType: 'Journal' })));
      } else if (drResolved.length === 1 && drResolved[0]) {
        const drLedgerId = drResolved[0].id;
        crResolved.forEach((cr, i) => cr && ops.push(addTransaction({ date, debitLedgerId: drLedgerId, creditLedgerId: cr.id, amount: crLines[i].amountNum, narration, voucherType: 'Journal' })));
      }
      await Promise.all(ops);
      Alert.alert(t.success, t.savedSuccess, [{ text: 'OK', onPress: () => router.replace('/(tabs)/entries') }]);
    } catch (err) {
      Alert.alert(t.error, t.failedSave);
    } finally {
      endSave();
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: t.addEntry }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={keyboardVerticalOffset}>
        <View style={{ flex: 1 }}>
          <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: 24 + 220 }]} keyboardShouldPersistTaps="handled">
            <View style={styles.modeRow}>
              <TouchableOpacity style={[styles.modeChip, entryType === 'cashBook' && styles.modeChipSelected, isSavingEntry && styles.disabledChip]} onPress={() => setEntryType('cashBook')} disabled={isSavingEntry}>
                <Text style={[styles.modeChipText, entryType === 'cashBook' && styles.modeChipTextSelected]}>{t.cashBook}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modeChip, entryType === 'journal' && styles.modeChipSelected, isSavingEntry && styles.disabledChip]} onPress={() => setEntryType('journal')} disabled={isSavingEntry}>
                <Text style={[styles.modeChipText, entryType === 'journal' && styles.modeChipTextSelected]}>{t.journal}</Text>
              </TouchableOpacity>
            </View>

            {entryType === 'cashBook' ? (
              <CashBookForm t={t} language={language} cashDirection={cashDirection} setCashDirection={setCashDirection} cashDate={cashDate} setCashDate={setCashDate} showCashDatePicker={showCashDatePicker} setShowCashDatePicker={setShowCashDatePicker} otherLedgerId={otherLedgerId} setOtherLedgerId={setOtherLedgerId} otherLedgerQuery={otherLedgerQuery} setOtherLedgerQuery={setOtherLedgerQuery} amount={cashAmount} setAmount={setCashAmount} narration={cashNarration} setNarration={setCashNarration} findMatchingLedgers={findMatchingLedgers} onSave={handleSaveCashBook} onRequestCreateLedger={openCreateLedger} showSuggestions={showCashSuggestions} setShowSuggestions={setShowCashSuggestions} isSaving={isSavingEntry} />
            ) : (
              <JournalForm t={t} language={language} date={journalDate} setDate={setJournalDate} showDatePicker={showJournalDatePicker} setShowDatePicker={setShowJournalDatePicker} narration={journalNarration} setNarration={setJournalNarration} debitLines={debitLines} setDebitLines={setDebitLines} creditLines={creditLines} setCreditLines={setCreditLines} findMatchingLedgers={findMatchingLedgers} onSave={handleSaveJournal} onRequestCreateLedger={openCreateLedger} isSaving={isSavingEntry} />
            )}
          </ScrollView>

          {createCtx && (
            <View style={styles.overlay}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>{t.createLedger}</Text>
                <Text style={styles.modalHint}>{t.createLedgerHint}</Text>
                <Text style={[styles.label, { marginTop: 8 }]}>{t.ledgerName}</Text>
                <TextInput style={styles.input} value={newLedgerName} onChangeText={setNewLedgerName} editable={!isCreatingLedger && ledgerCreateStage !== 'done'} />
                <Text style={[styles.label, { marginTop: 8 }]}>{t.ledgerType}</Text>
                <View style={styles.chipRow}>
                  {['Asset', 'Liability', 'Income', 'Expense'].map((n: any) => (
                    <TouchableOpacity key={n} style={[styles.smallChip, newLedgerNature === n && styles.smallChipSelected, (isCreatingLedger || ledgerCreateStage === 'done') && styles.disabledChip]} onPress={() => setNewLedgerNature(n)} disabled={isCreatingLedger || ledgerCreateStage === 'done'}>
                      <Text style={[styles.smallChipText, newLedgerNature === n && styles.smallChipTextSelected]}>{t[n.toLowerCase()]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[styles.label, { marginTop: 6 }]}>{t.parentCategory}</Text>
                <View style={styles.parentRow}>
                  <Text style={styles.parentHint}>{t.parentHint}</Text>
                  <Switch value={newLedgerIsGroup} onValueChange={setNewLedgerIsGroup} disabled={isCreatingLedger || ledgerCreateStage === 'done'} />
                </View>
                {!newLedgerIsGroup && (
                  <>
                    <Text style={[styles.label, { marginTop: 8 }]}>{t.ledgerName}</Text>
                    <TextInput style={styles.input} value={parentQuery} placeholder={t.parentPlaceholder} placeholderTextColor="#999999" onChangeText={(v) => { setParentQuery(v); setParentLedgerId(undefined); setShowParentSuggestions(true); }} editable={!isCreatingLedger && ledgerCreateStage !== 'done'} />
                    {showParentSuggestions && !isCreatingLedger && (
                      <View style={styles.suggestionBox}>
                        {findMatchingParents(parentQuery).map((p) => (
                          <TouchableOpacity key={p.id ?? `group:${p.name}`} style={styles.suggestionItem} onPress={() => { setParentLedgerId(p.id); setParentQuery(p.name); setShowParentSuggestions(false); }}>
                            <Text style={styles.suggestionText}>{p.name} {!p.isRealLedger ? <Text style={{ color: COLORS.muted, fontSize: 11 }}>{t.standard}</Text> : null}</Text>
                          </TouchableOpacity>
                        ))}
                        {parentQuery.trim() && !resolveParent() && (
                          <View style={styles.suggestionItemCreate}><Text style={styles.suggestionCreateText}>{t.autoCreatePrefix}{parentQuery.trim()}{t.autoCreateSuffix}</Text></View>
                        )}
                      </View>
                    )}
                  </>
                )}
                <View style={styles.modalButtonsRow}>
                  <TouchableOpacity style={[styles.modalButton, styles.modalButtonSecondary]} onPress={() => setCreateCtx(null)} disabled={isCreatingLedger}><Text>{t.cancel}</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.modalButton, styles.modalButtonPrimary]} onPress={handleCreateLedgerSave} disabled={isCreatingLedger}>
                    <Text style={styles.modalButtonPrimaryText}>{ledgerCreateStage === 'creating' ? t.creatingAccounts : ledgerCreateStage === 'done' ? t.accountCreated : t.saveAndUse}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

function CashBookForm({ t, language, ...props }: any) {
  const { cashDirection, setCashDirection, cashDate, setCashDate, showCashDatePicker, setShowCashDatePicker, otherLedgerId, setOtherLedgerId, otherLedgerQuery, setOtherLedgerQuery, amount, setAmount, narration, setNarration, findMatchingLedgers, onSave, onRequestCreateLedger, showSuggestions, setShowSuggestions, isSaving } = props;
  const otherSuggestions = useMemo(() => (showSuggestions ? findMatchingLedgers(otherLedgerQuery) : []), [otherLedgerQuery, findMatchingLedgers, showSuggestions]);
  const hasExactOther = otherLedgerQuery.trim() ? otherSuggestions.some((l: Ledger) => l.name.trim().toLowerCase() === otherLedgerQuery.trim().toLowerCase()) : false;

  return (
    <View style={styles.cashCardOuter}>
      <View style={styles.cashCardInner}>
        <Text style={styles.sectionTitle}>{t.cashBookEntry}</Text>
        <Text style={styles.label}>{t.date}</Text>
        <TouchableOpacity activeOpacity={0.8} onPress={() => setShowCashDatePicker(true)} disabled={isSaving}><TextInput style={styles.input} value={cashDate} editable={false} pointerEvents="none" /></TouchableOpacity>
        {showCashDatePicker && <DateTimePicker mode="date" value={new Date()} onChange={(_:any, d?:Date) => { setShowCashDatePicker(false); if(d) setCashDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`); }} />}
        <View style={styles.cashDirRow}>
          <TouchableOpacity style={[styles.cashDirButton, cashDirection === 'out' && styles.cashDirButtonOutSelected]} onPress={() => setCashDirection('out')}><Text style={[styles.cashDirText, cashDirection === 'out' && styles.cashDirTextSelected]}>{t.cashOut}</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.cashDirButton, cashDirection === 'in' && styles.cashDirButtonInSelected]} onPress={() => setCashDirection('in')}><Text style={[styles.cashDirText, cashDirection === 'in' && styles.cashDirTextSelected]}>{t.cashIn}</Text></TouchableOpacity>
        </View>
        <Text style={styles.label}>{t.particular}</Text>
        <TextInput style={styles.input} value={otherLedgerQuery} placeholder={t.particularPlaceholder} onChangeText={(v) => { setOtherLedgerQuery(v); setOtherLedgerId(undefined); setShowSuggestions(true); }} editable={!isSaving} />
        {showSuggestions && otherLedgerQuery.trim() && (
          <View style={styles.suggestionBox}>
            {otherSuggestions.map((l: Ledger) => (
              <TouchableOpacity key={l.id} style={styles.suggestionItem} onPress={() => { setOtherLedgerId(l.id); setOtherLedgerQuery(getLedgerLabel(l, language)); setShowSuggestions(false); }}><Text>{getLedgerLabel(l, language)}</Text></TouchableOpacity>
            ))}
            {!hasExactOther && <TouchableOpacity style={styles.suggestionItemCreate} onPress={() => { onRequestCreateLedger({ source: 'other', name: otherLedgerQuery.trim() }); setShowSuggestions(false); }}><Text style={styles.suggestionCreateText}>{t.createPlaceholder}{otherLedgerQuery.trim()}"</Text></TouchableOpacity>}
          </View>
        )}
        <Text style={styles.label}>{t.amount}</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={amount} onChangeText={setAmount} editable={!isSaving} />
        <Text style={styles.label}>{t.narration}</Text>
        <TextInput style={[styles.input, { minHeight: 60 }]} multiline value={narration} onChangeText={setNarration} editable={!isSaving} />
        <TouchableOpacity style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} onPress={onSave} disabled={isSaving}><Text style={styles.saveButtonText}>{isSaving ? t.saving : t.saveCash}</Text></TouchableOpacity>
      </View>
    </View>
  );
}

function JournalForm({ t, language, ...props }: any) {
  const { date, setDate, showDatePicker, setShowDatePicker, narration, setNarration, debitLines, setDebitLines, creditLines, setCreditLines, findMatchingLedgers, onSave, onRequestCreateLedger, isSaving } = props;

  const renderLine = (type: 'dr' | 'cr', line: Line, index: number) => {
    const suggestions = line.showSuggestions ? findMatchingLedgers(line.ledgerName) : [];
    return (
      <View key={line.id} style={styles.journalLine}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{type === 'dr' ? `${t.drLedger} ${index + 1}` : `${t.crLedger} ${index + 1}`}</Text>
          <TextInput style={styles.input} value={line.ledgerName} onChangeText={(v) => { const list = type==='dr'?debitLines:creditLines; const setter = type==='dr'?setDebitLines:setCreditLines; setter(list.map((l: Line) => l.id === line.id ? { ...l, ledgerName: v, showSuggestions: true } : l)); }} editable={!isSaving} />
          {line.showSuggestions && line.ledgerName.trim() && (
            <View style={styles.suggestionBox}>
              {suggestions.map((l: Ledger) => (
                <TouchableOpacity key={l.id} style={styles.suggestionItem} onPress={() => { const list = type==='dr'?debitLines:creditLines; const setter = type==='dr'?setDebitLines:setCreditLines; setter(list.map((it: Line) => it.id === line.id ? { ...it, ledgerName: getLedgerLabel(l, language), showSuggestions: false } : it)); }}><Text>{getLedgerLabel(l, language)}</Text></TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        <View style={styles.amountColumn}>
          <Text style={styles.label}>{t.amount}</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={line.amount} onChangeText={(v) => { const list = type==='dr'?debitLines:creditLines; const setter = type==='dr'?setDebitLines:setCreditLines; setter(list.map((l: Line) => l.id === line.id ? { ...l, amount: v } : l)); }} editable={!isSaving} />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{t.journalEntry}</Text>
      <Text style={styles.label}>{t.date}</Text>
      <TouchableOpacity activeOpacity={0.8} onPress={() => setShowDatePicker(true)} disabled={isSaving}><TextInput style={styles.input} value={date} editable={false} pointerEvents="none" /></TouchableOpacity>
      {showDatePicker && <DateTimePicker mode="date" value={new Date()} onChange={(_:any, d?:Date) => { setShowDatePicker(false); if(d) setDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`); }} />}
      <Text style={styles.subTitle}>{t.debit}</Text>
      {debitLines.map((l:any, i:number) => renderLine('dr', l, i))}
      <Text style={styles.subTitle}>{t.credit}</Text>
      {creditLines.map((l:any, i:number) => renderLine('cr', l, i))}
      <Text style={styles.label}>{t.narration}</Text>
      <TextInput style={[styles.input, { minHeight: 60 }]} multiline value={narration} onChangeText={setNarration} editable={!isSaving} />
      <TouchableOpacity style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} onPress={onSave} disabled={isSaving}><Text style={styles.saveButtonText}>{isSaving ? t.saving : t.saveJournal}</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightBg },
  content: { padding: 16, paddingBottom: 24 },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  modeChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#f5f5f5' },
  modeChipSelected: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  modeChipText: { fontSize: 13, color: '#333333' },
  modeChipTextSelected: { color: COLORS.lightBg, fontWeight: '600' },
  disabledChip: { opacity: 0.55 },
  card: { borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 12, backgroundColor: '#fdf7fb' },
  cashCardOuter: { borderRadius: 24, borderWidth: 1.2, borderColor: '#c5c5c5', padding: 6, backgroundColor: '#f1f1f1' },
  cashCardInner: { borderRadius: 18, borderWidth: 1, borderColor: '#d0d0d0', padding: 12, backgroundColor: '#f5f5f5' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.dark, marginBottom: 10 },
  subTitle: { fontSize: 14, fontWeight: '600', color: COLORS.dark, marginTop: 10 },
  label: { fontSize: 12, color: COLORS.dark, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 8, fontSize: 13, color: COLORS.dark, backgroundColor: '#ffffff' },
  cashDirRow: { flexDirection: 'row', gap: 8, marginTop: 8, marginBottom: 8 },
  cashDirButton: { flex: 0, minWidth: 110, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  cashDirButtonOutSelected: { backgroundColor: '#d32f2f', borderColor: '#d32f2f' },
  cashDirButtonInSelected: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  cashDirText: { fontSize: 13, fontWeight: '600', color: '#333333' },
  cashDirTextSelected: { color: '#ffffff' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  smallChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  smallChipSelected: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  smallChipText: { fontSize: 12, color: COLORS.dark },
  smallChipTextSelected: { color: COLORS.lightBg, fontWeight: '600' },
  parentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 2 },
  parentHint: { flex: 1, fontSize: 11, color: COLORS.muted },
  suggestionBox: { marginTop: 4, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#ffffff', overflow: 'hidden' },
  suggestionItem: { paddingHorizontal: 8, paddingVertical: 6 },
  suggestionText: { fontSize: 12, color: COLORS.dark },
  suggestionItemCreate: { paddingHorizontal: 8, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0', backgroundColor: '#fdf7fb' },
  suggestionCreateText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  saveButton: { marginTop: 16, borderRadius: 20, paddingVertical: 10, alignItems: 'center', backgroundColor: '#000000' },
  saveButtonDisabled: { opacity: 0.65 },
  saveButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.lightBg },
  journalLine: { flexDirection: 'row', gap: 8, marginTop: 6 },
  amountColumn: { width: 100 },
  overlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 420, borderRadius: 16, backgroundColor: '#ffffff', padding: 14 },
  modalTitle: { fontSize: 16, fontWeight: '600', color: COLORS.dark },
  modalHint: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  modalButtonsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 14 },
  modalButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18 },
  modalButtonSecondary: { borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#ffffff' },
  modalButtonPrimary: { backgroundColor: COLORS.primary },
  modalButtonPrimaryText: { fontSize: 13, color: COLORS.lightBg, fontWeight: '600' },
});
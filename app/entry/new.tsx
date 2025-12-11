// app/entry/new.tsx
import { Stack, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
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
import type { VoucherType } from '../../src/models/transaction';
import { getLedgerLabel } from '../../src/utils/ledgerLabels';

const COLORS = {
  primary: '#ac0c79',
  dark: '#121212',
  lightBg: '#ffffff',
  accent: '#2e9ff5',
  muted: '#777777',
  border: '#e0e0e0',
  danger: '#d32f2f',
};

type EntryType = 'cashBook' | 'journal';

type Line = {
  id: string;
  ledgerName: string;
  amount: string;
};

type CreateLedgerContext =
  | { source: 'cash'; name: string }
  | { source: 'other'; name: string }
  | { source: 'journal-dr'; lineId: string; name: string }
  | { source: 'journal-cr'; lineId: string; name: string };

// 🔹 Helper: unique ledgers by lower(name)
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
  const settings = useSettings() as any;
  const language: 'en' | 'ja' = settings.language ?? 'en';

  const getLedgerDisplayName = React.useCallback(
    (ledger: Ledger | null | undefined) => {
      if (!ledger) return '';
      return getLedgerLabel(ledger, language);
    },
    [language],
  );

  const [entryType, setEntryType] = useState<EntryType>('cashBook');

  // ----- CASH BOOK STATE -----
  const [cashDirection, setCashDirection] = useState<'in' | 'out'>('out');
  const [cashLedgerId, setCashLedgerId] = useState<string | undefined>();
  const [cashLedgerQuery, setCashLedgerQuery] = useState('');
  const [otherLedgerId, setOtherLedgerId] = useState<string | undefined>();
  const [otherLedgerQuery, setOtherLedgerQuery] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [cashNarration, setCashNarration] = useState('');

  // ----- JOURNAL STATE -----
  const [journalDate, setJournalDate] = useState<string>(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const [journalNarration, setJournalNarration] = useState('');

  const [debitLines, setDebitLines] = useState<Line[]>([
    { id: 'dr-1', ledgerName: '', amount: '' },
  ]);
  const [creditLines, setCreditLines] = useState<Line[]>([
    { id: 'cr-1', ledgerName: '', amount: '' },
  ]);

  const todayDateStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  // ----- CREATE LEDGER POPUP STATE -----
  const [createCtx, setCreateCtx] = useState<CreateLedgerContext | null>(null);
  const [newLedgerName, setNewLedgerName] = useState('');
  const [newLedgerNature, setNewLedgerNature] =
    useState<Ledger['nature']>('Asset'); // Asset / Liability / Income / Expense
  const [newLedgerOpeningAmount, setNewLedgerOpeningAmount] = useState('');
  const [newLedgerOpeningType, setNewLedgerOpeningType] =
    useState<'Dr' | 'Cr'>('Dr');

  const cashLedgers = useMemo(
    () =>
      uniqueByName(
        ledgers.filter((l: Ledger) =>
          ['cash', 'bank'].some((word) =>
            l.name.toLowerCase().includes(word),
          ),
        ),
      ),
    [ledgers],
  );

  const findMatchingLedgers = (query: string): Ledger[] => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return uniqueByName(
      ledgers.filter((l: Ledger) => l.name.toLowerCase().includes(q)),
    ).slice(0, 8);
  };

  const findExistingByExactName = (name: string): Ledger | undefined => {
    const q = name.trim().toLowerCase();
    if (!q) return undefined;
    return ledgers.find(
      (l: Ledger) => l.name.trim().toLowerCase() === q,
    );
  };

  const parseAmount = (v: string): number => {
    const num = parseFloat(v.replace(/,/g, ''));
    return Number.isNaN(num) ? 0 : Math.abs(num);
  };

  // Opening Balance Adjustment ledger finder/creator (async)
  const getOrCreateOpeningLedger = async (): Promise<Ledger> => {
    let opening = ledgers.find(
      (l: Ledger) =>
        l.name.toLowerCase() === 'opening balance adjustment',
    );
    if (opening) return opening;

    const created = await addLedger({
      name: 'Opening Balance Adjustment',
      groupName: 'Capital & Reserves',
      nature: 'Liability',
      isParty: false,
    });

    if (!created) {
      throw new Error('Failed to create Opening Balance Adjustment ledger');
    }

    return created;
  };

  const openCreateLedger = (ctx: CreateLedgerContext) => {
    setCreateCtx(ctx);
    setNewLedgerName(ctx.name);
    setNewLedgerNature('Asset'); // default
    setNewLedgerOpeningAmount('');
    setNewLedgerOpeningType('Dr');
  };

  const handleCreateLedgerCancel = () => {
    setCreateCtx(null);
  };

  const handleCreateLedgerSave = async () => {
    if (!createCtx) return;
    const name = newLedgerName.trim();
    if (!name) {
      Alert.alert('Validation', 'Please enter ledger name.');
      return;
    }

    try {
      const nature = newLedgerNature;
      let groupName: string;
      switch (nature) {
        case 'Asset':
          groupName = 'Assets';
          break;
        case 'Liability':
          groupName = 'Liabilities';
          break;
        case 'Income':
          groupName = 'Income';
          break;
        case 'Expense':
          groupName = 'Expenses';
          break;
        default:
          groupName = 'General';
      }

      const existing = findExistingByExactName(name);
      if (existing) {
        Alert.alert(
          'Already Exists',
          `Ledger "${name}" already exists. Using existing one.`,
        );
        applyCreatedLedger(existing, createCtx);
        setCreateCtx(null);
        return;
      }

      const newLedger = await addLedger({
        name,
        groupName,
        nature,
        isParty: nature === 'Asset' || nature === 'Liability',
      });

      if (!newLedger) {
        Alert.alert('Error', 'Failed to create ledger.');
        return;
      }

      const openingAmountNum = parseAmount(newLedgerOpeningAmount);
      if (openingAmountNum > 0) {
        const openingType = newLedgerOpeningType;
        const openingLedger = await getOrCreateOpeningLedger();
        const date =
          entryType === 'journal' ? journalDate || todayDateStr : todayDateStr;

        if (openingType === 'Dr') {
          // New A/c Dr  To Opening
          await addTransaction({
            date,
            debitLedgerId: newLedger.id,
            creditLedgerId: openingLedger.id,
            amount: openingAmountNum,
            narration: 'Opening balance',
            voucherType: 'Journal',
          });
        } else {
          // Opening Dr  To New A/c
          await addTransaction({
            date,
            debitLedgerId: openingLedger.id,
            creditLedgerId: newLedger.id,
            amount: openingAmountNum,
            narration: 'Opening balance',
            voucherType: 'Journal',
          });
        }
      }

      applyCreatedLedger(newLedger, createCtx);
      setCreateCtx(null);
    } catch (err) {
      console.error('[Ledger] Failed to create ledger', err);
      Alert.alert('Error', 'Failed to create ledger. Please try again.');
    }
  };

  const applyCreatedLedger = (ledger: Ledger, ctx: CreateLedgerContext) => {
    if (ctx.source === 'cash') {
      setCashLedgerId(ledger.id);
      setCashLedgerQuery(ledger.name);
    } else if (ctx.source === 'other') {
      setOtherLedgerId(ledger.id);
      setOtherLedgerQuery(ledger.name);
    } else if (ctx.source === 'journal-dr') {
      setDebitLines((prev: Line[]) =>
        prev.map((l) =>
          l.id === ctx.lineId ? { ...l, ledgerName: ledger.name } : l,
        ),
      );
    } else if (ctx.source === 'journal-cr') {
      setCreditLines((prev: Line[]) =>
        prev.map((l) =>
          l.id === ctx.lineId ? { ...l, ledgerName: ledger.name } : l,
        ),
      );
    }
  };

  // ========== SAVE: CASH BOOK ==========
  const handleSaveCashBook = async () => {
    const amount = parseAmount(cashAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Validation', 'Please enter amount.');
      return;
    }

    // Resolve cash ledger
    let usedCashLedger: Ledger | undefined = undefined;
    if (cashLedgerId) {
      usedCashLedger = ledgers.find((l) => l.id === cashLedgerId);
    }
    if (!usedCashLedger && cashLedgerQuery.trim()) {
      usedCashLedger = findExistingByExactName(cashLedgerQuery);
    }
    if (!usedCashLedger) {
      Alert.alert(
        'Select Cash/Bank',
        'Please select or create a Cash/Bank ledger.',
      );
      return;
    }

    // Resolve other ledger
    let usedOtherLedger: Ledger | undefined = undefined;
    if (otherLedgerId) {
      usedOtherLedger = ledgers.find((l) => l.id === otherLedgerId);
    }
    if (!usedOtherLedger && otherLedgerQuery.trim()) {
      usedOtherLedger = findExistingByExactName(otherLedgerQuery);
    }
    if (!usedOtherLedger) {
      Alert.alert(
        'Select Ledger',
        'Please select or create the other ledger (Rent, Party, etc.).',
      );
      return;
    }

    const date = todayDateStr;
    const narration =
      cashNarration.trim() ||
      (cashDirection === 'out'
        ? `Payment to ${usedOtherLedger.name}`
        : `Receipt from ${usedOtherLedger.name}`);

    const voucherType: VoucherType =
      cashDirection === 'out' ? 'Payment' : 'Receipt';

    try {
      if (cashDirection === 'out') {
        // Other A/c Dr  To Cash/Bank
        await addTransaction({
          date,
          debitLedgerId: usedOtherLedger.id,
          creditLedgerId: usedCashLedger.id,
          amount,
          narration,
          voucherType,
        });
      } else {
        // Cash/Bank Dr  To Other A/c
        await addTransaction({
          date,
          debitLedgerId: usedCashLedger.id,
          creditLedgerId: usedOtherLedger.id,
          amount,
          narration,
          voucherType,
        });
      }

      Alert.alert('Success', 'Entries saved successfully.', [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)/entries'),
        },
      ]);
    } catch (err) {
      console.error('[Entry] Failed to save cash entry', err);
      Alert.alert(
        'Error',
        'Failed to save cash entry. Please check your connection / backend.',
      );
    }
  };

  // ========== SAVE: JOURNAL ==========
  const handleSaveJournal = async () => {
    const drLines = debitLines
      .map((line) => ({
        ...line,
        amountNum: parseAmount(line.amount),
      }))
      .filter((l) => l.ledgerName.trim() && l.amountNum > 0);

    const crLines = creditLines
      .map((line) => ({
        ...line,
        amountNum: parseAmount(line.amount),
      }))
      .filter((l) => l.ledgerName.trim() && l.amountNum > 0);

    if (drLines.length === 0 || crLines.length === 0) {
      Alert.alert(
        'Validation',
        'Please enter at least one debit and one credit line.',
      );
      return;
    }

    const totalDr = drLines.reduce((s, l) => s + l.amountNum, 0);
    const totalCr = crLines.reduce((s, l) => s + l.amountNum, 0);

    if (Math.abs(totalDr - totalCr) > 0.001) {
      Alert.alert(
        'Validation',
        `Debit (¥${totalDr.toLocaleString()}) is not equal to Credit (¥${totalCr.toLocaleString()}).`,
      );
      return;
    }

    if (crLines.length > 1 && drLines.length > 1) {
      Alert.alert(
        'Limitation',
        'Abhi ke liye: ya to multiple Debits with a single Credit, ya multiple Credits with a single Debit supported hai.',
      );
      return;
    }

    const missing: { type: 'dr' | 'cr'; lineId: string; name: string }[] = [];

    const resolveExisting = (
      type: 'dr' | 'cr',
      lineId: string,
      name: string,
    ) => {
      const ledger = findExistingByExactName(name);
      if (!ledger) {
        missing.push({ type, lineId, name });
      }
      return ledger;
    };

    const drResolved = drLines.map((l) => ({
      ...l,
      ledger: resolveExisting('dr', l.id, l.ledgerName),
    }));
    const crResolved = crLines.map((l) => ({
      ...l,
      ledger: resolveExisting('cr', l.id, l.ledgerName),
    }));

    if (missing.length > 0) {
      const first = missing[0];
      const ctx: CreateLedgerContext = {
        source: first.type === 'dr' ? 'journal-dr' : 'journal-cr',
        lineId: first.lineId,
        name: first.name,
      };
      openCreateLedger(ctx);
      Alert.alert(
        'Create Ledger',
        `Ledger "${first.name}" does not exist yet. Please create it first.`,
      );
      return;
    }

    const date = journalDate.trim() || todayDateStr;
    const narration = journalNarration.trim() || 'Journal entry';

    try {
      const ops: Promise<unknown>[] = [];

      if (crResolved.length === 1) {
        // Many Dr → One Cr
        const cr = crResolved[0];
        if (!cr.ledger) return;
        const crLedger = cr.ledger;

        drResolved.forEach((dr) => {
          if (!dr.ledger) return;
          ops.push(
            addTransaction({
              date,
              debitLedgerId: dr.ledger.id,
              creditLedgerId: crLedger.id,
              amount: dr.amountNum,
              narration,
              voucherType: 'Journal',
            }),
          );
        });
      } else if (drResolved.length === 1) {
        // One Dr → Many Cr
        const dr = drResolved[0];
        if (!dr.ledger) return;
        const drLedger = dr.ledger;

        crResolved.forEach((cr) => {
          if (!cr.ledger) return;
          ops.push(
            addTransaction({
              date,
              debitLedgerId: drLedger.id,
              creditLedgerId: cr.ledger.id,
              amount: cr.amountNum,
              narration,
              voucherType: 'Journal',
            }),
          );
        });
      }

      if (ops.length === 0) return;

      await Promise.all(ops);

      Alert.alert('Success', 'Entries saved successfully.', [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)/entries'),
        },
      ]);
    } catch (err) {
      console.error('[Entry] Failed to save journal entry', err);
      Alert.alert(
        'Error',
        'Failed to save journal entry. Please check your connection / backend.',
      );
    }
  };

  const renderChip = (value: EntryType, label: string) => {
    const selected = entryType === value;
    return (
      <TouchableOpacity
        key={value}
        style={[styles.modeChip, selected && styles.modeChipSelected]}
        onPress={() => setEntryType(value)}
        activeOpacity={0.7}
      >
        <Text
          style={[styles.modeChipText, selected && styles.modeChipTextSelected]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  // ---------- UI ----------
  return (
    <>
      <Stack.Screen options={{ title: 'Add Entry' }} />
      <View style={{ flex: 1 }}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.modeRow}>
            {renderChip('cashBook', 'Cash Book')}
            {renderChip('journal', 'Journal')}
          </View>

          {entryType === 'cashBook' ? (
            <CashBookForm
              cashDirection={cashDirection}
              setCashDirection={setCashDirection}
              cashLedgers={cashLedgers}
              cashLedgerId={cashLedgerId}
              setCashLedgerId={setCashLedgerId}
              cashLedgerQuery={cashLedgerQuery}
              setCashLedgerQuery={setCashLedgerQuery}
              otherLedgerId={otherLedgerId}
              setOtherLedgerId={setOtherLedgerId}
              otherLedgerQuery={otherLedgerQuery}
              setOtherLedgerQuery={setOtherLedgerQuery}
              amount={cashAmount}
              setAmount={setCashAmount}
              narration={cashNarration}
              setNarration={setCashNarration}
              findMatchingLedgers={findMatchingLedgers}
              onSave={handleSaveCashBook}
              onRequestCreateLedger={openCreateLedger}
            />
          ) : (
            <JournalForm
              date={journalDate}
              setDate={setJournalDate}
              narration={journalNarration}
              setNarration={setJournalNarration}
              debitLines={debitLines}
              setDebitLines={setDebitLines}
              creditLines={creditLines}
              setCreditLines={setCreditLines}
              findMatchingLedgers={findMatchingLedgers}
              onSave={handleSaveJournal}
              onRequestCreateLedger={openCreateLedger}
            />
          )}
        </ScrollView>

        {/* Create Ledger Overlay */}
        {createCtx && (
          <View style={styles.overlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Create New Ledger</Text>
              <Text style={styles.modalHint}>
                This will be added as a ledger with optional opening balance.
              </Text>

              <Text style={[styles.label, { marginTop: 8 }]}>Ledger Name</Text>
              <TextInput
                style={styles.input}
                value={newLedgerName}
                onChangeText={setNewLedgerName}
              />

              <Text style={[styles.label, { marginTop: 8 }]}>Ledger Type</Text>
              <View style={styles.chipRow}>
                <TouchableOpacity
                  style={[
                    styles.smallChip,
                    newLedgerNature === 'Asset' && styles.smallChipSelected,
                  ]}
                  onPress={() => {
                    setNewLedgerNature('Asset');
                    setNewLedgerOpeningType('Dr');
                  }}
                >
                  <Text
                    style={[
                      styles.smallChipText,
                      newLedgerNature === 'Asset' &&
                        styles.smallChipTextSelected,
                    ]}
                  >
                    Asset
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.smallChip,
                    newLedgerNature === 'Liability' &&
                      styles.smallChipSelected,
                  ]}
                  onPress={() => {
                    setNewLedgerNature('Liability');
                    setNewLedgerOpeningType('Cr');
                  }}
                >
                  <Text
                    style={[
                      styles.smallChipText,
                      newLedgerNature === 'Liability' &&
                        styles.smallChipTextSelected,
                    ]}
                  >
                    Liability
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.smallChip,
                    newLedgerNature === 'Income' && styles.smallChipSelected,
                  ]}
                  onPress={() => {
                    setNewLedgerNature('Income');
                    setNewLedgerOpeningType('Cr');
                  }}
                >
                  <Text
                    style={[
                      styles.smallChipText,
                      newLedgerNature === 'Income' &&
                        styles.smallChipTextSelected,
                    ]}
                  >
                    Income
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.smallChip,
                    newLedgerNature === 'Expense' && styles.smallChipSelected,
                  ]}
                  onPress={() => {
                    setNewLedgerNature('Expense');
                    setNewLedgerOpeningType('Dr');
                  }}
                >
                  <Text
                    style={[
                      styles.smallChipText,
                      newLedgerNature === 'Expense' &&
                        styles.smallChipTextSelected,
                    ]}
                  >
                    Expense
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { marginTop: 8 }]}>
                Opening Balance (optional)
              </Text>
              <View style={styles.openingRow}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={newLedgerOpeningAmount}
                    onChangeText={setNewLedgerOpeningAmount}
                  />
                </View>
                <View style={styles.openingTypeCol}>
                  <TouchableOpacity
                    style={[
                      styles.smallChip,
                      newLedgerOpeningType === 'Dr' &&
                        styles.smallChipSelected,
                    ]}
                    onPress={() => setNewLedgerOpeningType('Dr')}
                  >
                    <Text
                      style={[
                        styles.smallChipText,
                        newLedgerOpeningType === 'Dr' &&
                          styles.smallChipTextSelected,
                      ]}
                    >
                      Dr
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.smallChip,
                      newLedgerOpeningType === 'Cr' &&
                        styles.smallChipSelected,
                    ]}
                    onPress={() => setNewLedgerOpeningType('Cr')}
                  >
                    <Text
                      style={[
                        styles.smallChipText,
                        newLedgerOpeningType === 'Cr' &&
                          styles.smallChipTextSelected,
                      ]}
                    >
                      Cr
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSecondary]}
                  onPress={handleCreateLedgerCancel}
                >
                  <Text style={styles.modalButtonSecondaryText}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={() => {
                    void handleCreateLedgerSave();
                  }}
                >
                  <Text style={styles.modalButtonPrimaryText}>
                    Save & Use
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </>
  );
}

// ===== CASH BOOK FORM =====
type CashBookProps = {
  cashDirection: 'in' | 'out';
  setCashDirection: (v: 'in' | 'out') => void;
  cashLedgers: Ledger[];
  cashLedgerId?: string;
  setCashLedgerId: (id?: string) => void;
  cashLedgerQuery: string;
  setCashLedgerQuery: (v: string) => void;
  otherLedgerId?: string;
  setOtherLedgerId: (id?: string) => void;
  otherLedgerQuery: string;
  setOtherLedgerQuery: (v: string) => void;
  amount: string;
  setAmount: (v: string) => void;
  narration: string;
  setNarration: (v: string) => void;
  findMatchingLedgers: (q: string) => Ledger[];
  onSave: () => void | Promise<void>;
  onRequestCreateLedger: (ctx: CreateLedgerContext) => void;
};

function CashBookForm(props: CashBookProps) {
  const {
    cashDirection,
    setCashDirection,
    cashLedgers,
    cashLedgerId,
    setCashLedgerId,
    cashLedgerQuery,
    setCashLedgerQuery,
    otherLedgerId,
    setOtherLedgerId,
    otherLedgerQuery,
    setOtherLedgerQuery,
    amount,
    setAmount,
    narration,
    setNarration,
    findMatchingLedgers,
    onSave,
    onRequestCreateLedger,
  } = props;

  const cashSuggestions = useMemo(
    () =>
      cashLedgerQuery
        ? cashLedgers
            .filter((l: Ledger) =>
              l.name.toLowerCase().includes(
                cashLedgerQuery.toLowerCase(),
              ),
            )
            .slice(0, 6)
        : [],
    [cashLedgerQuery, cashLedgers],
  );

  const otherSuggestions = useMemo(
    () => findMatchingLedgers(otherLedgerQuery),
    [otherLedgerQuery, findMatchingLedgers],
  );

  const hasExactCash = cashLedgerQuery.trim().length
    ? cashLedgers.some(
        (l: Ledger) =>
          l.name.trim().toLowerCase() ===
          cashLedgerQuery.trim().toLowerCase(),
      )
    : false;

  const hasExactOther = otherLedgerQuery.trim().length
    ? otherSuggestions.some(
        (l: Ledger) =>
          l.name.trim().toLowerCase() ===
          otherLedgerQuery.trim().toLowerCase(),
      )
    : false;

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Cash Book Entry</Text>

      <View style={styles.chipRow}>
        <TouchableOpacity
          style={[
            styles.smallChip,
            cashDirection === 'in' && styles.smallChipSelected,
          ]}
          onPress={() => setCashDirection('in')}
        >
          <Text
            style={[
              styles.smallChipText,
              cashDirection === 'in' && styles.smallChipTextSelected,
            ]}
          >
            Cash In
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.smallChip,
            cashDirection === 'out' && styles.smallChipSelected,
          ]}
          onPress={() => setCashDirection('out')}
        >
          <Text
            style={[
              styles.smallChipText,
              cashDirection === 'out' && styles.smallChipTextSelected,
            ]}
          >
            Cash Out
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Cash / Bank A/C</Text>
      <TextInput
        style={styles.input}
        value={cashLedgerQuery}
        onChangeText={(v) => {
          setCashLedgerQuery(v);
          setCashLedgerId(undefined);
        }}
      />
      {cashLedgerQuery.trim().length > 0 &&
        (!hasExactCash || cashSuggestions.length > 0) && (
          <View style={styles.suggestionBox}>
            {cashSuggestions.map((ledger: Ledger) => (
              <TouchableOpacity
                key={ledger.id}
                style={styles.suggestionItem}
                onPress={() => {
                  setCashLedgerId(ledger.id);
                  setCashLedgerQuery(ledger.name);
                }}
              >
                <Text style={styles.suggestionText}>{ledger.name}</Text>
              </TouchableOpacity>
            ))}
            {!hasExactCash && cashLedgerQuery.trim().length > 0 && (
              <TouchableOpacity
                style={styles.suggestionItemCreate}
                onPress={() =>
                  onRequestCreateLedger({
                    source: 'cash',
                    name: cashLedgerQuery.trim(),
                  })
                }
              >
                <Text style={styles.suggestionCreateText}>
                  + Create "{cashLedgerQuery.trim()}" as new ledger
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

      <Text style={[styles.label, { marginTop: 10 }]}>Particular A/C</Text>
      <TextInput
        style={styles.input}
        value={otherLedgerQuery}
        onChangeText={(v) => {
          setOtherLedgerQuery(v);
          setOtherLedgerId(undefined);
        }}
      />
      {otherLedgerQuery.trim().length > 0 &&
        (!hasExactOther || otherSuggestions.length > 0) && (
          <View style={styles.suggestionBox}>
            {otherSuggestions.map((ledger: Ledger) => (
              <TouchableOpacity
                key={ledger.id}
                style={styles.suggestionItem}
                onPress={() => {
                  setOtherLedgerId(ledger.id);
                  setOtherLedgerQuery(ledger.name);
                }}
              >
                <Text style={styles.suggestionText}>{ledger.name}</Text>
              </TouchableOpacity>
            ))}
            {!hasExactOther && otherLedgerQuery.trim().length > 0 && (
              <TouchableOpacity
                style={styles.suggestionItemCreate}
                onPress={() =>
                  onRequestCreateLedger({
                    source: 'other',
                    name: otherLedgerQuery.trim(),
                  })
                }
              >
                <Text style={styles.suggestionCreateText}>
                  + Create "{otherLedgerQuery.trim()}" as new ledger
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

      <Text style={[styles.label, { marginTop: 10 }]}>Amount</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      <Text style={[styles.label, { marginTop: 10 }]}>Narration</Text>
      <TextInput
        style={[styles.input, { minHeight: 60 }]}
        multiline
        value={narration}
        onChangeText={setNarration}
      />

      <TouchableOpacity style={styles.saveButton} onPress={() => void onSave()}>
        <Text style={styles.saveButtonText}>Save Cash Entry</Text>
      </TouchableOpacity>
    </View>
  );
}

// ===== JOURNAL FORM =====
type JournalProps = {
  date: string;
  setDate: (v: string) => void;
  narration: string;
  setNarration: (v: string) => void;
  debitLines: Line[];
  setDebitLines: (ls: Line[]) => void;
  creditLines: Line[];
  setCreditLines: (ls: Line[]) => void;
  findMatchingLedgers: (q: string) => Ledger[];
  onSave: () => void | Promise<void>;
  onRequestCreateLedger: (ctx: CreateLedgerContext) => void;
};

function JournalForm(props: JournalProps) {
  const {
    date,
    setDate,
    narration,
    setNarration,
    debitLines,
    setDebitLines,
    creditLines,
    setCreditLines,
    findMatchingLedgers,
    onSave,
    onRequestCreateLedger,
  } = props;

  const updateLine = (
    type: 'dr' | 'cr',
    id: string,
    patch: Partial<Line>,
  ) => {
    if (type === 'dr') {
      const updated = debitLines.map((l) =>
        l.id === id ? { ...l, ...patch } : l,
      );
      setDebitLines(updated);
    } else {
      const updated = creditLines.map((l) =>
        l.id === id ? { ...l, ...patch } : l,
      );
      setCreditLines(updated);
    }
  };

  const addLine = (type: 'dr' | 'cr') => {
    const id = `${type}-${Date.now()}`;
    const newLine: Line = { id, ledgerName: '', amount: '' };
    if (type === 'dr') {
      setDebitLines([...debitLines, newLine]);
    } else {
      setCreditLines([...creditLines, newLine]);
    }
  };

  const removeLine = (type: 'dr' | 'cr', id: string) => {
    if (type === 'dr') {
      if (debitLines.length === 1) return;
      setDebitLines(debitLines.filter((l) => l.id !== id));
    } else {
      if (creditLines.length === 1) return;
      setCreditLines(creditLines.filter((l) => l.id !== id));
    }
  };

  const renderLine = (type: 'dr' | 'cr', line: Line, index: number) => {
    const suggestions = findMatchingLedgers(line.ledgerName);
    const hasExact =
      line.ledgerName.trim().length > 0
        ? suggestions.some(
            (l: Ledger) =>
              l.name.trim().toLowerCase() ===
              line.ledgerName.trim().toLowerCase(),
          )
        : false;

    return (
      <View key={line.id} style={styles.journalLine}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>
            {type === 'dr' ? `Dr Ledger ${index + 1}` : `Cr Ledger ${index + 1}`}
          </Text>
          <TextInput
            style={styles.input}
            value={line.ledgerName}
            onChangeText={(v) => updateLine(type, line.id, { ledgerName: v })}
          />
          {line.ledgerName.trim().length > 0 &&
            (!hasExact || suggestions.length > 0) && (
              <View style={styles.suggestionBox}>
                {suggestions.map((ledger: Ledger) => (
                  <TouchableOpacity
                    key={ledger.id}
                    style={styles.suggestionItem}
                    onPress={() =>
                      updateLine(type, line.id, { ledgerName: ledger.name })
                    }
                  >
                    <Text style={styles.suggestionText}>{ledger.name}</Text>
                  </TouchableOpacity>
                ))}
                {!hasExact && line.ledgerName.trim().length > 0 && (
                  <TouchableOpacity
                    style={styles.suggestionItemCreate}
                    onPress={() =>
                      onRequestCreateLedger({
                        source: type === 'dr' ? 'journal-dr' : 'journal-cr',
                        lineId: line.id,
                        name: line.ledgerName.trim(),
                      })
                    }
                  >
                    <Text style={styles.suggestionCreateText}>
                      + Create "{line.ledgerName.trim()}" as new ledger
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
        </View>

        <View style={styles.amountColumn}>
          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={line.amount}
            onChangeText={(v) => updateLine(type, line.id, { amount: v })}
          />
          <TouchableOpacity
            style={styles.removeLineBtn}
            onPress={() => removeLine(type, line.id)}
          >
            <Text style={styles.removeLineText}>×</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const totalDr = debitLines.reduce(
    (s, l) => s + (parseFloat(l.amount || '0') || 0),
    0,
  );
  const totalCr = creditLines.reduce(
    (s, l) => s + (parseFloat(l.amount || '0') || 0),
    0,
  );

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Journal Entry</Text>

      <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} value={date} onChangeText={setDate} />

      <Text style={[styles.subTitle, { marginTop: 10 }]}>Debit</Text>
      {debitLines.map((line, index) => renderLine('dr', line, index))}
      <TouchableOpacity
        style={styles.addLineButton}
        onPress={() => addLine('dr')}
      >
        <Text style={styles.addLineText}>+ Add Debit Line</Text>
      </TouchableOpacity>

      <Text style={[styles.subTitle, { marginTop: 16 }]}>Credit</Text>
      {creditLines.map((line, index) => renderLine('cr', line, index))}
      <TouchableOpacity
        style={styles.addLineButton}
        onPress={() => addLine('cr')}
      >
        <Text style={styles.addLineText}>+ Add Credit Line</Text>
      </TouchableOpacity>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total Dr:</Text>
        <Text style={styles.totalValue}>
          ¥{totalDr.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </Text>
      </View>
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total Cr:</Text>
        <Text style={styles.totalValue}>
          ¥{totalCr.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </Text>
      </View>
      {Math.abs(totalDr - totalCr) > 0.001 && (
        <Text style={styles.mismatchText}>
          Dr and Cr totals must be equal for a valid journal.
        </Text>
      )}

      <Text style={[styles.label, { marginTop: 10 }]}>Narration</Text>
      <TextInput
        style={[styles.input, { minHeight: 60 }]}
        multiline
        value={narration}
        onChangeText={setNarration}
      />

      <TouchableOpacity style={styles.saveButton} onPress={() => void onSave()}>
        <Text style={styles.saveButtonText}>Save Journal Entry</Text>
      </TouchableOpacity>
    </View>
  );
}

// ===== STYLES =====
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  modeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modeChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  modeChipText: {
    fontSize: 13,
    color: COLORS.dark,
  },
  modeChipTextSelected: {
    color: COLORS.lightBg,
    fontWeight: '600',
  },

  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    backgroundColor: '#fdf7fb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  label: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.dark,
    backgroundColor: '#ffffff',
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap', // so 4 chips (Asset/Liability/Income/Expense) wrap nicely
    gap: 8,
    marginBottom: 10,
  },
  smallChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  smallChipSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  smallChipText: {
    fontSize: 12,
    color: COLORS.dark,
  },
  smallChipTextSelected: {
    color: COLORS.lightBg,
    fontWeight: '600',
  },

  suggestionBox: {
    marginTop: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  suggestionText: {
    fontSize: 12,
    color: COLORS.dark,
  },
  suggestionItemCreate: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fdf7fb',
  },
  suggestionCreateText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },

  saveButton: {
    marginTop: 16,
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: COLORS.dark,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.lightBg,
  },

  journalLine: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  amountColumn: {
    width: 100,
  },
  addLineButton: {
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addLineText: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '500',
  },
  removeLineBtn: {
    marginTop: 4,
    alignSelf: 'flex-end',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  removeLineText: {
    fontSize: 16,
    color: COLORS.danger,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  totalLabel: {
    fontSize: 12,
    color: COLORS.dark,
  },
  totalValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  mismatchText: {
    marginTop: 4,
    fontSize: 11,
    color: COLORS.danger,
  },

  // Overlay
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    padding: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },
  modalHint: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  openingRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    alignItems: 'center',
  },
  openingTypeCol: {
    width: 70,
    gap: 4,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 14,
  },
  modalButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  modalButtonSecondary: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#ffffff',
  },
  modalButtonPrimary: {
    backgroundColor: COLORS.primary,
  },
  modalButtonSecondaryText: {
    fontSize: 13,
    color: COLORS.dark,
  },
  modalButtonPrimaryText: {
    fontSize: 13,
    color: COLORS.lightBg,
    fontWeight: '600',
  },
});

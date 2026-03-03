// app/ledger/[id].tsx
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { useData } from '../../src/context/AppDataContext';
import type { Ledger } from '../../src/models/ledger';
import type { Transaction } from '../../src/models/transaction';

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

type LedgerLine = {
  id: string;
  date: string;
  particular: string;
  remarks: string;
  debit: number;
  credit: number;
  balance: number;
  isSyntheticOpening?: boolean;
  targetLedgerId?: string; // group rows click
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

function formatBalance(value: number): string {
  if (value === 0) return '0';
  const side = value > 0 ? 'Dr' : 'Cr';
  return `${formatNumberWithOptionalDecimals(Math.abs(value))} ${side}`;
}

function parseDateString(value: string): Date {
  if (!value) return new Date();
  const [y, m, d] = value.split('-').map((v) => parseInt(v, 10));
  if (!y || !m || !d) return new Date();
  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime())) return new Date();
  return dt;
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

  // ✅ GROUP MODE: if this ledger is a parent/group OR has children
  const isGroupView = useMemo(() => {
    if (!ledger) return false;
    if (!!ledger.isGroup) return true;
    // ✅ children check uses categoryLedgerId (DB naming)
    return ledgers.some((l) => (l.categoryLedgerId ?? null) === ledger.id);
  }, [ledger, ledgers]);

  const effectiveToDate = useMemo(() => {
    return toDate || formatDateToInput(new Date());
  }, [toDate]);

  // ✅ GROUP SUMMARY: 1 row per child ledger (period totals + closing as-on date)
  const groupLines: LedgerLine[] = useMemo(() => {
    if (!ledger || !isGroupView) return [];

    const children = ledgers
      .filter((l) => (l.categoryLedgerId ?? null) === ledger.id)
      .sort((a, b) => a.name.localeCompare(b.name));

    if (children.length === 0) return [];

    const inPeriod = (dateStr: string) => {
      const d = normalizeDate(dateStr);
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;
      return true;
    };

    const onOrBeforeTo = (dateStr: string) => {
      const d = normalizeDate(dateStr);
      return d <= effectiveToDate;
    };

    return children.map((child) => {
      let periodDebit = 0;
      let periodCredit = 0;
      let closing = 0;

      for (const t of transactions as Transaction[]) {
        const dt = normalizeDate(t.date);

        if (inPeriod(dt)) {
          if (t.debitLedgerId === child.id) periodDebit += t.amount;
          if (t.creditLedgerId === child.id) periodCredit += t.amount;
        }

        if (onOrBeforeTo(dt)) {
          if (t.debitLedgerId === child.id) closing += t.amount;
          if (t.creditLedgerId === child.id) closing -= t.amount;
        }
      }

      return {
        id: `child-${child.id}`,
        date: effectiveToDate,
        particular: child.name,
        remarks: child.groupName || '',
        debit: periodDebit,
        credit: periodCredit,
        balance: closing,
        targetLedgerId: child.id,
      };
    });
  }, [ledger, isGroupView, ledgers, transactions, fromDate, toDate, effectiveToDate]);

  // NORMAL ledger baseLines
  const baseLines: BaseLine[] = useMemo(() => {
    if (!ledger) return [];
    if (isGroupView) return [];

    const ledgerTx = transactions.filter(
      (t: Transaction) => t.debitLedgerId === ledger.id || t.creditLedgerId === ledger.id,
    );

    return ledgerTx.map((t: Transaction) => {
      const isDebit = t.debitLedgerId === ledger.id;
      const otherLedgerId = isDebit ? t.creditLedgerId : t.debitLedgerId;
      const otherLedger = ledgers.find((l: Ledger) => l.id === otherLedgerId) ?? null;

      const otherName = otherLedger ? otherLedger.name : otherLedgerId;
      const isOpeningTx =
        (otherLedger?.name || '').toLowerCase().includes('opening balance') ||
        otherName.toLowerCase() === OPENING_LEDGER_LABEL.toLowerCase();

      return {
        id: t.id,
        date: normalizeDate(t.date),
        particular: otherName,
        remarks: t.narration || '',
        debit: isDebit ? t.amount : 0,
        credit: !isDebit ? t.amount : 0,
        isOpeningTx,
      };
    });
  }, [ledger, isGroupView, ledgers, transactions]);

  const openingBalance = useMemo(() => {
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
      openingBalance !== 0
        ? {
            id: 'opening-balance-bf',
            date: '',
            particular: OPENING_LEDGER_LABEL,
            remarks: '',
            debit: openingBalance > 0 ? openingBalance : 0,
            credit: openingBalance < 0 ? Math.abs(openingBalance) : 0,
            balance: openingBalance,
            isSyntheticOpening: true,
          }
        : null;

    let running = openingBalance;
    const withBalance: LedgerLine[] = ordered.map((line) => {
      running += line.debit - line.credit;
      return { ...line, balance: running };
    });

    return openingRow ? [openingRow, ...withBalance] : withBalance;
  }, [ledger, isGroupView, groupLines, baseLines, fromDate, toDate, openingBalance]);

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
        <Stack.Screen options={{ title: 'Ledger' }} />
        <View style={[styles.container, styles.notFoundContainer]}>
          <Text style={styles.notFoundText}>Ledger not found.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleOpenMaster = () => setShowMaster(true);

  const handleSaveMaster = async () => {
    const name = editName.trim();
    const groupName = editGroupName.trim();

    if (!name) return Alert.alert('Validation', 'Please enter ledger name.');
    if (!groupName) return Alert.alert('Validation', 'Please enter sub-category / group name.');

    try {
      setSaving(true);
      await updateLedger(ledger.id, {
        name,
        groupName,
        nature: editNature,
        isParty: editIsParty,
      });

      Alert.alert('Saved', 'Ledger master updated successfully.');
      setShowMaster(false);
    } catch (err: any) {
      console.error('[LedgerDetail] update failed', err);
      Alert.alert('Error', err?.message || 'Failed to update ledger. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLedger = () => {
    Alert.alert(
      'Delete Ledger?',
      'This will delete the ledger master. You can only delete if it has no entries.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLedger(ledger.id);
              Alert.alert('Deleted', 'Ledger deleted.', [
                { text: 'OK', onPress: () => router.replace('/(tabs)/ledgers') },
              ]);
            } catch (err: any) {
              Alert.alert('Cannot delete', err?.message || 'This ledger has entries or could not be deleted.');
            }
          },
        },
      ],
    );
  };

  const renderNatureChip = (value: Ledger['nature'], label: string) => {
    const selected = editNature === value;
    return (
      <TouchableOpacity
        key={value}
        style={[styles.natureChip, selected && styles.natureChipSelected]}
        onPress={() => setEditNature(value)}
        activeOpacity={0.7}
      >
        <Text style={[styles.natureChipText, selected && styles.natureChipTextSelected]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const closingBalanceText =
    closingBalanceValue === 0
      ? '0'
      : `${formatAmount(Math.abs(closingBalanceValue))} ${closingBalanceValue > 0 ? 'Dr' : 'Cr'}`;

  const openDatePicker = (target: 'from' | 'to') => {
    setDatePickerTarget(target);
    const base = target === 'from' ? parseDateString(fromDate) : parseDateString(toDate);
    setPickerDate(base);
    setShowDatePicker(true);
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (!date || event?.type !== 'set') return;

    const value = formatDateToInput(date);
    if (datePickerTarget === 'from') setFromDate(value);
    else setToDate(value);
  };

  const openChildLedger = (childId?: string) => {
    if (!childId) return;
    router.push({ pathname: '/ledger/[id]', params: { id: childId } });
  };

  // ---- PDF export same as your existing (unchanged logic) ----
  const handleExportPdf = async () => {
    try {
      if (lines.length === 0) {
        Alert.alert('Export', 'No entries for this period to export.');
        return;
      }

      const safeName = ledger.name.replace(/[^\w\-]+/g, '_') || 'ledger';
      const fromLabel = fromDate || 'start';
      const toLabel = toDate || 'today';
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
          <td style="text-align:right;">${formatBalance(line.balance)}</td>
        </tr>
      `,
        )
        .join('\n');

      const html = `
        <!doctype html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Ledger Statement</title>
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
            <div class="stmt-title">LEDGER STATEMENT</div>
            <div class="ledger-title">${ledger.name}</div>
            <div class="ledger-meta">${ledger.groupName} · ${ledger.nature}</div>
            <div class="period">Period: ${fromDate || 'Beginning'} ～ ${toDate || 'Today'}</div>
            <div class="closing">Closing balance: ${closingBalanceText}</div>

            <table>
              <thead>
                <tr>
                  <th style="width:16%;">Date</th>
                  <th style="width:40%;">Particulars</th>
                  <th style="width:14%; text-align:right;">Dr</th>
                  <th style="width:14%; text-align:right;">Cr</th>
                  <th style="width:16%; text-align:right;">Balance</th>
                </tr>
              </thead>
              <tbody>${rowsHtml}</tbody>
              <tfoot>
                <tr>
                  <td></td>
                  <td>TOTAL</td>
                  <td class="amount">${formatNumberWithOptionalDecimals(totals.debit)}</td>
                  <td class="amount">${formatNumberWithOptionalDecimals(totals.credit)}</td>
                  <td class="amount">${formatBalance(closingBalanceValue)}</td>
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
        Alert.alert('Export', `PDF created at: ${targetUri}\n(Sharing is not available on this device)`);
        return;
      }

      await Sharing.shareAsync(targetUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share ledger statement PDF',
      });
    } catch (err) {
      console.error('[LedgerDetail] PDF export failed', err);
      Alert.alert('Error', 'Failed to export ledger as PDF. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Stack.Screen options={{ title: ledger.name }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.printHeaderCard}>
          <Text style={styles.appNameText}>MobiLedger</Text>
          <Text style={styles.statementTitle}>LEDGER STATEMENT</Text>

          <TouchableOpacity onPress={handleOpenMaster} activeOpacity={0.7}>
            <Text style={styles.ledgerTitleText}>{ledger.name}</Text>
          </TouchableOpacity>

          <Text style={styles.ledgerMetaText}>
            {ledger.groupName} · {ledger.nature}
          </Text>

          <View style={styles.headerBottomRow}>
            <Text style={styles.headerSmallLabel}>
              Closing balance: <Text style={styles.headerBalanceText}>{closingBalanceText}</Text>
            </Text>
          </View>
        </View>

        <View style={styles.filterCard}>
          <Text style={styles.filterTitle}>Period</Text>
          <View style={styles.filterRow}>
            <View style={styles.filterCol}>
              <Text style={styles.filterLabel}>From</Text>
              <TouchableOpacity style={styles.filterInputButton} onPress={() => openDatePicker('from')}>
                <Text style={fromDate ? styles.filterInputText : styles.filterInputPlaceholder}>
                  {fromDate || 'Select date'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.filterCol}>
              <Text style={styles.filterLabel}>To</Text>
              <TouchableOpacity style={styles.filterInputButton} onPress={() => openDatePicker('to')}>
                <Text style={toDate ? styles.filterInputText : styles.filterInputPlaceholder}>
                  {toDate || 'Select date'}
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
              <Text style={styles.filterClearText}>Clear</Text>
            </TouchableOpacity>

            <View style={styles.exportRow}>
              <TouchableOpacity style={styles.exportButton} onPress={() => void handleExportPdf()}>
                <Text style={styles.exportButtonText}>Export PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.tableCard}>
          <View style={styles.tableTopBorders}>
            <View style={styles.tableTopLine} />
            <View style={[styles.tableTopLine, { marginTop: 2 }]} />
          </View>

          <View style={styles.tableHeader}>
            <Text style={[styles.colDate, styles.tableHeaderText]}>Date</Text>
            <Text style={[styles.colParticular, styles.tableHeaderText]}>Particulars</Text>
            <Text style={[styles.colAmount, styles.tableHeaderText, styles.right]}>Dr</Text>
            <Text style={[styles.colAmount, styles.tableHeaderText, styles.right]}>Cr</Text>
            <Text style={[styles.colBalance, styles.tableHeaderText, styles.right]}>Balance</Text>
          </View>

          {lines.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                {isGroupView ? 'No child ledgers found under this parent.' : 'No entries for this period.'}
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
                      onPress={() => openChildLedger(line.targetLedgerId)}
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
                      <Text style={[styles.amountText, styles.right]}>{formatBalance(line.balance)}</Text>
                    </View>
                  </RowWrap>
                );
              })}

              <View style={[styles.tableRow, styles.totalRow]}>
                <View style={styles.colDate} />
                <View style={styles.particularCell}>
                  <Text style={styles.totalLabel}>TOTAL</Text>
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
                    {formatBalance(closingBalanceValue)}
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
          onChange={handleDateChange}
        />
      )}

      {showMaster && (
        <View style={styles.overlay}>
          <View style={styles.masterCard}>
            <Text style={styles.masterTitle}>Ledger Master</Text>
            <Text style={styles.masterHint}>Edit name, category and sub-category for this ledger.</Text>

            <Text style={[styles.masterLabel, { marginTop: 8 }]}>Ledger Name</Text>
            <TextInput style={styles.masterInput} value={editName} onChangeText={setEditName} />

            <Text style={[styles.masterLabel, { marginTop: 8 }]}>Category (Nature)</Text>
            <View style={styles.natureRow}>
              {renderNatureChip('Asset', 'Asset')}
              {renderNatureChip('Liability', 'Liability')}
              {renderNatureChip('Income', 'Income')}
              {renderNatureChip('Expense', 'Expense')}
            </View>

            <Text style={[styles.masterLabel, { marginTop: 8 }]}>Sub-category / Group</Text>
            <TextInput
              style={styles.masterInput}
              value={editGroupName}
              onChangeText={setEditGroupName}
              placeholder="e.g. Sundry Creditors, Bank A/c, Rent Expenses"
            />

            <View style={styles.partyRow}>
              <Text style={styles.masterLabel}>Treat as Party A/c</Text>
              <Switch value={editIsParty} onValueChange={setEditIsParty} />
            </View>

            <View style={styles.masterButtonsRow}>
              <TouchableOpacity
                style={[styles.masterButton, styles.masterDeleteButton]}
                onPress={handleDeleteLedger}
              >
                <Text style={styles.masterDeleteText}>Delete</Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[styles.masterButton, styles.masterCancelButton]}
                  onPress={() => setShowMaster(false)}
                >
                  <Text style={styles.masterCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.masterButton, styles.masterSaveButton, saving && { opacity: 0.6 }]}
                  onPress={() => !saving && void handleSaveMaster()}
                >
                  <Text style={styles.masterSaveText}>{saving ? 'Saving…' : 'Save'}</Text>
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
  tableTopBorders: { marginBottom: 6 },
  tableTopLine: { height: 1, backgroundColor: '#000000', width: '100%' },

  tableHeader: { flexDirection: 'row', borderTopWidth: 2, borderTopColor: '#000000', borderBottomWidth: 2, borderBottomColor: '#000000', paddingBottom: 4, marginBottom: 4 },
  colDate: { flex: 1.1 },
  colParticular: { flex: 2.4 },
  colAmount: { flex: 1 },
  colBalance: { flex: 1.1 },
  tableHeaderText: { fontSize: 11, fontWeight: '700', color: COLORS.dark },

  tableRow: { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.5)' },

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
  amountText: { fontSize: 12, color: COLORS.dark },
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
  masterInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 7, fontSize: 13, color: COLORS.dark, backgroundColor: COLORS.lightBg },
  natureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  natureChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  natureChipSelected: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  natureChipText: { fontSize: 12, color: COLORS.dark },
  natureChipTextSelected: { color: COLORS.lightBg, fontWeight: '600' },
  partyRow: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  masterButtonsRow: { marginTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  masterButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18 },
  masterDeleteButton: { borderWidth: 1, borderColor: '#ffe0e0', backgroundColor: '#fff4f4' },
  masterDeleteText: { fontSize: 13, color: COLORS.danger, fontWeight: '600' },
  masterCancelButton: { borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#ffffff' },
  masterCancelText: { fontSize: 13, color: COLORS.dark },
  masterSaveButton: { backgroundColor: COLORS.primary },
  masterSaveText: { fontSize: 13, color: COLORS.lightBg, fontWeight: '600' },
});

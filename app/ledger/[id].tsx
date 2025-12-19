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

type LedgerLine = {
  id: string;
  date: string;
  particular: string;
  remarks: string;
  debit: number;
  credit: number;
  balance: number; // running balance (Dr +, Cr -)
};

/**
 * 1000       -> "1,000"
 * 1000.5     -> "1,000.50"
 * 5646.36    -> "5,646.36"
 * 0 / NaN    -> "0"
 */
function formatNumberWithOptionalDecimals(value: number): string {
  const n = Number(value) || 0;
  const isInt = Math.abs(n - Math.round(n)) < 1e-9;

  if (isInt) {
    return Math.round(n).toLocaleString(undefined, {
      maximumFractionDigits: 0,
    });
  }

  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatAmount(value: number): string {
  if (!value) return '¥0';
  return `¥${formatNumberWithOptionalDecimals(Math.abs(value))}`;
}

// Balance display helper: 1,000 Dr / 500 Cr / 0
function formatBalance(value: number): string {
  if (value === 0) return '0';
  const side = value > 0 ? 'Dr' : 'Cr';
  return `${formatNumberWithOptionalDecimals(Math.abs(value))} ${side}`;
}

// Small helper: YYYY-MM-DD string → Date (fallback = today)
function parseDateString(value: string): Date {
  if (!value) return new Date();
  const [y, m, d] = value.split('-').map((v) => parseInt(v, 10));
  if (!y || !m || !d) return new Date();
  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime())) return new Date();
  return dt;
}

// Helper: Date → YYYY-MM-DD
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

  // Calendar state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<'from' | 'to'>(
    'from',
  );
  const [pickerDate, setPickerDate] = useState<Date>(new Date());

  // ---------- Ledger master modal state ----------
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

  const lines: LedgerLine[] = useMemo(() => {
    if (!ledger) return [];

    const ledgerTx = transactions.filter(
      (t: Transaction) =>
        t.debitLedgerId === ledger.id || t.creditLedgerId === ledger.id,
    );

    const mappedBase = ledgerTx.map((t: Transaction) => {
      const isDebit = t.debitLedgerId === ledger.id;
      const otherLedgerId = isDebit ? t.creditLedgerId : t.debitLedgerId;
      const otherLedger =
        ledgers.find((l: Ledger) => l.id === otherLedgerId) ?? null;

      return {
        id: t.id,
        date: normalizeDate(t.date),
        particular: otherLedger ? otherLedger.name : otherLedgerId,
        remarks: t.narration || '',
        debit: isDebit ? t.amount : 0,
        credit: !isDebit ? t.amount : 0,
      };
    });

    const filtered = mappedBase.filter((line) => {
      if (fromDate && line.date < fromDate) return false;
      if (toDate && line.date > toDate) return false;
      return true;
    });

    filtered.sort((a, b) => {
      if (a.date === b.date) return a.id.localeCompare(b.id);
      return a.date < b.date ? -1 : 1;
    });

    // 🔹 Running balance: Dr positive, Cr negative
    let running = 0;
    const withBalance: LedgerLine[] = filtered.map((line) => {
      running += line.debit - line.credit;
      return {
        ...line,
        balance: running,
      };
    });

    return withBalance;
  }, [ledger, ledgers, transactions, fromDate, toDate]);

  const totals = useMemo(() => {
    return lines.reduce(
      (acc, line) => {
        acc.debit += line.debit;
        acc.credit += line.credit;
        return acc;
      },
      { debit: 0, credit: 0 },
    );
  }, [lines]);

  if (!ledger) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <Stack.Screen options={{ title: 'Ledger' }} />
        <View style={[styles.container, styles.notFoundContainer]}>
          <Text style={styles.notFoundText}>Ledger not found.</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleOpenMaster = () => {
    setShowMaster(true);
  };

  const handleSaveMaster = async () => {
    if (!ledger) return;
    const name = editName.trim();
    const groupName = editGroupName.trim();

    if (!name) {
      Alert.alert('Validation', 'Please enter ledger name.');
      return;
    }
    if (!groupName) {
      Alert.alert('Validation', 'Please enter sub-category / group name.');
      return;
    }

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
      Alert.alert(
        'Error',
        err?.message || 'Failed to update ledger. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLedger = () => {
    if (!ledger) return;

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
                {
                  text: 'OK',
                  onPress: () => router.replace('/(tabs)/ledgers'),
                },
              ]);
            } catch (err: any) {
              console.error('[LedgerDetail] delete failed', err);
              Alert.alert(
                'Cannot delete',
                err?.message ||
                  'This ledger has entries or could not be deleted.',
              );
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
        <Text
          style={[
            styles.natureChipText,
            selected && styles.natureChipTextSelected,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const closingDiff = totals.debit - totals.credit;
  const closingBalanceText =
    closingDiff === 0
      ? '0'
      : `${formatAmount(Math.abs(closingDiff))} ${
          closingDiff > 0 ? 'Dr' : 'Cr'
        }`;

  // --------- Date picker helpers ----------
  const openDatePicker = (target: 'from' | 'to') => {
    setDatePickerTarget(target);
    const base =
      target === 'from'
        ? parseDateString(fromDate)
        : parseDateString(toDate);
    setPickerDate(base);
    setShowDatePicker(true);
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (!date || event?.type !== 'set') {
      return;
    }

    const value = formatDateToInput(date);
    if (datePickerTarget === 'from') {
      setFromDate(value);
    } else {
      setToDate(value);
    }
  };

  // --------- PDF Export ----------
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
          <td>${line.date}</td>
          <td>
            <strong>${line.particular}</strong><br/>
            ${
              line.remarks
                ? `<span style="font-size:10px;color:#666;">${line.remarks}</span>`
                : ''
            }
          </td>
          <td style="text-align:right;">
            ${
              line.debit
                ? formatNumberWithOptionalDecimals(line.debit)
                : ''
            }
          </td>
          <td style="text-align:right;">
            ${
              line.credit
                ? formatNumberWithOptionalDecimals(line.credit)
                : ''
            }
          </td>
          <td style="text-align:right;">
            ${formatBalance(line.balance)}
          </td>
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
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                font-size: 11px;
                color: #111;
                padding: 16px;
              }
              h1, h2, h3 { margin: 0; padding: 0; }
              .app-name { font-size: 10px; color: #777; text-align:center; }
              .stmt-title { font-size: 13px; font-weight: 700; text-align:center; margin-top: 2px; letter-spacing: 1px; }
              .ledger-title { font-size: 18px; font-weight: 700; text-align:center; margin-top: 8px; }
              .ledger-meta { font-size: 11px; text-align:center; color:#777; margin-top: 2px; }
              .period { font-size: 10px; text-align:center; margin-top: 4px; }
              .closing { font-size: 10px; text-align:center; margin-top: 2px; }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 12px;
              }
              thead tr:first-child {
                border-top: 1px solid #000;
                border-bottom: 1px solid #000;
              }
              th, td {
                padding: 4px 3px;
                border-bottom: 0.5px solid #ddd;
              }
              th {
                font-size: 10px;
                text-align: left;
              }
              .amount { text-align: right; }
              tfoot td {
                border-top: 1px solid #000;
                font-weight: 700;
                background: #fdf7fb;
              }
            </style>
          </head>
          <body>
            <div class="app-name">Budget Ledger</div>
            <div class="stmt-title">LEDGER STATEMENT</div>
            <div class="ledger-title">${ledger.name}</div>
            <div class="ledger-meta">${ledger.groupName} · ${ledger.nature}</div>
            <div class="period">
              Period: ${fromDate || 'Beginning'} ～ ${toDate || 'Today'}
            </div>
            <div class="closing">
              Closing balance: ${closingBalanceText}
            </div>

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
              <tbody>
                ${rowsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td></td>
                  <td>TOTAL</td>
                  <td class="amount">
                    ${formatNumberWithOptionalDecimals(totals.debit)}
                  </td>
                  <td class="amount">
                    ${formatNumberWithOptionalDecimals(totals.credit)}
                  </td>
                  <td class="amount">
                    ${formatBalance(closingDiff)}
                  </td>
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
        Alert.alert(
          'Export',
          `PDF created at: ${targetUri}\n(Sharing is not available on this device)`,
        );
        return;
      }

      await Sharing.shareAsync(targetUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share ledger statement PDF',
      });
    } catch (err) {
      console.error('[LedgerDetail] PDF export failed', err);
      Alert.alert(
        'Error',
        'Failed to export ledger as PDF. Please try again.',
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Stack.Screen options={{ title: ledger.name }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {/* Printed-style header */}
        <View style={styles.printHeaderCard}>
          <Text style={styles.appNameText}>Budget Ledger</Text>
          <Text style={styles.statementTitle}>LEDGER STATEMENT</Text>

          <TouchableOpacity onPress={handleOpenMaster} activeOpacity={0.7}>
            <Text style={styles.ledgerTitleText}>{ledger.name}</Text>
          </TouchableOpacity>

          <Text style={styles.ledgerMetaText}>
            {ledger.groupName} · {ledger.nature}
          </Text>

          <View style={styles.headerBottomRow}>
            <Text style={styles.headerSmallLabel}>
              Closing balance:{' '}
              <Text style={styles.headerBalanceText}>
                {closingBalanceText}
              </Text>
            </Text>
          </View>
        </View>

        {/* Period filters with calendar pickers */}
        <View style={styles.filterCard}>
          <Text style={styles.filterTitle}>Period</Text>
          <View style={styles.filterRow}>
            <View style={styles.filterCol}>
              <Text style={styles.filterLabel}>From</Text>
              <TouchableOpacity
                style={styles.filterInputButton}
                onPress={() => openDatePicker('from')}
              >
                <Text
                  style={
                    fromDate
                      ? styles.filterInputText
                      : styles.filterInputPlaceholder
                  }
                >
                  {fromDate || 'Select date'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.filterCol}>
              <Text style={styles.filterLabel}>To</Text>
              <TouchableOpacity
                style={styles.filterInputButton}
                onPress={() => openDatePicker('to')}
              >
                <Text
                  style={
                    toDate
                      ? styles.filterInputText
                      : styles.filterInputPlaceholder
                  }
                >
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
              <TouchableOpacity
                style={styles.exportButton}
                onPress={() => {
                  void handleExportPdf();
                }}
              >
                <Text style={styles.exportButtonText}>Export PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Ledger table with double top border like Excel */}
        <View style={styles.tableCard}>
          <View style={styles.tableTopBorders}>
            <View style={styles.tableTopLine} />
            <View style={[styles.tableTopLine, { marginTop: 2 }]} />
          </View>

          <View style={styles.tableHeader}>
            <Text style={[styles.colDate, styles.tableHeaderText]}>Date</Text>
            <Text style={[styles.colParticular, styles.tableHeaderText]}>
              Particulars
            </Text>
            <Text
              style={[
                styles.colAmount,
                styles.tableHeaderText,
                styles.right,
              ]}
            >
              Dr
            </Text>
            <Text
              style={[
                styles.colAmount,
                styles.tableHeaderText,
                styles.right,
              ]}
            >
              Cr
            </Text>
            <Text
              style={[
                styles.colBalance,
                styles.tableHeaderText,
                styles.right,
              ]}
            >
              Balance
            </Text>
          </View>

          {lines.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No entries for this period.</Text>
            </View>
          ) : (
            <>
              {lines.map((line) => (
                <View key={line.id} style={styles.tableRow}>
                  <View style={styles.colDate}>
                    <Text style={styles.dateText}>{line.date}</Text>
                  </View>

                  <View style={styles.particularCell}>
                    <Text style={styles.particularText}>
                      {line.particular}
                    </Text>
                    {line.remarks ? (
                      <Text style={styles.remarksText}>{line.remarks}</Text>
                    ) : null}
                  </View>

                  <View style={styles.amountCell}>
                    <Text style={[styles.amountText, styles.right]}>
                      {line.debit
                        ? formatNumberWithOptionalDecimals(line.debit)
                        : ''}
                    </Text>
                  </View>
                  <View style={styles.amountCell}>
                    <Text style={[styles.amountText, styles.right]}>
                      {line.credit
                        ? formatNumberWithOptionalDecimals(line.credit)
                        : ''}
                    </Text>
                  </View>
                  <View style={styles.balanceCell}>
                    <Text style={[styles.amountText, styles.right]}>
                      {formatBalance(line.balance)}
                    </Text>
                  </View>
                </View>
              ))}

              <View style={styles.tableFooterLine} />

              <View style={[styles.tableRow, styles.totalRow]}>
                <View style={styles.colDate} />
                <View style={styles.particularCell}>
                  <Text style={styles.totalLabel}>TOTAL</Text>
                </View>
                <View style={styles.amountCell}>
                  <Text
                    style={[
                      styles.amountText,
                      styles.totalAmount,
                      styles.right,
                    ]}
                  >
                    {formatNumberWithOptionalDecimals(totals.debit)}
                  </Text>
                </View>
                <View style={styles.amountCell}>
                  <Text
                    style={[
                      styles.amountText,
                      styles.totalAmount,
                      styles.right,
                    ]}
                  >
                    {formatNumberWithOptionalDecimals(totals.credit)}
                  </Text>
                </View>
                <View style={styles.balanceCell}>
                  <Text
                    style={[
                      styles.amountText,
                      styles.totalAmount,
                      styles.right,
                    ]}
                  >
                    {formatBalance(closingDiff)}
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

      {/* Ledger Master overlay */}
      {showMaster && (
        <View style={styles.overlay}>
          <View style={styles.masterCard}>
            <Text style={styles.masterTitle}>Ledger Master</Text>
            <Text style={styles.masterHint}>
              Edit name, category and sub-category for this ledger.
            </Text>

            <Text style={[styles.masterLabel, { marginTop: 8 }]}>
              Ledger Name
            </Text>
            <TextInput
              style={styles.masterInput}
              value={editName}
              onChangeText={setEditName}
            />

            <Text style={[styles.masterLabel, { marginTop: 8 }]}>
              Category (Nature)
            </Text>
            <View style={styles.natureRow}>
              {renderNatureChip('Asset', 'Asset')}
              {renderNatureChip('Liability', 'Liability')}
              {renderNatureChip('Income', 'Income')}
              {renderNatureChip('Expense', 'Expense')}
            </View>

            <Text style={[styles.masterLabel, { marginTop: 8 }]}>
              Sub-category / Group
            </Text>
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
                  style={[
                    styles.masterButton,
                    styles.masterSaveButton,
                    saving && { opacity: 0.6 },
                  ]}
                  onPress={() => {
                    if (!saving) {
                      void handleSaveMaster();
                    }
                  }}
                >
                  <Text style={styles.masterSaveText}>
                    {saving ? 'Saving…' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.masterInfoNote}>
              Opening balance ka logic thoda sensitive hai (existing entries ke
              saath adjust karna hota hai), isliye abhi yahan se direct change
              nahi kar rahe. Opening balance ke liye abhi bhi journal entry se
              adjust kar sakte ho.
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },

  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  notFoundText: {
    fontSize: 14,
    color: COLORS.muted,
    marginBottom: 12,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backButtonText: {
    color: COLORS.dark,
    fontSize: 13,
  },

  // Header styled like printed ledger
  printHeaderCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    marginBottom: 12,
  },
  appNameText: {
    fontSize: 11,
    color: COLORS.muted,
    textAlign: 'center',
  },
  statementTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
    textAlign: 'center',
    marginTop: 2,
    letterSpacing: 1.2,
  },
  ledgerTitleText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.dark,
    textAlign: 'center',
    marginTop: 8,
  },
  ledgerMetaText: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 2,
  },
  headerBottomRow: {
    marginTop: 8,
    alignItems: 'center',
  },
  headerSmallLabel: {
    fontSize: 11,
    color: COLORS.muted,
  },
  headerBalanceText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Filter card + calendar
  filterCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    backgroundColor: '#f9fbff',
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 13,
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
  filterInputButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: COLORS.lightBg,
  },
  filterInputText: {
    fontSize: 12,
    color: COLORS.dark,
  },
  filterInputPlaceholder: {
    fontSize: 12,
    color: '#aaaaaa',
  },
  filterActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  filterClearButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterClearText: {
    fontSize: 11,
    color: COLORS.muted,
  },
  exportRow: {
    flexDirection: 'row',
    gap: 8,
  },
  exportButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
  },
  exportButtonText: {
    fontSize: 12,
    color: COLORS.lightBg,
    fontWeight: '600',
  },

  tableCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.lightBg,
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 8,
  },
  tableTopBorders: {
    marginBottom: 6,
  },
  tableTopLine: {
    height: 1,
    backgroundColor: '#000000',
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 4,
    marginBottom: 4,
  },
  colDate: {
    flex: 1.1,
  },
  colParticular: {
    flex: 2.4,
  },
  colAmount: {
    flex: 1,
  },
  colBalance: {
    flex: 1.1,
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.dark,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  dateText: {
    fontSize: 11,
    color: COLORS.muted,
  },
  particularCell: {
    flex: 2.4,
  },
  particularText: {
    fontSize: 12,
    color: COLORS.dark,
  },
  remarksText: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 1,
  },
  amountCell: {
    flex: 1,
    justifyContent: 'center',
  },
  balanceCell: {
    flex: 1.1,
    justifyContent: 'center',
  },
  amountText: {
    fontSize: 12,
    color: COLORS.dark,
  },
  right: {
    textAlign: 'right',
  },
  tableFooterLine: {
    height: 1,
    backgroundColor: '#000000',
    marginTop: 4,
    marginBottom: 4,
  },
  totalRow: {
    backgroundColor: '#fdf7fb',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.dark,
  },
  totalAmount: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  emptyBox: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.muted,
  },

  // ---------- Master modal ----------
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
  masterCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    padding: 14,
  },
  masterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },
  masterHint: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  masterLabel: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 4,
  },
  masterInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 7,
    fontSize: 13,
    color: COLORS.dark,
    backgroundColor: COLORS.lightBg,
  },
  natureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  natureChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  natureChipSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  natureChipText: {
    fontSize: 12,
    color: COLORS.dark,
  },
  natureChipTextSelected: {
    color: COLORS.lightBg,
    fontWeight: '600',
  },
  partyRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  masterButtonsRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  masterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  masterDeleteButton: {
    borderWidth: 1,
    borderColor: '#ffe0e0',
    backgroundColor: '#fff4f4',
  },
  masterDeleteText: {
    fontSize: 13,
    color: COLORS.danger,
    fontWeight: '600',
  },
  masterCancelButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#ffffff',
  },
  masterCancelText: {
    fontSize: 13,
    color: COLORS.dark,
  },
  masterSaveButton: {
    backgroundColor: COLORS.primary,
  },
  masterSaveText: {
    fontSize: 13,
    color: COLORS.lightBg,
    fontWeight: '600',
  },
  masterInfoNote: {
    marginTop: 10,
    fontSize: 11,
    color: COLORS.muted,
  },
});

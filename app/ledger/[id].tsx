// app/ledger/[id].tsx
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useData } from '../../src/context/AppDataContext';
import type { Ledger } from '../../src/models/ledger';
import type { Transaction } from '../../src/models/transaction';

const COLORS = {
  primary: '#ac0c79',
  dark: '#121212',
  lightBg: '#ffffff',
  accent: '#2e9ff5',
  muted: '#777777',
  border: '#e0e0e0',
  danger: '#d32f2f',
};

type LedgerLine = {
  id: string;
  date: string;
  particular: string;
  remarks: string;
  debit: number;
  credit: number;
};

function formatAmount(value: number): string {
  return `¥${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
  })}`;
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

    const mapLine = (t: Transaction): LedgerLine => {
      const isDebit = t.debitLedgerId === ledger.id;
      const otherLedgerId = isDebit ? t.creditLedgerId : t.debitLedgerId;
      const otherLedger =
        ledgers.find((l: Ledger) => l.id === otherLedgerId) ?? null;

      return {
        id: t.id,
        date:normalizeDate(t.date) ,
        particular: otherLedger ? otherLedger.name : otherLedgerId,
        remarks: t.narration || '',
        debit: isDebit ? t.amount : 0,
        credit: !isDebit ? t.amount : 0,
      };
    };

    const mapped: LedgerLine[] = ledgerTx.map(mapLine);

    const filtered = mapped.filter((line) => {
      if (fromDate && line.date < fromDate) return false;
      if (toDate && line.date > toDate) return false;
      return true;
    });

    filtered.sort((a, b) => {
      if (a.date === b.date) return a.id.localeCompare(b.id);
      return a.date < b.date ? -1 : 1;
    });

    return filtered;
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Stack.Screen options={{ title: ledger.name }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {/* Header summary */}
        <View style={styles.summaryCard}>
          <TouchableOpacity
            onPress={handleOpenMaster}
            activeOpacity={0.7}
          >
            <Text style={styles.ledgerName}>{ledger.name}</Text>
          </TouchableOpacity>
          <Text style={styles.ledgerGroup}>
            {ledger.groupName} · {ledger.nature}
          </Text>

          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.balanceLabel}>Closing Balance</Text>
              <Text style={styles.balanceValue}>
                {(() => {
                  const diff = totals.debit - totals.credit;
                  if (diff === 0) return '0.00';
                  const type = diff > 0 ? 'Dr' : 'Cr';
                  return `${formatAmount(Math.abs(diff))} ${type}`;
                })()}
              </Text>
            </View>
          </View>
        </View>

        {/* Period filters */}
        <View style={styles.filterCard}>
          <Text style={styles.filterTitle}>Period</Text>
          <View style={styles.filterRow}>
            <View style={styles.filterCol}>
              <Text style={styles.filterLabel}>From (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.filterInput}
                value={fromDate}
                onChangeText={setFromDate}
                placeholder="2025-01-01"
              />
            </View>
            <View style={styles.filterCol}>
              <Text style={styles.filterLabel}>To (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.filterInput}
                value={toDate}
                onChangeText={setToDate}
                placeholder="2025-12-31"
              />
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
                  console.log('Export ledger as PDF (future)');
                }}
              >
                <Text style={styles.exportButtonText}>Export PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Ledger table */}
        <View style={styles.tableCard}>
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
                    <Text style={styles.particularText}>{line.particular}</Text>
                    {line.remarks ? (
                      <Text style={styles.remarksText}>{line.remarks}</Text>
                    ) : null}
                  </View>

                  <View style={styles.amountCell}>
                    <Text style={[styles.amountText, styles.right]}>
                      {line.debit
                        ? line.debit.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })
                        : ''}
                    </Text>
                  </View>
                  <View style={styles.amountCell}>
                    <Text style={[styles.amountText, styles.right]}>
                      {line.credit
                        ? line.credit.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })
                        : ''}
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
                    {totals.debit.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
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
                    {totals.credit.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>

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
              <Switch
                value={editIsParty}
                onValueChange={setEditIsParty}
              />
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
              Opening balance ka logic thoda sensitive hai (existing entries
              ke saath adjust karna hota hai), isliye abhi yahan se direct
              change nahi kar rahe. Opening balance ke liye abhi bhi journal
              entry se adjust kar sakte ho.
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

  summaryCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    backgroundColor: '#fdf7fb',
    marginBottom: 12,
  },
  ledgerName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
  },
  ledgerGroup: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  balanceRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceLabel: {
    fontSize: 11,
    color: COLORS.muted,
  },
  balanceValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 2,
  },

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
    padding: 8,
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
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '600',
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
  amountText: {
    fontSize: 12,
    color: COLORS.dark,
  },
  right: {
    textAlign: 'right',
  },
  tableFooterLine: {
    height: 1,
    backgroundColor: COLORS.border,
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

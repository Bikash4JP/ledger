// app/ledger/[id].tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
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
  const { ledgers, transactions } = useData();

  const ledger = useMemo(
    () => ledgers.find((l: Ledger) => l.id === id),
    [ledgers, id],
  );

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

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
        date: t.date,
        particular: otherLedger ? otherLedger.name : otherLedgerId,
        remarks: t.narration || '',
        debit: isDebit ? t.amount : 0,
        credit: !isDebit ? t.amount : 0,
      };
    };

    const mapped: LedgerLine[] = ledgerTx.map(mapLine);

    // date filter (string compare works if YYYY-MM-DD)
    const filtered = mapped.filter((line) => {
      if (fromDate && line.date < fromDate) return false;
      if (toDate && line.date > toDate) return false;
      return true;
    });

    // sort by date ascending, then id
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Stack.Screen options={{ title: ledger.name }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {/* Header summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.ledgerName}>{ledger.name}</Text>
          <Text style={styles.ledgerGroup}>
            {ledger.groupName} · {ledger.nature}
          </Text>

          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.balanceLabel}>Closing Balance</Text>
              <Text style={styles.balanceValue}>
                {/* Closing balance approx = total Dr - total Cr for this ledger */}
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
                  // TODO: Hook up to real PDF export later
                  // For now just a placeholder.
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
            <Text style={[styles.colAmount, styles.tableHeaderText, styles.right]}>
              Dr
            </Text>
            <Text style={[styles.colAmount, styles.tableHeaderText, styles.right]}>
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
                  <Text style={[styles.amountText, styles.totalAmount, styles.right]}>
                    {totals.debit.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                </View>
                <View style={styles.amountCell}>
                  <Text style={[styles.amountText, styles.totalAmount, styles.right]}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.dark, // black outer like tab bar
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
});

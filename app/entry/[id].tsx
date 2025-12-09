// app/entry/[id].tsx
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
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

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { transactions, ledgers, addTransaction } = useData();

  const tx = useMemo(
    () => transactions.find((t) => t.id === id),
    [transactions, id],
  );

  const debitLedger: Ledger | undefined = useMemo(() => {
    if (!tx) return undefined;
    return ledgers.find((l) => l.id === tx.debitLedgerId);
  }, [tx, ledgers]);

  const creditLedger: Ledger | undefined = useMemo(() => {
    if (!tx) return undefined;
    return ledgers.find((l) => l.id === tx.creditLedgerId);
  }, [tx, ledgers]);

  if (!tx) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Entry not found.</Text>
      </View>
    );
  }

  const handleReverse = () => {
    Alert.alert(
      'Reverse this entry?',
      'This will create a new entry with opposite debit/credit for the same amount. You cannot undo this.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reverse',
          style: 'destructive',
          onPress: () => {
            const today = new Date();
            const y = today.getFullYear();
            const m = String(today.getMonth() + 1).padStart(2, '0');
            const d = String(today.getDate()).padStart(2, '0');
            const todayStr = `${y}-${m}-${d}`;

            addTransaction({
              date: todayStr,
              debitLedgerId: tx.creditLedgerId,
              creditLedgerId: tx.debitLedgerId,
              amount: tx.amount,
              voucherType: 'Journal',
              narration:
                tx.narration
                  ? `Reversal of entry on ${tx.date}: ${tx.narration}`
                  : `Reversal of entry on ${tx.date}`,
            });

            Alert.alert(
              'Reversed',
              'Reversal entry created. Please pass a new correct entry if needed.',
              [
                {
                  text: 'OK',
                  onPress: () => router.replace('/(tabs)/entries'),
                },
              ],
            );
          },
        },
      ],
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Entry Details' }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
      >
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.dateText}>{tx.date}</Text>
              <Text style={styles.voucherTypeText}>{tx.voucherType}</Text>
            </View>
            <Text style={styles.amountText}>
              ¥{tx.amount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </Text>
          </View>

          {/* Debit / Credit details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ledger Impact</Text>

            <View style={styles.ledgerRow}>
              <View style={styles.ledgerCol}>
                <Text style={styles.ledgerLabel}>Debit</Text>
                <Text style={styles.ledgerName}>
                  {debitLedger ? debitLedger.name : tx.debitLedgerId}
                </Text>
              </View>
              <View style={styles.ledgerCol}>
                <Text style={styles.ledgerLabel}>Credit</Text>
                <Text style={styles.ledgerName}>
                  {creditLedger ? creditLedger.name : tx.creditLedgerId}
                </Text>
              </View>
            </View>
          </View>

          {/* Narration */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Narration</Text>
            <Text style={styles.narrationText}>
              {tx.narration || '(No narration)'}
            </Text>
          </View>

          {/* Info note */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>No direct editing</Text>
            <Text style={styles.infoText}>
              Amounts and ledgers cannot be edited once an entry is saved.
              If this entry is wrong, reverse it and pass a new correct entry.
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.reverseButton}
              onPress={handleReverse}
            >
              <Text style={styles.reverseButtonText}>Reverse Entry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightBg,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.muted,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#ffffff',
    padding: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  voucherTypeText: {
    fontSize: 12,
    color: COLORS.accent,
    marginTop: 2,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },

  section: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 6,
  },
  ledgerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  ledgerCol: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 8,
    backgroundColor: '#fdf7fb',
  },
  ledgerLabel: {
    fontSize: 11,
    color: COLORS.muted,
    marginBottom: 2,
  },
  ledgerName: {
    fontSize: 13,
    color: COLORS.dark,
    fontWeight: '500',
  },
  narrationText: {
    fontSize: 13,
    color: COLORS.dark,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 8,
  },

  infoBox: {
    marginTop: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffe0e0',
    backgroundColor: '#fff4f4',
    padding: 10,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.danger,
    marginBottom: 2,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.muted,
  },

  actionsRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  reverseButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: COLORS.dark,
  },
  reverseButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.lightBg,
  },
});

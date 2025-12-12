// src/screens/EntriesListScreen.tsx
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useData } from '../context/AppDataContext';

const COLORS = {
  primary: '#ac0c79',
  dark: '#121212',
  lightBg: '#ffffff',
  muted: '#777777',
  border: '#e0e0e0',
  danger: '#d32f2f',
};

export default function EntriesListScreen() {
  const router = useRouter();
  const { transactions, ledgers, deleteTransaction } = useData();
  const normalizeDate = (value: string): string => value.substring(0, 10);

  const rows = useMemo(() => {
    const getLedgerName = (id: string) =>
      ledgers.find((l) => l.id === id)?.name ?? id;

    return [...transactions]
      .sort((a, b) => {
        if (a.date === b.date) return a.id.localeCompare(b.id);
        return a.date < b.date ? 1 : -1; // latest first
      })
      .map((t) => ({
        id: t.id,
        date:normalizeDate(t.date),
        debitName: getLedgerName(t.debitLedgerId),
        creditName: getLedgerName(t.creditLedgerId),
        amount: t.amount,
        narration: t.narration,
      }));
  }, [transactions, ledgers]);

  const handleOpenEntry = (id: string) => {
    router.push({ pathname: '/entry/[id]', params: { id } });
  };

  const handleAddEntry = () => {
    router.push('/entry/new' as any);
  };

  const handleDeleteEntry = (id: string) => {
    Alert.alert(
      'Delete entry',
      'Are you sure you want to delete this entry completely?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void deleteTransaction(id).catch((err) => {
              console.warn('Delete failed', err);
              Alert.alert(
                'Error',
                'Failed to delete entry. Please try again.',
              );
            });
          },
        },
      ],
    );
  };

  const renderRow = ({ item }: { item: (typeof rows)[number] }) => (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.rowContent}
        onPress={() => handleOpenEntry(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.rowTop}>
          <Text style={styles.date}>{item.date}</Text>
          <Text style={styles.amount}>
            ¥{item.amount.toLocaleString(undefined, {
              minimumFractionDigits: 0,
            })}
          </Text>
        </View>
        <Text style={styles.ledgerLine}>
          {item.debitName} → {item.creditName}
        </Text>
        {item.narration ? (
          <Text style={styles.narration} numberOfLines={1}>
            {item.narration}
          </Text>
        ) : null}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDeleteEntry(item.id)}
        activeOpacity={0.7}
      >
        <Text style={styles.deleteText}>🗑</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Entries</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddEntry}
          activeOpacity={0.7}
        >
          <Text style={styles.addText}>＋ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        renderItem={renderRow}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No entries yet.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.dark,
  },
  addButton: {
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.lightBg,
  },
  listContent: {
    paddingTop: 4,
    paddingBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#fafafa',
  },
  rowContent: {
    flex: 1,
    marginRight: 8,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: COLORS.muted,
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  ledgerLine: {
    fontSize: 13,
    color: COLORS.dark,
  },
  narration: {
    marginTop: 2,
    fontSize: 11,
    color: COLORS.muted,
  },
  deleteBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  deleteText: {
    fontSize: 18,
    color: COLORS.danger,
  },
  emptyBox: {
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'center',
  },
});

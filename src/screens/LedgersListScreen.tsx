// src/screens/LedgersListScreen.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useData } from '../context/AppDataContext';
import type { Ledger } from '../models/ledger';
import type { Transaction } from '../models/transaction';

const COLORS = {
  primary: '#ac0c79',
  dark: '#121212',
  lightBg: '#ffffff',
  muted: '#777777',
  border: '#e0e0e0',
};

export default function LedgersListScreen() {
  const router = useRouter();
  const { ledgers, transactions } = useData();
  const [search, setSearch] = useState('');

  const recentLedgers: Ledger[] = useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];

    const txs = [...transactions].reverse();
    txs.forEach((t: Transaction) => {
      if (!seen.has(t.debitLedgerId)) {
        seen.add(t.debitLedgerId);
        ordered.push(t.debitLedgerId);
      }
      if (!seen.has(t.creditLedgerId)) {
        seen.add(t.creditLedgerId);
        ordered.push(t.creditLedgerId);
      }
    });

    const result: Ledger[] = [];
    ordered.forEach((id) => {
      const l = ledgers.find((x) => x.id === id);
      if (l) result.push(l);
    });

    return result.slice(0, 8);
  }, [ledgers, transactions]);

  const filteredLedgers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ledgers;
    return ledgers.filter((l) => l.name.toLowerCase().includes(q));
  }, [ledgers, search]);

  const openLedger = (ledger: Ledger) => {
    router.push({
      pathname: '/ledger/[id]',
      params: { id: ledger.id },
    });
  };

  const renderLedgerRow = ({ item }: { item: Ledger }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => openLedger(item)}
      activeOpacity={0.7}
    >
      <View style={styles.rowHeader}>
        <Text style={styles.rowTitle}>{item.name}</Text>
        <Text style={styles.rowGroup}>{item.groupName}</Text>
      </View>
      <Text style={styles.rowMeta}>
        {item.nature}
        {item.isParty ? ' ・ Party' : ''}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchBox}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search ledger by name"
          placeholderTextColor={COLORS.muted}
          style={styles.searchInput}
        />
      </View>

      {/* Recently used */}
      {search.trim().length === 0 && recentLedgers.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recently used</Text>
          <FlatList
            data={recentLedgers}
            keyExtractor={(item) => `recent-${item.id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.recentChip}
                onPress={() => openLedger(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.recentName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.recentGroup} numberOfLines={1}>
                  {item.groupName}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* All / filtered ledgers */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {search.trim() ? 'Search results' : 'All ledgers'}
        </Text>
      </View>

      <FlatList
        data={filteredLedgers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderLedgerRow}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No ledgers found.</Text>
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
  searchBox: {
    marginBottom: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.dark,
    backgroundColor: '#fafafa',
  },
  section: {
    marginTop: 4,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  recentList: {
    paddingVertical: 6,
  },
  recentChip: {
    width: 140,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#fafafa',
  },
  recentName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.dark,
  },
  recentGroup: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  listContent: {
    paddingTop: 4,
    paddingBottom: 16,
  },
  row: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#fdfdfd',
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.dark,
    flex: 1,
  },
  rowGroup: {
    fontSize: 12,
    color: COLORS.muted,
    marginLeft: 6,
  },
  rowMeta: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
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

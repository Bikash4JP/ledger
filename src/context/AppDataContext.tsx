// src/context/AppDataContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { seedLedgers } from '../data/seedLedgers';
import { seedTransactions } from '../data/seedTransactions';
import type { Ledger } from '../models/ledger';
import type { Transaction, VoucherType } from '../models/transaction';

import { storage } from '../storage';
import type { EntryInput } from '../storage/types';

export type NewTransactionInput = {
  date: string;
  debitLedgerId: string;
  creditLedgerId: string;
  amount: number;
  narration?: string;
  voucherType?: VoucherType;
};

type NewLedgerInput = {
  name: string;
  groupName: string;
  nature: Ledger['nature'];
  isParty?: boolean;
};

type DataContextValue = {
  ledgers: Ledger[];
  transactions: Transaction[];
  addTransaction: (input: NewTransactionInput) => Promise<void>;
  addLedger: (input: NewLedgerInput) => Promise<Ledger | null>;
  deleteTransaction: (id: string) => Promise<void>; // 👈 NEW
  reloadFromServer: () => Promise<void>;
};

const DataContext = createContext<DataContextValue | undefined>(undefined);

// Backend URL yahi se lenge (same pattern as storage)
const API_URL = 'http://3.107.197.46';

export function DataProvider({ children }: { children: ReactNode }) {
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // -------- INITIAL LOAD (backend → state, fallback = seeds) ----------
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('[Data] loading from backend via storage');
        const { ledgers, transactions } = await storage.loadInitialData();
        setLedgers(ledgers);
        setTransactions(transactions);
      } catch (err) {
        console.warn('Failed to load data from backend, using seeds', err);
        setLedgers(seedLedgers);
        setTransactions(seedTransactions);
      } finally {
        setIsHydrated(true);
      }
    };

    void loadData();
  }, []);

  // -------- RELOAD ALL DATA (manual refresh from Settings etc.) ----------
  const reloadFromServer = async (): Promise<void> => {
    try {
      console.log('[Data] manual reload from backend');
      const { ledgers, transactions } = await storage.loadInitialData();
      setLedgers(ledgers);
      setTransactions(transactions);
    } catch (err) {
      console.warn('Failed to reload data from backend', err);
      throw err;
    }
  };

  // -------- CREATE LEDGER (backend + local state update) ----------
  const addLedger = async (input: NewLedgerInput): Promise<Ledger | null> => {
    try {
      const created = await storage.createLedger(input);
      setLedgers((prev) => [...prev, created]);
      return created;
    } catch (err) {
      console.warn('Failed to create ledger on backend', err);
      return null;
    }
  };

  // -------- CREATE ENTRY (single line for now) ----------
  const addTransaction = async (input: NewTransactionInput): Promise<void> => {
    try {
      const entryPayload: EntryInput = {
        date: input.date,
        voucherType: input.voucherType ?? 'Journal',
        narration: input.narration,
        lines: [
          {
            debitLedgerId: input.debitLedgerId,
            creditLedgerId: input.creditLedgerId,
            amount: input.amount,
            narration: input.narration,
          },
        ],
      };

      await storage.createEntry(entryPayload);

      // Backend me new entry add ho gaya, ab fresh list le aate hain
      const { ledgers: nextLedgers, transactions: nextTx } =
        await storage.loadInitialData();

      setLedgers(nextLedgers);
      setTransactions(nextTx);
    } catch (err) {
      console.warn('Failed to create entry on backend', err);
    }
  };

  // -------- DELETE ENTRY (backend + refresh) ----------
  const deleteTransaction = async (id: string): Promise<void> => {
    try {
      console.log('[Data] deleting entry', id);

      const res = await fetch(`${API_URL}/entries/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        console.warn('[Data] delete entry failed', res.status);
        throw new Error(`Delete failed: ${res.status}`);
      }

      // Delete ke baad fresh data
      const { ledgers: nextLedgers, transactions: nextTx } =
        await storage.loadInitialData();

      setLedgers(nextLedgers);
      setTransactions(nextTx);
    } catch (err) {
      console.warn('Failed to delete entry on backend', err);
      throw err;
    }
  };

  if (!isHydrated) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#121212',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={{ color: '#ffffff', marginTop: 8 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <DataContext.Provider
      value={{
        ledgers,
        transactions,
        addTransaction,
        addLedger,
        deleteTransaction,
        reloadFromServer,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
}

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
};

const DataContext = createContext<DataContextValue | undefined>(undefined);

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
        console.warn(
          'Failed to load data from backend, using seeds',
          err
        );
        setLedgers(seedLedgers);
        setTransactions(seedTransactions);
      } finally {
        setIsHydrated(true);
      }
    };

    loadData();
  }, []);

  // -------- CREATE LEDGER (backend + local state update) ----------
    const addLedger = async (input: NewLedgerInput): Promise<Ledger | null> => {
    try {
      const created = await storage.createLedger(input);
      setLedgers((prev) => [...prev, created]);
      return created;
    } catch (err) {
      console.warn('Failed to create ledger on backend', err);
      // IMPORTANT: error upar tak jaane do
      throw err;
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

      // createEntry khud backend hit + fresh data laa raha hai
      const { ledgers: nextLedgers, transactions: nextTx } =
        await storage.createEntry(entryPayload);

      setLedgers(nextLedgers);
      setTransactions(nextTx);
    } catch (err) {
      console.warn('Failed to create entry on backend', err);
      // IMPORTANT: upar tak error bhejo
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
      value={{ ledgers, transactions, addTransaction, addLedger }}
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

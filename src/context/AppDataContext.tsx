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
  deleteTransaction: (id: string) => Promise<void>;

  updateLedger: (id: string, input: NewLedgerInput) => Promise<Ledger | null>;
  deleteLedger: (id: string) => Promise<void>;

  reloadFromServer: () => Promise<void>;
};

const DataContext = createContext<DataContextValue | undefined>(undefined);

// Backend URL
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

  // -------- UPDATE LEDGER (master edit) ----------
  const updateLedger = async (
    id: string,
    input: NewLedgerInput,
  ): Promise<Ledger | null> => {
    try {
      const res = await fetch(`${API_URL}/ledgers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        console.warn('[Data] update ledger failed', res.status);
        const body = await res.json().catch(() => null);
        const msg =
          body?.error ?? `Failed to update ledger (status ${res.status})`;
        throw new Error(msg);
      }

      const updated: Ledger = await res.json();

      setLedgers((prev) =>
        prev.map((l) => (l.id === id ? { ...l, ...updated } : l)),
      );

      return updated;
    } catch (err) {
      console.warn('Failed to update ledger on backend', err);
      throw err;
    }
  };

  // -------- DELETE LEDGER ----------
  const deleteLedger = async (id: string): Promise<void> => {
    try {
      const res = await fetch(`${API_URL}/ledgers/${id}`, {
        method: 'DELETE',
      });

      if (res.status === 400) {
        const body = await res.json().catch(() => null);
        const msg =
          body?.error ??
          'This ledger has entries and cannot be deleted. Delete/reverse entries first.';
        throw new Error(msg);
      }

      if (!res.ok && res.status !== 204) {
        console.warn('[Data] delete ledger failed', res.status);
        throw new Error(`Failed to delete ledger (status ${res.status})`);
      }

      setLedgers((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.warn('Failed to delete ledger on backend', err);
      throw err;
    }
  };

  // -------- CREATE ENTRY ----------
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

      const { ledgers: nextLedgers, transactions: nextTx } =
        await storage.loadInitialData();

      setLedgers(nextLedgers);
      setTransactions(nextTx);
    } catch (err) {
      console.warn('Failed to create entry on backend', err);
    }
  };

  // -------- DELETE ENTRY ----------
  const deleteTransaction = async (id: string): Promise<void> => {
    try {
      console.log('[Data] deleting entry', id);

      const res = await fetch(`${API_URL}/entries/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok && res.status !== 204) {
        console.warn('[Data] delete entry failed', res.status);
        throw new Error(`Delete failed: ${res.status}`);
      }

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
        updateLedger,
        deleteLedger,
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

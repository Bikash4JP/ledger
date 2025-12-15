// ledger/src/context/AppDataContext.tsx
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

import { getCurrentUserEmail } from '../config/userIdentity';
import { storage } from '../storage';
import type { EntryInput } from '../storage/types';
import { useSettings } from './SettingsContext';

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

// 👇 yahan define kar rahe hain kitne standard ledgers demo mode me dikhane hain
const DEMO_LEDGER_COUNT = 56;

export function DataProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();

  // ✅ Sirf logged-in user ke liye backend data
  const hasUser = !!settings.authProfile;

  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // -------- INITIAL LOAD (demo vs user mode) ----------
  useEffect(() => {
    const loadData = async () => {
      try {
        if (hasUser) {
          console.log('[Data] initial load → backend via storage (user mode)');
          const { ledgers, transactions } = await storage.loadInitialData();
          setLedgers(ledgers);
          setTransactions(transactions);
        } else {
          console.log(
            '[Data] initial load → demo seeds only (no logged-in user)',
          );
          // 👇 sirf pehle 56 ledgers demo me dikhayenge
          const demoLedgers = seedLedgers.slice(0, DEMO_LEDGER_COUNT);
          setLedgers(demoLedgers);
          setTransactions(seedTransactions);
        }
      } catch (err) {
        console.warn(
          '[Data] Failed to load data, falling back to seeds',
          err,
        );
        const demoLedgers = seedLedgers.slice(0, DEMO_LEDGER_COUNT);
        setLedgers(demoLedgers);
        setTransactions(seedTransactions);
      } finally {
        setIsHydrated(true);
      }
    };

    void loadData();
  }, [hasUser]);

  // -------- RELOAD ALL DATA (Settings se manual refresh) ----------
  const reloadFromServer = async (): Promise<void> => {
    try {
      if (!hasUser) {
        console.log('[Data] reload → demo seeds only (no logged-in user)');
        const demoLedgers = seedLedgers.slice(0, DEMO_LEDGER_COUNT);
        setLedgers(demoLedgers);
        setTransactions(seedTransactions);
        return;
      }

      console.log('[Data] manual reload from backend (user mode)');
      const { ledgers, transactions } = await storage.loadInitialData();
      setLedgers(ledgers);
      setTransactions(transactions);
    } catch (err) {
      console.warn('Failed to reload data from backend', err);
      throw err;
    }
  };

  // -------- CREATE LEDGER ----------
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

  // -------- UPDATE LEDGER ----------
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

      const {
        ledgers: nextLedgers,
        transactions: nextTx,
      } = await storage.loadInitialData();

      setLedgers(nextLedgers);
      setTransactions(nextTx);
    } catch (err) {
      console.warn('Failed to create entry on backend', err);
    }
  };

  // -------- DELETE ENTRY ----------
  const deleteTransaction = async (id: string): Promise<void> => {
    try {
      // 🔎 Pehle local state se entryId nikaalo
      const localTx: any =
        transactions.find((t: Transaction) => t.id === id) ?? null;

      // Backend ko jo ID chahiye: entryId (agar available), warna jo UI se aaya
      const entryId: string = localTx?.entryId ?? id;

      console.log('[Data] deleting entry', id, '→ entryId:', entryId);

      const email = getCurrentUserEmail();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (email) {
        headers['x-user-email'] = email;
      }

      const res = await fetch(`${API_URL}/entries/${entryId}`, {
        method: 'DELETE',
        headers,
      });

      if (!res.ok && res.status !== 204) {
        let msg = `Delete failed: ${res.status}`;

        try {
          const body = await res.json();
          if (body?.error) msg = body.error;
        } catch {
          // JSON parse error ignore
        }

        console.warn('[Data] delete entry failed', res.status, msg);
        throw new Error(msg);
      }

      const {
        ledgers: nextLedgers,
        transactions: nextTx,
      } = await storage.loadInitialData();

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

// ledger/src/context/AppDataContext.tsx
import {
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

/**
 * ✅ Updated: Parent/Category support (backend aligned)
 * - isGroup: true = parent/group ledger
 * - categoryLedgerId: child -> parent ledger id (DB: category_ledger_id)
 *
 * (We keep parentLedgerId as backward-compat alias)
 */
export type NewLedgerInput = {
  name: string;
  groupName: string;
  nature: Ledger['nature'];
  isParty?: boolean;

  isGroup?: boolean;

  // ✅ NEW (backend)
  categoryLedgerId?: string | null;

  // ✅ backward-compat (old UI)
  parentLedgerId?: string | null;
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
const API_URL = process.env.EXPO_PUBLIC_API_URL;

// demo mode me kitne standard ledgers dikhane hain
const DEMO_LEDGER_COUNT = 56;

// ✅ normalize helper: always keep BOTH keys in frontend state
function normalizeLedger(l: any): Ledger {
  return {
    ...l,
    categoryLedgerId: l.categoryLedgerId ?? l.parentLedgerId ?? null,
    parentLedgerId: l.parentLedgerId ?? l.categoryLedgerId ?? null, // optional alias
  };
}

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
          setLedgers(ledgers.map(normalizeLedger));
          setTransactions(transactions);
        } else {
          console.log('[Data] initial load → demo seeds only (no logged-in user)');
          const demoLedgers = seedLedgers.slice(0, DEMO_LEDGER_COUNT);
          setLedgers(demoLedgers.map(normalizeLedger as any));
          setTransactions(seedTransactions);
        }
      } catch (err) {
        console.warn('[Data] Failed to load data, falling back to seeds', err);
        const demoLedgers = seedLedgers.slice(0, DEMO_LEDGER_COUNT);
        setLedgers(demoLedgers.map(normalizeLedger as any));
        setTransactions(seedTransactions);
      } finally {
        setIsHydrated(true);
      }
    };

    void loadData();
  }, [hasUser]);

  // -------- RELOAD ALL DATA ----------
  const reloadFromServer = async (): Promise<void> => {
    try {
      if (!hasUser) {
        console.log('[Data] reload → demo seeds only (no logged-in user)');
        const demoLedgers = seedLedgers.slice(0, DEMO_LEDGER_COUNT);
        setLedgers(demoLedgers.map(normalizeLedger as any));
        setTransactions(seedTransactions);
        return;
      }

      console.log('[Data] manual reload from backend (user mode)');
      const { ledgers, transactions } = await storage.loadInitialData();
      setLedgers(ledgers.map(normalizeLedger));
      setTransactions(transactions);
    } catch (err) {
      console.warn('Failed to reload data from backend', err);
      throw err;
    }
  };

  // -------- CREATE LEDGER ----------
  const addLedger = async (input: NewLedgerInput): Promise<Ledger | null> => {
    try {
      // ✅ ensure backend gets categoryLedgerId
      const payload: NewLedgerInput = {
        ...input,
        name: input.name?.trim(),
        groupName: input.groupName?.trim(),
        categoryLedgerId:
          input.categoryLedgerId ?? input.parentLedgerId ?? null,
      };

      const created = await storage.createLedger(payload as any);
      const normalized = normalizeLedger(created);

      setLedgers((prev) => [...prev, normalized]);
      return normalized;
    } catch (err) {
      console.warn('Failed to create ledger on backend', err);
      throw err; // ✅ re-throw so UI can show an error alert to the user
    }
  };

  // -------- UPDATE LEDGER ----------
  const updateLedger = async (
    id: string,
    input: NewLedgerInput,
  ): Promise<Ledger | null> => {
    try {
      const email = getCurrentUserEmail();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (email) headers['x-user-email'] = email; // ✅ important

      // ✅ align field name for backend
      const payload: any = {
        ...input,
        name: input.name?.trim(),
        groupName: input.groupName?.trim(),
        categoryLedgerId:
          input.categoryLedgerId ?? input.parentLedgerId ?? null,
      };

      const res = await fetch(`${API_URL}/ledgers/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.warn('[Data] update ledger failed', res.status);
        const body: any = await res.json().catch(() => null);
        const msg =
          body?.error ?? `Failed to update ledger (status ${res.status})`;
        throw new Error(msg);
      }

      const updatedRaw = await res.json() as Ledger;
      const updated = normalizeLedger(updatedRaw);

      setLedgers((prev) => prev.map((l) => (l.id === id ? { ...l, ...updated } : l)));
      return updated;
    } catch (err) {
      console.warn('Failed to update ledger on backend', err);
      throw err;
    }
  };

  // -------- DELETE LEDGER ----------
  const deleteLedger = async (id: string): Promise<void> => {
    try {
      const email = getCurrentUserEmail();
      const headers: Record<string, string> = {};
      if (email) headers['x-user-email'] = email; // ✅ important

      const res = await fetch(`${API_URL}/ledgers/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (res.status === 400) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
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

      setLedgers(nextLedgers.map(normalizeLedger));
      setTransactions(nextTx);
    } catch (err) {
      console.warn('Failed to create entry on backend', err);
      throw err; // ✅ re-throw so UI can show an error alert to the user
    }
  };

  // -------- DELETE ENTRY ----------
  const deleteTransaction = async (id: string): Promise<void> => {
    try {
      const localTx: any =
        transactions.find((t: Transaction) => t.id === id) ?? null;

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
          const body = (await res.json()) as { error?: string };
          if (body?.error) msg = body.error;
        } catch {}
        console.warn('[Data] delete entry failed', res.status, msg);
        throw new Error(msg);
      }

      const { ledgers: nextLedgers, transactions: nextTx } =
        await storage.loadInitialData();

      setLedgers(nextLedgers.map(normalizeLedger));
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

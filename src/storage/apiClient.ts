// src/storage/apiClient.ts
import { getCurrentUserEmail } from '../config/userIdentity';
import type { VoucherType } from '../models/transaction';

const BASE_URL = 'http://3.107.197.46:4000';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

async function request<T>(
  path: string,
  method: HttpMethod = 'GET',
  body?: any,
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  console.log('[API] request:', method, url);

  const email = getCurrentUserEmail(); // header ke liye

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (email) {
    headers['x-user-email'] = email;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(url, options);

    if (!res.ok) {
      const text = await res.text();
      console.error('[API] HTTP error', res.status, text);
      throw new Error(`API error ${res.status}: ${text}`);
    }

    const json = (await res.json()) as T;
    console.log('[API] response OK:', method, path);
    return json;
  } catch (err) {
    console.error('[API] network error for', url, err);
    throw err;
  }
}

// --------------------------------------------------
// Types
// --------------------------------------------------

export type ApiUser = {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  businessName: string | null;
  phone: string | null;
  createdAt: string;
};

// --------------------------------------------------
// Auth APIs
// --------------------------------------------------

export function apiSignup(payload: {
  name: string;
  businessName?: string;
  email: string;
  username: string;
  password: string;
  phone?: string;
}) {
  return request<ApiUser>('/auth/signup', 'POST', payload);
}

export function apiLogin(payload: {
  usernameOrEmail: string;
  password: string;
}) {
  return request<ApiUser>('/auth/login', 'POST', payload);
}

// --------------------------------------------------
// Ledger APIs
// --------------------------------------------------

// Ledgers
export function apiGetLedgers() {
  return request<unknown[]>('/ledgers', 'GET');
}

export function apiCreateLedger(payload: {
  name: string;
  groupName: string;
  nature: 'Asset' | 'Liability' | 'Income' | 'Expense';
  isParty?: boolean;
}) {
  return request<unknown>('/ledgers', 'POST', payload);
}

// Entries
export function apiGetEntries() {
  return request<unknown[]>('/entries', 'GET');
}

export function apiGetEntryById(id: string) {
  return request<unknown>(`/entries/${id}`, 'GET');
}

export function apiCreateEntry(payload: {
  date: string;
  voucherType: VoucherType;
  narration?: string;
  lines: {
    debitLedgerId: string;
    creditLedgerId: string;
    amount: number;
    narration?: string;
  }[];
}) {
  return request<unknown>('/entries', 'POST', payload);
}

// Ledger statement
export function apiGetLedgerStatement(params: {
  ledgerId: string;
  from?: string;
  to?: string;
}) {
  const query: string[] = [];
  if (params.from) query.push(`from=${encodeURIComponent(params.from)}`);
  if (params.to) query.push(`to=${encodeURIComponent(params.to)}`);

  const qs = query.length ? `?${query.join('&')}` : '';

  return request<unknown[]>(
    `/ledgers/${params.ledgerId}/statement${qs}`,
    'GET',
  );
}

// Transactions
export function apiGetTransactions() {
  return request<unknown[]>('/transactions', 'GET');
}

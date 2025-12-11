// ledger/src/api/authClient.ts
import { API_BASE_URL } from '../storage/apiClient';

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  businessName: string | null;
  phone: string | null;
  createdAt: string;
};

async function authRequest<T>(
  path: string,
  body: any,
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  console.log('[AUTH] request:', url);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('[AUTH] error', res.status, text);
    throw new Error(
      res.status === 400 || res.status === 401
        ? 'Invalid credentials or data.'
        : `Auth error ${res.status}`,
    );
  }

  const json = (await res.json()) as T;
  console.log('[AUTH] OK:', path);
  return json;
}

export function signup(payload: {
  name: string;
  businessName?: string;
  email: string;
  username: string;
  password: string;
}): Promise<AuthUser> {
  return authRequest<AuthUser>('/auth/signup', payload);
}

export function login(payload: {
  usernameOrEmail: string;
  password: string;
}): Promise<AuthUser> {
  return authRequest<AuthUser>('/auth/login', payload);
}

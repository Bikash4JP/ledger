// ledger/src/config/userIdentity.ts
let currentUserEmail: string | null = null;

export function setCurrentUserEmail(email: string | null) {
  currentUserEmail = email;
}

export function getCurrentUserEmail(): string | null {
  return currentUserEmail;
}

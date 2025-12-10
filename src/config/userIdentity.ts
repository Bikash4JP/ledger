// src/config/userIdentity.ts

let currentUserEmail: string | null = null;

/**
 * Isko SettingsContext se call karenge jab user email change / load hogi.
 */
export function setCurrentUserEmail(email: string | null) {
  currentUserEmail = email;
}

/**
 * API client yahan se latest email utha ke header me bhejega.
 */
export function getCurrentUserEmail(): string | null {
  return currentUserEmail;
}

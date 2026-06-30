# MobiLedger — System Architecture

---

## 1. High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Mobile / Web)                    │
│                                                                 │
│  ┌─────────────┐   ┌──────────────────┐   ┌──────────────────┐ │
│  │  Expo Router │   │  Context Layer   │   │   UI Screens     │ │
│  │ (Navigation) │──▶│  SettingsContext │──▶│  (tabs/, entry/, │ │
│  │              │   │  AppDataContext  │   │   ledger/)       │ │
│  │              │   │  UiContext       │   │                  │ │
│  └─────────────┘   └────────┬─────────┘   └──────────────────┘ │
│                             │                                   │
│                    ┌────────▼─────────┐                         │
│                    │   Storage Layer  │                         │
│                    │  apiClient.ts    │                         │
│                    │  apiStorage.ts   │                         │
│                    └────────┬─────────┘                         │
└─────────────────────────────┼───────────────────────────────────┘
                              │ HTTP  (x-user-email header)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (ledback)                           │
│                                                                 │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐    │
│  │  /auth       │   │  /ledgers    │   │  /entries        │    │
│  │  signup      │   │  CRUD        │   │  CRUD            │    │
│  │  login       │   │  statement   │   │  /transactions   │    │
│  └──────────────┘   └──────────────┘   └──────────────────┘    │
│                             │                                   │
│                    ┌────────▼─────────┐                         │
│                    │    Database      │                         │
│                    │ (PostgreSQL /    │                         │
│                    │  SQLite)         │                         │
│                    └──────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Architecture

### Navigation Layer — Expo Router

MobiLedger uses **file-based routing** via Expo Router. The file structure directly maps to URL routes:

```
app/
├── _layout.tsx          → Root layout (wraps all providers)
├── (tabs)/
│   ├── _layout.tsx      → Bottom tab bar definition
│   ├── index.tsx        → / (Home/Dashboard)
│   ├── entries.tsx      → /entries
│   ├── ledgers.tsx      → /ledgers
│   ├── reports.tsx      → /reports
│   └── setting.tsx      → /setting
├── entry/
│   ├── new.tsx          → /entry/new
│   └── [id].tsx         → /entry/:id
└── ledger/
    └── [id].tsx         → /ledger/:id
```

### State Management — Context Providers

Three React Context providers are initialized in `app/_layout.tsx` and wrap the entire app:

| Context | File | Responsibility |
|---|---|---|
| `SettingsContext` | `src/context/SettingsContext.tsx` | Language, theme, auth profile — persisted to AsyncStorage |
| `AppDataContext` | `src/context/AppDataContext.tsx` | All ledgers + transactions; CRUD operations; demo/user mode |
| `UiContext` | `src/context/UiContext.tsx` | Transient UI state: modal visibility, loading flags |

### Data Flow

```
App Start
    │
    ▼
SettingsContext.init()
    │  → reads AsyncStorage key: @ledger_settings_v2
    │  → hydrates language, authProfile
    │
    ▼
AppDataContext.init()
    │
    ├── authProfile === null ?
    │       YES → load seedLedgers (56) + seedTransactions (demo mode)
    │       NO  → apiStorage.loadInitialData()
    │                   → GET /ledgers   (with x-user-email)
    │                   → GET /entries
    │
    ▼
UI renders from useData() + useSettings() hooks
    │
    ▼
User CRUD (add/edit/delete transaction or ledger)
    │
    ├── calls AppDataContext function (e.g. addTransaction)
    │       → POST /entries
    │       → loadInitialData() to refresh
    │
    ▼
UI re-renders with updated state
```

---

## 3. Authentication Model

MobiLedger uses **email-based header authentication** (not JWT tokens):

- On login, the backend validates credentials and returns an `AuthUser` object.
- The user's email is saved to `SettingsContext.authProfile` (persisted in AsyncStorage).
- The `userIdentity.ts` singleton stores the email in memory for the session.
- Every API request includes the header: `x-user-email: <user@email.com>`
- The backend uses this header to scope all data queries to the authenticated user.

> **Security note:** This model is appropriate for a trusted mobile client. For production hardening, consider adding JWT token validation on top of this.

---

## 4. Accounting Engine

All financial reports are computed **in-memory on the client** in `app/(tabs)/reports.tsx`. No pre-aggregated data is stored or cached.

### Trial Balance Algorithm

```
For each transaction:
    debitLedger.balance  += transaction.amount
    creditLedger.balance -= transaction.amount

Assert: sum(all debits) === sum(all credits)
```

### Profit & Loss

```
Income accounts  → credit balance = revenue
Expense accounts → debit balance = cost

Gross Profit = Sales − Cost of Goods Sold
Net Profit   = Gross Profit − Indirect Expenses + Other Income
```

### Balance Sheet

```
Assets     = sum of Asset-nature ledger balances
Liabilities = sum of Liability-nature ledger balances + Capital
Capital    += Net Profit (from P&L)

Assert: Assets === Liabilities
```

> **Date handling note:** All date comparisons use `date.split('-')` (string-based) instead of `new Date()` to avoid UTC/local timezone offset bugs on mobile devices.

---

## 5. Storage & API Layer

### `src/storage/apiClient.ts`

Generic HTTP client wrapper. All requests:
- Set `Content-Type: application/json`
- Inject `x-user-email` header from `userIdentity` singleton
- Target `process.env.EXPO_PUBLIC_API_URL` as the base URL

### `src/storage/apiStorage.ts`

Adapter that translates application-level operations (`loadInitialData`, `createLedger`, `createEntry`) into the raw API calls from `apiClient.ts`. `AppDataContext` consumes this adapter — it never calls `apiClient.ts` directly.

---

## 6. Localization (i18n)

### Two-tier Translation System

**Tier 1 — Account names** (`src/utils/ledgerLabels.ts`):
Dictionary lookup for 60+ standard accounting terms (e.g., "Cash in Hand" → "現金").

**Tier 2 — UI strings** (`src/i18n/labels.ts`):
All button labels, tab names, error messages, and form labels.

### Rule

Standard ledgers (from `seedLedgers.ts`) are translated via dictionaries. User-created custom ledgers always display in the language they were entered — they are never auto-translated.

---

## 7. PDF Export Pipeline

```
User taps "Export PDF" on /ledger/:id
    │
    ▼
Build HTML string (full ledger statement table)
    │
    ▼
expo-print.printToFileAsync({ html })
    → returns: file:///tmp/expo-print-XXXX.pdf
    │
    ▼
FileSystem.moveAsync()
    → renames to: CacheDir/AccountName_YYYYMMDD_HHMMSS.pdf
    │
    ▼
Sharing.shareAsync(namedUri)
    → opens native share sheet (save, email, AirDrop, etc.)
```

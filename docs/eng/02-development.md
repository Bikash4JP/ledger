# MobiLedger — Development Guide

---

## Prerequisites

| Tool | Minimum Version | Install |
|---|---|---|
| Node.js | 20 LTS | https://nodejs.org |
| npm | 9+ | bundled with Node |
| Git | any recent | https://git-scm.com |
| Docker Desktop | 4.x | https://docker.com/products/docker-desktop (optional) |
| Expo Go app | latest | App Store / Play Store (for device testing) |

---

## 1. Clone Both Repositories

```bash
# Create a workspace folder
mkdir mobiledger-workspace && cd mobiledger-workspace

# Frontend
git clone https://github.com/Bikash4JP/ledger.git

# Backend
git clone https://github.com/Bikash4JP/ledback.git
```

Your workspace will look like:

```
mobiledger-workspace/
├── ledger/      ← this repo (frontend)
└── ledback/     ← backend API
```

---

## 2. Frontend Setup

```bash
cd ledger

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

Edit `.env` and set your backend URL:

```bash
EXPO_PUBLIC_API_URL=http://localhost:3000
```

> If you're running the backend on a different port, adjust accordingly.

### Start the Dev Server

| Mode | Command | Notes |
|---|---|---|
| Default (QR code) | `npx expo start -c` | Works with Expo Go on phone |
| Web browser | `npx expo start --web` | Opens at http://localhost:8081 |
| Android emulator | `npx expo start --android` | Requires Android Studio |
| iOS simulator | `npx expo start --ios` | Requires Xcode (macOS only) |
| Tunnel (remote) | `npx expo start --tunnel` | For access over internet |

> **Demo mode:** If you don't set `EXPO_PUBLIC_API_URL` or skip the backend, the app runs in demo mode with 56 built-in ledger accounts. Useful for UI development without needing the backend.

---

## 3. Backend Setup (ledback)

```bash
cd ../ledback

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

Refer to the `ledback` repo's README for its specific environment variables (database connection, port, etc.).

```bash
# Start backend dev server
npm run dev
```

The backend API will be available at `http://localhost:3000` (or whatever port it's configured on).

---

## 4. Running with Docker (Recommended for New PC)

See [03-docker-migration.md](03-docker-migration.md) for the full Docker-based setup — this is the recommended approach when moving to a new PC.

---

## 5. Development Workflow

### File Structure for Frontend Changes

| What you're changing | Where |
|---|---|
| Screens / Pages | `app/(tabs)/`, `app/entry/`, `app/ledger/` |
| Shared UI components | `components/` |
| State / business logic | `src/context/` |
| API calls | `src/storage/apiClient.ts` |
| Translations (account names) | `src/utils/ledgerLabels.ts` |
| Translations (UI strings) | `src/i18n/labels.ts` |
| Data models | `src/models/` |
| Seed data | `src/data/` |

### Hot Reload

Expo Metro bundler provides **Fast Refresh** by default. Save a file → the change appears in the app within seconds (no full reload needed for most changes).

### Clearing Cache

If you see stale behaviour or strange errors:

```bash
npx expo start -c   # -c clears the Metro cache
```

---

## 6. TypeScript

The project targets TypeScript `~5.9.2` with strict mode. Run type checking:

```bash
npx tsc --noEmit
```

There are no test files currently. TypeScript compilation is the primary correctness check.

---

## 7. Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | For cloud sync | Base URL of the backend API, no trailing slash. E.g. `http://192.168.1.10:3000` |

> The `EXPO_PUBLIC_` prefix is mandatory — Expo only injects variables with this prefix into the client bundle. Variables without this prefix are inaccessible at runtime.

---

## 8. Useful Scripts

```bash
# Type check only (no build)
npx tsc --noEmit

# Check for Expo SDK version mismatches
npx expo install --check

# Upgrade Expo SDK
npx expo upgrade

# List installed package versions
npm list --depth=0
```

---

## 9. Code Conventions

- **No comments unless the WHY is non-obvious.** The code should be self-documenting via naming.
- State mutations always go through `AppDataContext` — never call `apiClient.ts` directly from screens.
- All date comparisons use string splitting (`date.split('-')[0]`, etc.) — never `new Date()` on user-entered date strings.
- Custom ledger names are never auto-translated — only seed ledgers go through `getLedgerLabel()`.

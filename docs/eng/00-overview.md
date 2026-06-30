# MobiLedger — Project Overview

> **Version:** 1.0.0 | **Platform:** iOS / Android / Web | **Author:** Bikash Thapa

---

## What is MobiLedger?

**MobiLedger** is a professional, bilingual (English / Japanese) accounting and transaction management mobile application built on **React Native + Expo**. It converts daily financial entries (Cash Book / Journal) into structured accounting books — Trial Balance, Profit & Loss Statement, Balance Sheet, and Cash Flow reports — computed in real time on the device.

### Target Users

- Individual proprietors and freelancers
- Small businesses needing a portable digital ledger
- Accounting professionals working in Japan or with Japanese-language requirements

---

## Repository Structure

This project is split into two repositories:

| Repo | Purpose | Language / Stack |
|---|---|---|
| [`ledger`](https://github.com/Bikash4JP/ledger) | Mobile/Web frontend | React Native, Expo, TypeScript |
| [`ledback`](https://github.com/Bikash4JP/ledback) | REST API backend | Node.js (Express), Database |

---

## Key Features at a Glance

| Feature | Status |
|---|---|
| Cash Book & Journal (double-entry) | ✅ |
| Trial Balance | ✅ |
| Profit & Loss Statement | ✅ |
| Balance Sheet | ✅ |
| Cash Flow Analysis | ✅ |
| Ledger Management (CRUD) | ✅ |
| Bilingual UI (English / Japanese) | ✅ |
| 12 Currency Symbols | ✅ |
| PDF Export | ✅ |
| Cloud Sync via Backend | ✅ |
| Demo Mode (no login required) | ✅ |
| Dark / Light Theme | ✅ |

---

## Documentation Index

| Document | Description |
|---|---|
| [01-architecture.md](01-architecture.md) | System design, component diagram, data flow |
| [02-development.md](02-development.md) | Local development setup — with and without Docker |
| [03-docker-migration.md](03-docker-migration.md) | **How to continue development from a new/home PC** |
| [04-api-reference.md](04-api-reference.md) | Full REST API reference |
| [05-deployment.md](05-deployment.md) | EAS mobile builds and backend deployment |

---

## Quick Start (Minimal)

```bash
# Clone the frontend
git clone https://github.com/Bikash4JP/ledger.git
cd ledger
npm install

# Start in demo mode (no backend needed)
npx expo start -c
```

The app launches in **demo mode** automatically when no user is logged in — 56 built-in ledger accounts and sample transactions are preloaded. No backend or `.env` file is required to explore the UI.

---

*Built by **Bikash Thapa** — pre-release version.*

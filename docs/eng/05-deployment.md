# MobiLedger — Build & Deployment Guide

---

## 1. EAS Mobile Builds (React Native)

MobiLedger uses **Expo Application Services (EAS)** for building native iOS and Android apps.

### Prerequisites

```bash
npm install -g eas-cli
eas login    # log in with your Expo account
```

### EAS Build Profiles (`eas.json`)

| Profile | Command | Output | Use Case |
|---|---|---|---|
| `development` | `eas build --profile development` | Dev client APK / IPA | Local testing with dev client |
| `preview` | `eas build --profile preview` | APK (Android internal) | QA testers, internal distribution |
| `production` | `eas build --profile production` | AAB / IPA | App Store / Play Store submission |

### Build Commands

```bash
# Android preview build (APK for direct install)
eas build --platform android --profile preview

# iOS development build
eas build --platform ios --profile development

# Production build (both platforms)
eas build --platform all --profile production
```

### App Identifiers

| Platform | Identifier |
|---|---|
| Android package | `com.bikudev.mobiledger` |
| EAS Project ID | `c294a215-934e-4239-b46d-6af992cc82cd` |

---

## 2. EAS Update (OTA)

For JavaScript-only changes that don't touch native code, you can push OTA updates without a full app store review:

```bash
eas update --branch production --message "Fix P&L calculation"
```

> OTA updates only work for JS bundle changes. If you add a new native dependency or change `app.json` plugins, you must do a full `eas build`.

---

## 3. Environment for Production Builds

Before building for production, set the backend URL in EAS:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value https://your-production-api.com
```

Or configure it in `eas.json` under the `production` profile's `env` block.

---

## 4. Backend Deployment (ledback)

The backend (`ledback`) is a separate Node.js application. Recommended hosting options:

### Option A — Railway (Simplest)

1. Push `ledback` to GitHub.
2. Create a project at https://railway.app
3. Connect the `ledback` repo.
4. Railway auto-detects Node.js and deploys.
5. Add environment variables in the Railway dashboard.
6. Copy the generated URL (e.g. `https://ledback.up.railway.app`) → set as `EXPO_PUBLIC_API_URL`.

### Option B — Render

1. Go to https://render.com
2. New → Web Service → connect `ledback` repo.
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables.
6. Free tier available (spins down after inactivity).

### Option C — Self-hosted VPS (Ubuntu + PM2)

```bash
# On your VPS
git clone https://github.com/Bikash4JP/ledback.git
cd ledback
npm install
cp .env.example .env
# Edit .env with production values

# Install PM2 process manager
npm install -g pm2
pm2 start npm --name "ledback" -- start
pm2 save
pm2 startup   # auto-start on reboot
```

### Option D — Docker on VPS

```bash
# On your VPS
git clone https://github.com/Bikash4JP/ledback.git
cd ledback
docker compose up -d
```

---

## 5. Database

Check the `ledback` repository's `.env.example` for the database engine used. Common setups:

| Engine | Hosting Option |
|---|---|
| PostgreSQL | Railway Postgres, Supabase, Neon, AWS RDS |
| SQLite | Fine for personal use; not recommended for multi-user production |
| MySQL | PlanetScale, Railway MySQL |

---

## 6. Web Deployment (Expo Web)

The web version (`npx expo export --platform web`) produces a static build that can be deployed to:

- **Vercel**: `vercel --prod` (auto-detects Expo web static output)
- **Netlify**: drag-and-drop `dist/` folder
- **GitHub Pages**: push `dist/` to `gh-pages` branch

> The web build is a single-page app. For deep links to work (e.g. `/ledger/123`), configure your hosting to redirect all 404s to `index.html`.

---

## 7. Production Checklist

- [ ] `EXPO_PUBLIC_API_URL` points to production backend (HTTPS)
- [ ] Backend is running with a persistent database (not SQLite file)
- [ ] SSL/TLS enabled on the backend domain
- [ ] Remove `usesCleartextTraffic: true` from `app.json` for production (it allows plain HTTP — fine for dev, not for prod)
- [ ] EAS production build submitted to App Store / Play Store
- [ ] OTA update channel configured

---

## 8. Versioning

Bump the version in these two places before a release:

| File | Field |
|---|---|
| `package.json` | `"version"` |
| `app.json` | `expo.version` |

Also increment `expo.android.versionCode` (integer, must increase with every Play Store upload) in `app.json`.

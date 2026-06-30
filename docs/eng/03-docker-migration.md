# MobiLedger — Moving to a New / Home PC with Docker

> This guide is for developers who need to continue working on MobiLedger from a **different machine** — for example, when leaving an organization and switching to a personal laptop.

---

## Step 0 — Before You Leave Your Current PC

**Do this before you lose access:**

```bash
# From your current PC — inside the ledger repo
cd ledger
git add -A
git commit -m "chore: save work in progress before machine change"
git push origin main

# If you have any unstaged .env changes you need, save them securely elsewhere
# (never commit .env to git)
```

Make sure both repos (`ledger` and `ledback`) are fully pushed to GitHub.

---

## Step 1 — Install Prerequisites on Your Home Laptop

| Tool | Download |
|---|---|
| Docker Desktop | https://www.docker.com/products/docker-desktop |
| Git | https://git-scm.com |
| Node.js 20 LTS | https://nodejs.org (optional if using Docker only) |

After installing Docker Desktop:
- Open Docker Desktop and ensure the Docker engine is running (green status icon).
- On Windows: ensure WSL 2 integration is enabled (Docker Desktop → Settings → Resources → WSL Integration).

---

## Step 2 — Clone Both Repositories

```bash
# Create a workspace directory anywhere on your home laptop
mkdir -p ~/mobiledger-workspace && cd ~/mobiledger-workspace

# Clone frontend (ledger)
git clone https://github.com/Bikash4JP/ledger.git

# Clone backend (ledback)
git clone https://github.com/Bikash4JP/ledback.git
```

Your workspace structure:

```
mobiledger-workspace/
├── ledger/          ← React Native / Expo frontend
└── ledback/         ← Node.js REST API backend
```

---

## Step 3 — Configure Environment Files

### Frontend (ledger)

```bash
cd ledger
cp .env.example .env
```

Edit `.env`:

```bash
# For Docker Compose full-stack setup, point to the backend container
EXPO_PUBLIC_API_URL=http://localhost:3000
```

> **Note for mobile testing:** If you want to test on a physical phone (Expo Go), use your laptop's LAN IP instead of `localhost`:
> ```bash
> EXPO_PUBLIC_API_URL=http://192.168.x.x:3000
> ```
> Find your IP with `ipconfig` (Windows) or `ifconfig` (Mac/Linux).

### Backend (ledback)

```bash
cd ../ledback
cp .env.example .env
# Fill in database URL, port, and any secrets
```

---

## Step 4 — Run the Frontend with Docker

The `ledger` repo contains a ready-to-use `Dockerfile` and `docker-compose.yml`.

### Web Preview (fastest — no phone needed)

```bash
cd ledger
docker compose up
```

Open your browser at: **http://localhost:8081**

The app runs in **web mode** inside Docker. Source code is mounted as a volume, so any file edits on your laptop reflect instantly (hot reload).

### Physical Device Testing via Expo Go (LAN)

```bash
cd ledger
docker compose run --rm --service-ports app \
  npx expo start --host lan
```

Scan the QR code with the **Expo Go** app on your Android or iOS phone.  
Both your phone and laptop must be on the **same Wi-Fi network**.

### Tunnel Mode (works over any network)

```bash
cd ledger
docker compose run --rm --service-ports app \
  npx expo start --tunnel
```

Tunnel mode uses ngrok and works even if your phone and laptop are on different networks.

---

## Step 5 — Run the Full Stack (Frontend + Backend) with Docker

Once you have the ledback repo set up with its own `Dockerfile`, you can use the full-stack compose file provided below.

Create a file `mobiledger-workspace/docker-compose.full.yml`:

```yaml
# Full-stack MobiLedger development environment
# Place this file in the parent folder of both ledger/ and ledback/
# Usage: docker compose -f docker-compose.full.yml up

services:

  backend:
    build:
      context: ./ledback
      dockerfile: Dockerfile
    container_name: mobiledger-backend
    env_file:
      - ./ledback/.env
    ports:
      - "3000:3000"
    networks:
      - mobiledger-net
    restart: unless-stopped

  frontend:
    build:
      context: ./ledger
      dockerfile: Dockerfile
    container_name: mobiledger-frontend
    volumes:
      - ./ledger:/app
      - /app/node_modules
    env_file:
      - ./ledger/.env
    environment:
      - EXPO_PUBLIC_API_URL=http://backend:3000
    ports:
      - "8081:8081"
      - "19000:19000"
      - "19001:19001"
      - "19006:19006"
    depends_on:
      - backend
    networks:
      - mobiledger-net
    stdin_open: true
    tty: true
    restart: unless-stopped

networks:
  mobiledger-net:
    driver: bridge
```

Run it:

```bash
cd mobiledger-workspace
docker compose -f docker-compose.full.yml up
```

---

## Step 6 — Verify Everything Works

| Check | Expected |
|---|---|
| http://localhost:8081 | MobiLedger web app loads |
| http://localhost:3000/ledgers | Backend API responds with JSON |
| Login in the app | Auth works, data syncs |
| Add a transaction | It appears in the list immediately |

---

## Troubleshooting

### Docker build fails on `npm install`

```bash
# Rebuild without cache
docker compose build --no-cache
docker compose up
```

### Port already in use

```bash
# Find what is using port 8081
netstat -ano | findstr :8081        # Windows
lsof -i :8081                       # Mac/Linux
```

### Hot reload not working inside Docker

Make sure the volume mount is correct in `docker-compose.yml`. The `.:/app` volume maps your local source code into the container. Save a file and Metro should auto-reload.

### Cannot connect from phone (Expo Go)

1. Ensure your phone and laptop are on the **same Wi-Fi**.
2. Temporarily disable the firewall on your laptop for port 19000 and 8081.
3. Use `--tunnel` mode as a fallback (no network restrictions).

### App uses old data / stale cache

```bash
# Inside the container or locally
npx expo start -c
```

---

## Optional — Run Without Docker (bare Node.js)

If you prefer not to use Docker on your home laptop:

```bash
# Install Node.js 20 LTS first, then:
cd ledger
npm install
cp .env.example .env
# Edit .env
npx expo start
```

For the backend:

```bash
cd ledback
npm install
cp .env.example .env
npm run dev
```

---

## Summary Checklist

- [ ] All code pushed to GitHub from old PC
- [ ] Docker Desktop installed on home laptop
- [ ] Both repos cloned
- [ ] `.env` files configured
- [ ] `docker compose up` starts without errors
- [ ] App loads in browser at http://localhost:8081
- [ ] Login and data sync working (if backend running)

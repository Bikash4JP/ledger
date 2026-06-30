# ─────────────────────────────────────────────────────────────
#  MobiLedger — Development Container
#  React Native + Expo (SDK 54) + TypeScript
#
#  Web preview (browser):
#    docker compose up
#    → open http://localhost:8081
#
#  Physical device via Expo Go (LAN):
#    docker compose run --rm --service-ports app npx expo start --host lan
#
#  Physical device via tunnel (no LAN required):
#    docker compose run --rm --service-ports app npx expo start --tunnel
# ─────────────────────────────────────────────────────────────

FROM node:20-slim

# ── System dependencies ──────────────────────────────────────
# git/curl needed by Expo CLI; watchman is NOT in standard Debian repos
# — Metro uses its own inotify-based watcher inside the container.
RUN apt-get update && apt-get install -y \
    git \
    curl \
    bash \
    && rm -rf /var/lib/apt/lists/*

# ── Install Expo CLI globally ────────────────────────────────
RUN npm install -g expo-cli@6 eas-cli@latest

# ── Set working directory ────────────────────────────────────
WORKDIR /app

# ── Copy dependency manifests first (layer cache) ───────────
COPY package.json package-lock.json ./

# ── Install project dependencies ────────────────────────────
RUN npm install --legacy-peer-deps

# ── Copy rest of the source code ────────────────────────────
COPY . .

# ── Expose Metro bundler + DevTools ports ───────────────────
# 8081  → Metro bundler  (web preview, JS bundle)
# 19000 → Expo Go / LAN connection
# 19001 → Expo DevTools web UI
# 19006 → Expo web preview (expo start --web)
EXPOSE 8081 19000 19001 19006

# ── Default: start Expo in web mode (viewable in any browser) ─
CMD ["npx", "expo", "start", "--web", "--host", "0.0.0.0"]

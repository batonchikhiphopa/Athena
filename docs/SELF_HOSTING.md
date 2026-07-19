# Athena Self-Hosting

Athena can run as a production-style self-hosted app from a clean checkout.

The self-hosted runtime uses:

- compiled Express server;
- built Vite client;
- SQLite server database;
- optional Docker volume for persistent server data;
- `ATHENA_AI_PROVIDER=off` by default in the example config.

Raw diary text remains browser-local in IndexedDB. The server SQLite database stores textless metadata, hashes, sanitized signals, insight snapshots, self-report aggregates, and the canonical schema fingerprint.

The backend currently has no authentication. Keep the default loopback binding
or put an authenticated reverse proxy in front of Athena before exposing it to
any untrusted network.

## Local Production Run

```bash
cp .env.example .env
npm ci
npm run build
npm run start
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
npm ci
npm run build
npm run start
```

`npm run start` accepts only the current canonical backend schema. It initializes
a missing database from `schema.sql` and starts the compiled server with Node.
It does not convert databases created by older source revisions.

To intentionally discard textless backend state and recreate it from the
current schema:

```bash
npm run db:reset
```

Open:

- `http://127.0.0.1:3000/`
- `http://127.0.0.1:3000/config`

## Docker Run

```bash
docker build -t athena:latest .
docker run --rm -p 127.0.0.1:3000:3000 -v athena-data:/app/data athena:latest
```

The container uses:

- `ATHENA_HOST=0.0.0.0`
- `ATHENA_DATA_DIR=/app/data`
- `ATHENA_PROJECT_ROOT=/app`
- `ATHENA_CLIENT_DIST_DIR=/app/client/dist`

The `/app/data` volume stores the SQLite database.

## Docker Compose

```bash
docker compose up --build
```

Stop without deleting data:

```bash
docker compose down
```

Delete the named volume only when intentionally wiping server-side data:

```bash
docker compose down -v
```

## Backup

Stop Athena before copying the SQLite database.

Local run:

```bash
mkdir -p backups
cp data/athena.db backups/athena-$(date +%Y%m%d-%H%M%S).db
```

PowerShell:

```powershell
New-Item -ItemType Directory -Force backups
Copy-Item data\athena.db ("backups\athena-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".db")
```

Docker named volume:

```bash
docker run --rm \
  -v athena-data:/data \
  -v "$PWD/backups:/backup" \
  busybox \
  sh -c 'cp /data/athena.db /backup/athena-$(date +%Y%m%d-%H%M%S).db'
```

## Restore

Stop Athena first.

Local run:

```bash
cp backups/athena-backup.db data/athena.db
```

Docker named volume:

```bash
docker compose down
docker run --rm \
  -v athena-data:/data \
  -v "$PWD/backups:/backup" \
  busybox \
  sh -c 'cp /backup/athena-backup.db /data/athena.db'
docker compose up
```

Restored databases must match the `schema.sql` fingerprint of the running source
revision. Backend SQLite backup is not a full diary export because raw diary text
stays in browser-local storage.

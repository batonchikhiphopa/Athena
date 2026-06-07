# Deployment

Athena can run in development mode or as a production-style self-hosted app.

## Local Development

```powershell
npm install
Copy-Item .env.example .env
npm run migrate
npm run dev
```

In another terminal:

```powershell
npm run client:dev
```

The Vite dev server runs at `http://127.0.0.1:5173` and proxies API requests to `http://127.0.0.1:3000`.

## Production Build

```powershell
npm run build
npm run start
```

`npm run build` builds the Vite client and compiled TypeScript server.

`npm run start` runs compiled SQLite migrations first, then starts the compiled Node server. Express serves the built client from `client/dist`.

## Docker

```powershell
docker compose up --build
```

See [Self-Hosting](SELF_HOSTING.md) for Docker run, compose, SQLite volume, backup, and restore details.

## Runtime Data

Runtime server data lives in `data/` by default, or wherever `ATHENA_DATA_DIR` / `ATHENA_DATABASE_PATH` points.

A backend data backup includes:

- SQLite database in `data/`;
- `.env`;
- deployment-specific runtime files.

Browser-local raw diary data is not stored in the backend database, so backend backup is not a full diary export.

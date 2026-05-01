# Athena Client

This is the React/Vite browser client for Athena.

The client is responsible for the writing surface, local raw-text storage, local entry state, insight presentation, settings UI, and the offline-capable app shell. It talks to the backend through relative API paths such as `/entries`, `/extractions`, and `/insights`.

## Local Data

Raw diary text is stored in the browser, not in the backend database. The client keeps local entries in IndexedDB and sends only textless metadata, hashes, and sanitized signal payloads to the server.

The service worker in `public/sw.js` caches the app shell and static assets after the first successful online load. This keeps the app openable and useful for local writing when the network or backend is unavailable.

## Commands

From the repository root:

```bash
npm --prefix client run dev -- --host 127.0.0.1
npm --prefix client run build
npm --prefix client run lint
```

From this directory:

```bash
npm run dev
npm run build
npm run lint
```

The backend is started from the repository root with:

```bash
npm run dev
```

In development, Vite serves the client and proxies relative API calls to the backend. In the built app flow, Express serves `client/dist` from the backend process.

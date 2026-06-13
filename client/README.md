# Athena Client

This is the React/Vite browser client for Athena.

The client owns the light paper-like workspace, icon rail, editor-first writing
surface, searchable Entries card grid, floating Observations and Settings
panels, local raw-text storage, local entry state, browser-local hybrid search,
and the offline-capable app shell. It talks to the backend through relative API
paths such as `/entries`, `/extractions`, `/insights`, and `/analytics/v2`.

## Local Data

Raw diary text is stored in the browser, not in the backend database. The client
keeps local entries, drafts, raw self-report events, queue state, and optional
vault envelopes in IndexedDB. It sends only textless metadata, hashes, sanitized
signal payloads, and self-report daily aggregates to the server.

The service worker in `public/sw.js` caches the app shell and static assets after the first successful online load. This keeps the app openable and useful for local writing when the network or backend is unavailable.

## Commands

From the repository root:

```bash
npm --workspace athena-client run dev -- --host 127.0.0.1
npm --workspace athena-client run build
npm --workspace athena-client run lint
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

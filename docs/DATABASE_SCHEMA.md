# Database Schema

Athena has one canonical backend database schema in `schema.sql`.

During active development, older backend schemas are not supported and are not
upgraded. The backend SQLite database contains textless metadata and derived
state; raw diary text remains browser-local.

## Startup

Both development and production server entry points use the same flow:

1. Read and normalize `schema.sql`.
2. Compute its SHA-256 fingerprint.
3. If the database is empty, create the complete schema atomically and store the
   fingerprint in `athena_schema`.
4. If the stored fingerprint matches, start immediately without a write
   transaction or integrity scan.
5. The exact retired server-auth schema is upgraded once by dropping only
   `auth_sessions` and `auth_users` in a transaction and advancing the marker.
6. Any other unmarked or differing fingerprint fails with an explicit reset
   instruction.

There is no migration directory or ordered migration history. The auth-table
removal above is the only narrow compatibility path.

## Schema Changes

Edit `schema.sql` directly so it always describes the complete current database.
Any meaningful edit changes the fingerprint and makes existing backend databases
non-canonical.

Recreate the configured backend database explicitly:

```powershell
npm run db:reset
```

This removes only the configured SQLite database file and its `-wal` / `-shm`
companions, then creates a fresh canonical database. It does not delete
browser-local diary entries, but it does discard backend metadata, signals,
snapshots, and aggregates.

## Integrity Check

Fresh initialization runs SQLite `quick_check` and `foreign_key_check` inside the
schema transaction. Routine startup skips those full checks.

Run them explicitly when needed:

```powershell
npm run db:check
```

## Tests

The schema tests cover:

- fresh atomic initialization;
- constant-size subsequent verification;
- rejection of unmarked databases;
- rejection of a different schema fingerprint;
- transactional removal of the retired auth tables;
- rollback when canonical SQL is invalid.

# Database Migrations

Athena uses forward-only SQLite migrations stored in `migrations/`.

The production start command runs compiled migrations before starting the server:

```bash
npm run start
```

This executes:

```bash
node dist/server/server/db/migrate.js && node dist/server/server/server.js
```

## File Naming

Migration files must use this format:

```text
001_description.sql
002_next_change.sql
```

Rules:

- exactly three numeric digits;
- underscore after the number;
- lowercase letters, numbers, and underscores in the description;
- `.sql` extension;
- contiguous numeric sequence starting at `001`;
- no duplicate ids or sequence numbers.

Invalid examples:

- `1_init.sql`
- `001-init.sql`
- `003_skip.sql` when `002_*.sql` does not exist

## Runtime Behavior

The migration runner:

- creates `schema_migrations` if needed;
- validates the migration plan before applying files;
- uses `BEGIN IMMEDIATE` so only one writer can apply migrations at a time;
- records applied migrations in `schema_migrations`;
- skips already-applied migrations;
- rolls back the batch if any migration fails;
- runs `PRAGMA quick_check` and `PRAGMA foreign_key_check` after migration.

## Rollback Stance

Athena migrations are forward-only.

Rollback SQL is not currently maintained. Before applying migrations in a self-hosted deployment, stop Athena and back up the SQLite database. See [Self-Hosting](SELF_HOSTING.md) for backup and restore commands.

If a migration fails:

- the failed batch is rolled back;
- previously applied migrations remain recorded;
- restore from backup if the deployment needs to return to an earlier schema.

## Testing

Migration lifecycle tests cover:

- valid migrations are applied and recorded;
- invalid filenames are rejected;
- non-contiguous sequences are rejected;
- failed batches roll back.

Run:

```bash
npm test
```

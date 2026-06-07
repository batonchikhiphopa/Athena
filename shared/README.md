# Shared

Reserved for code that must be shared by `client` and `server`, such as typed API contracts or schema adapters.

Keep code in a feature folder first. Move it here only when both sides actually need it.

## Current Shape

- `contracts/` contains type-only protocol contracts shared by the browser app
  and the Express backend.

Do not place React components, Express handlers, SQLite rows, IndexedDB storage
logic, or UI view models here. Those stay in their owning client/server feature.

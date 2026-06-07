# Security Notes

This document summarizes security behavior. It does not replace a full third-party audit.

For a category-by-category self-check, see [Security Checklist](SECURITY_CHECKLIST.md).

## Authentication

Athena supports optional backend auth:

- one owner account;
- Argon2id password hashes;
- HttpOnly session cookies;
- hashed session tokens in SQLite;
- CSRF checks for mutating requests.

Auth can be disabled for passwordless local use.

## Data Protection

Raw diary text is browser-local. Backend entry payloads must remain textless.

Local app protection can encrypt browser-local records through the vault.

The backend stores:

- hashes;
- metadata;
- sanitized signals;
- self-report daily aggregates;
- snapshots.

## Provider Exposure

When analysis is enabled, the current entry text is transiently sent to the selected extraction provider.

- `ollama` is intended for local use.
- `gemini` sends current entry text to the Gemini API.
- `off` sends no model request.

This is a core limitation and must stay explicit in UI/docs.

## Security Checklist

- SQL injection: parameterized queries and repository review.
- XSS: React rendering and no unsafe HTML.
- CSRF: protected mutating routes.
- Session safety: expiration, logout, cookie flags.
- Sensitive data exposure: no backend raw text columns.
- Dependency audit: root and client `npm audit`.
- Rate limiting: auth endpoints and cloud provider paths.
- Error handling: no secrets or raw text in logs.

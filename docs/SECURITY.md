# Security Notes

This document summarizes security behavior. It does not replace a full third-party audit.

For a category-by-category self-check, see [Security Checklist](SECURITY_CHECKLIST.md).

## Backend Access

Athena currently has no backend authentication or session layer. The Express
API is open to any client that can reach its bound interface. The default
`127.0.0.1` binding is the intended local-development boundary; deployments on
another interface need a trusted network boundary or authenticated reverse
proxy.

The browser-local vault is separate and remains available for encrypting local
records and locking the UI.

## Data Protection

Raw diary text is browser-local. Backend entry payloads must remain textless.

Local app protection can encrypt browser-local records through the vault.

Browser-local semantic indexes, retrieved chunks, and RAG evidence packs are
private derived data. They must not be sent to backend APIs, exported silently,
or treated as anonymous.

The backend stores:

- hashes;
- metadata;
- sanitized signals;
- self-report daily aggregates;
- snapshots.

Local export files may contain raw diary text and raw self-report events after
explicit user action. Once downloaded, they are outside Athena's vault and app
lock protection.

## Provider Exposure

When analysis is enabled, the current entry text is transiently sent to the selected extraction provider.

- `ollama` is intended for local use.
- `gemini` sends current entry text to the Gemini API.
- `off` sends no model request.

This is a core limitation and must stay explicit in UI/docs.

## Security Checklist

- SQL injection: parameterized queries and repository review.
- XSS: React rendering and no unsafe HTML.
- Network exposure: keep the unauthenticated API off untrusted interfaces.
- Sensitive data exposure: no backend raw text columns.
- Dependency audit: root and client `npm audit`.
- Rate limiting: cloud provider paths.
- Error handling: no secrets or raw text in logs.

# Security

**Status:** platform-level decisions and what's implemented so far (Phase 1-2); authentication itself is
Phase 7 (Identity service).

## Secrets

No secret ever lives in source control. Local development uses `.env` (git-ignored, seeded from
`.env.example` which contains placeholders only) for Docker, and `appsettings.Development.json` /
`dotnet user-secrets` for `dotnet run`. Production uses environment variables sourced from the hosting
platform's secret store (e.g. Azure Key Vault) — never baked into a container image.

## Transport & headers

- HTTPS enforced (`UseHttpsRedirection`) on every API and at the Gateway.
- CORS is explicitly allow-listed per environment (`Cors:AllowedOrigins`), never `AllowAnyOrigin`.
- Planned before production launch (Phase 8): CSP, `X-Content-Type-Options`, `Referrer-Policy`,
  `Strict-Transport-Security`, and equivalent secure defaults at the Gateway so every downstream response
  inherits them.

## AuthN/AuthZ (Identity service, Phase 7)

- ASP.NET Core Identity + JWT access tokens + rotating refresh tokens.
- Role-based authorization: `SuperAdmin`, `Admin`, `ContentManager`, `CatalogManager`, `SalesManager`,
  `Viewer`.
- Account lockout after repeated failed logins; strong password policy enforced server-side.
- Public customers never need an account — quote/sample/contact requests are anonymous by design, which
  also reduces the platform's PII/auth attack surface.

## Input handling

- All persistence goes through EF Core parameterized queries — no string-concatenated SQL anywhere.
- FluentValidation validators run in the CQRS pipeline (`ValidationBehavior`) before a handler executes,
  and their failures surface as RFC 7807 `ProblemDetails` with field-level errors — never as a raw
  exception/stack trace.
- File uploads (quote/sample attachments, media library) are validated by type, extension and size before
  being persisted (Phase 6/7).
- Public forms (`/contact`, `/request-quote`, `/request-samples`) include honeypot fields; CAPTCHA
  integration is wired as an optional, swappable provider so local development never depends on it.

## Rate limiting

Anonymous, abuse-prone endpoints (`/login`, `/contact`, `/request-quote`, `/request-samples`, `/search`)
use ASP.NET Core's built-in rate limiting middleware, configured per-endpoint at the Gateway so limits are
enforced in one place regardless of which downstream service handles the request.

## Error responses

Every API uses a single `GlobalExceptionHandler` (see `MTArt.Observability.ErrorHandling`) that converts
unhandled exceptions into RFC 7807 `ProblemDetails` without leaking stack traces, SQL errors, or other
internal details to the client; only a correlation id is returned so the same request can be found in
structured logs.

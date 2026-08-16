# MT ART Platform

Premium multilingual website + administration platform for **MT ART**, a Moroccan manufacturer of
handmade Zellige, Bejmat, cement tiles and terracotta.

Backend: .NET 10 microservices (Clean Architecture + CQRS) behind a YARP gateway.
Frontend: React 19 + TypeScript + Vite (Phase 3+, see [docs](./docs/)).

For the full architecture rationale and diagrams, see [`docs/architecture.md`](./docs/architecture.md).

## 1. Architecture overview

```text
React Web  →  YARP Gateway  →  Identity / Catalog / Content / Inquiry / Media APIs
                                        │
                              RabbitMQ ─┴─ Notification Worker
```

Each service owns its own SQL Server database. See [`docs/architecture.md`](./docs/architecture.md) for
the full Mermaid diagram and per-service responsibilities.

## 2. Requirements

- [.NET 10 SDK](https://dotnet.microsoft.com/download) (see `global.json` for the exact pinned version)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for SQL Server, Redis, RabbitMQ, MinIO — or run them natively if you prefer)
- [Node.js 22+](https://nodejs.org/) (for the frontend, Phase 3+)
- A SQL client (Azure Data Studio, SSMS, DBeaver...) is optional but handy

## 3. Prerequisites / first-time setup

```bash
git clone <this-repo>
cd MTArt
cp .env.example .env      # then edit .env with real local secrets
```

Never commit your real `.env` file — it is already in `.gitignore`.

## 4. Running the backend with Docker (recommended)

```bash
docker compose up --build
```

This starts SQL Server, Redis, RabbitMQ, MinIO, and every API behind the Gateway on
`http://localhost:8080`. On first boot, each API automatically applies its EF Core migrations; Catalog
also seeds realistic demo data (clearly marked as seed data, safe to delete before going live).

Bring everything down (keeping data):

```bash
docker compose down
```

Bring everything down **and delete all data volumes** (fresh start):

```bash
docker compose down -v
```

Add the frontend once Phase 3 lands:

```bash
docker compose --profile web up --build
```

## 5. Running the backend without Docker (day-to-day development)

Start just the infrastructure containers, then run APIs individually from your IDE/CLI so you get fast
rebuilds and debugging:

```bash
docker compose up sqlserver redis rabbitmq minio
```

Then, in separate terminals:

```bash
dotnet run --project src/Services/Catalog/MTArt.Catalog.Api
dotnet run --project src/Services/Identity/MTArt.Identity.Api
dotnet run --project src/Services/Content/MTArt.Content.Api
dotnet run --project src/Services/Inquiry/MTArt.Inquiry.Api
dotnet run --project src/Services/Media/MTArt.Media.Api
dotnet run --project src/Services/Notification/MTArt.Notification.Worker
dotnet run --project src/Gateway/MTArt.ApiGateway
```

`appsettings.Development.json` in each project already points at `localhost` with the ports registered in
each project's `launchSettings.json`; the Gateway's `appsettings.Development.json` proxies to those same
ports so `http://localhost:5119/api/v1/catalog/products` works end-to-end locally without Docker.

Catalog API Swagger UI (Development only): `http://localhost:5249/swagger`.

## 6. Environment variables

All secrets/config live in `.env` (see [`.env.example`](./.env.example) for the full list with
descriptions) and are injected into containers by `docker-compose.yml`. Key groups:

| Group | Purpose |
|---|---|
| `SQLSERVER_*` | SQL Server container credentials/port |
| `REDIS_PORT` | Redis port |
| `RABBITMQ_*` | RabbitMQ credentials/ports (AMQP + management UI) |
| `MINIO_*` | Object storage credentials/bucket for media (dev) |
| `JWT_*` | Identity service token signing — **generate a real secret per environment** |
| `WEB_ORIGIN` / `GATEWAY_PORT` / `WEB_PORT` | CORS + exposed ports |
| `OTLP_ENDPOINT` / `SEQ_URL` | Optional observability sinks — leave blank locally |
| `SMTP_*` / `SALES_NOTIFICATION_EMAIL` | Notification worker email delivery |

For local `dotnet run` (outside Docker), equivalent placeholders already live in each service's
`appsettings.Development.json`. **Never** put real secrets in `appsettings*.json` — use `dotnet user-secrets`
or environment variables for anything beyond local placeholders.

## 7. Database migrations

Each service manages its own migrations independently. Example for Catalog:

```bash
cd src/Services/Catalog/MTArt.Catalog.Infrastructure
dotnet ef migrations add <Name> --startup-project ../MTArt.Catalog.Api
dotnet ef database update --startup-project ../MTArt.Catalog.Api
```

In Development, `dotnet run` on an API applies pending migrations automatically at startup — see each
`Program.cs`. In Docker/Production this also happens on container start today; once the platform is closer
to production launch, prefer running migrations as an explicit release step instead.

## 8. Seed data

Catalog seeds ~20 demo products, 10 colors, 5 collections, categories, shapes, formats and finishes on
first run in Development (see `MTArt.Catalog.Infrastructure/Persistence/Seed/CatalogSeeder.cs`). This data
is clearly demo content — replace it with your real catalog once imports (see §10) are ready.

## 9. Running tests

```bash
dotnet build MTArt.sln
dotnet test MTArt.sln
```

This runs unit tests, architecture tests (NetArchTest rules preventing Domain → Infrastructure/EF
dependencies) and integration tests for every service.

Frontend (Phase 3+):

```bash
cd src/Web/mtart-web
npm run lint
npm run typecheck
npm run test
npm run build
```

## 10. Importing your real product photography

See [`import/README.md`](./import/README.md) for the recommended folder layout and file naming
convention once you're ready to bring in real photography, and the CSV importer format for bulk product
creation (once the admin CSV importer ships in Phase 7).

## 11. Creating the first admin account

Ships with Identity service implementation (Phase 7). Until then, no account is required to browse
the public site or submit quote/sample/contact requests — see §"Identity Service" in
[`docs/architecture.md`](./docs/architecture.md).

## 12. Production deployment

See [`docs/deployment.md`](./docs/deployment.md) (added progressively — Phase 9).

## 13. Troubleshooting

**SQL Server container is unhealthy / APIs can't connect** — SQL Server needs ~20-30s to initialize on
first boot; `depends_on: condition: service_healthy` in `docker-compose.yml` already waits for this, but
if you're running `docker compose logs sqlserver` you should see `SQL Server is now ready for client
connections` before APIs come up.

**Port already in use** — every port is configurable via `.env` (e.g. `SQLSERVER_PORT`, `GATEWAY_PORT`).

**"File is locked by another process" during `dotnet build`** — a previous `dotnet run` for one of the
APIs is likely still running in the background; stop it before rebuilding.

**Central Package Management errors (`NU1008`)** — every `<PackageReference>` must omit `Version`; all
versions are pinned once in `Directory.Packages.props`.

## 14. Documentation index

- [`docs/architecture.md`](./docs/architecture.md) — architecture, diagrams, service boundaries
- [`docs/catalog-domain.md`](./docs/catalog-domain.md) — Catalog domain model (Phase 2, expand as needed)
- [`docs/localization.md`](./docs/localization.md) — i18n/RTL strategy
- [`docs/media-management.md`](./docs/media-management.md) — media pipeline
- [`docs/deployment.md`](./docs/deployment.md) — CI/CD and production deployment
- [`docs/security.md`](./docs/security.md) — security posture
- [`docs/seo.md`](./docs/seo.md) — SEO/rendering strategy
- [`docs/admin-guide.md`](./docs/admin-guide.md) — admin panel user guide

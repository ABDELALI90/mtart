# Deployment

**Status:** local Docker environment implemented in Phase 1 (`docker-compose.yml` +
`deploy/docker/*.Dockerfile`). CI/CD pipeline and production/Azure configuration land in Phase 9.

## Local (today)

```bash
cp .env.example .env   # edit with local secrets
docker compose up --build
```

See the root [`README.md`](../README.md) for the full command reference and troubleshooting.

## Container images

One Dockerfile per deployable, all building from the repo root as context so they can share
`Directory.Build.props`/`Directory.Packages.props` and cross-project references:

| Deployable | Dockerfile |
|---|---|
| Gateway | `deploy/docker/gateway.Dockerfile` |
| Identity API | `deploy/docker/identity-api.Dockerfile` |
| Catalog API | `deploy/docker/catalog-api.Dockerfile` |
| Content API | `deploy/docker/content-api.Dockerfile` |
| Inquiry API | `deploy/docker/inquiry-api.Dockerfile` |
| Media API | `deploy/docker/media-api.Dockerfile` |
| Notification Worker | `deploy/docker/notification-worker.Dockerfile` |
| React Web | `deploy/docker/web.Dockerfile` (Phase 3+, opt-in via the `web` compose profile) |

## Environments (planned progression)

`Development` → `Test` → `Staging` → `Production`, using ASP.NET Core's standard
`ASPNETCORE_ENVIRONMENT`-driven `appsettings.{Environment}.json` layering plus environment variables for
anything secret. No production URL or credential is ever hardcoded in source.

## CI/CD (Phase 9)

GitHub Actions pipeline (planned stages):

```text
Restore → Backend Build → Backend Tests
       → Frontend Install → Lint → Typecheck → Test → Build
       → Docker Build (all images)
       → Dependency/security scan
       → Publish artifacts/images
       → Deploy
```

## Target production topology (Azure, container-portable)

- Azure Container Apps (or any container host — nothing above is Azure-specific)
- Azure SQL (one logical database per service)
- Azure Cache for Redis
- Azure Blob Storage (Media service `IFileStorage` implementation)
- Azure Service Bus as a possible later replacement for RabbitMQ (MassTransit abstracts the transport)
- Azure Front Door / CDN in front of the prerendered web app and API gateway
- Application Insights (OpenTelemetry exporter already wired via `MTArt.Observability`)
- Key Vault for secrets

Domain and Application layers have zero Azure-specific dependencies anywhere — only Infrastructure-layer
implementations (storage, email) would change if the hosting provider changes.

## Backups & monitoring (Phase 9)

To be documented alongside the production environment: SQL Server backup/retention policy per service
database, RabbitMQ/MinIO data durability configuration, and alerting thresholds built on the existing
`/health`, `/health/ready`, `/health/live` endpoints and OpenTelemetry traces/metrics.

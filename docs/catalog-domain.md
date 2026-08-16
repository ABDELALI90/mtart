# Catalog Domain Model

**Status:** implemented in Phase 2. This documents the model as built in
`src/Services/Catalog/MTArt.Catalog.Domain`.

## Aggregates

| Aggregate | Purpose | Translation entity |
|---|---|---|
| `ProductCategory` | Zellige, Bejmat, Cement Tiles, Terracotta, ... | `ProductCategoryTranslation` |
| `Collection` | Curated editorial groupings (Classic Zellige, Atlas, ...) | `CollectionTranslation` |
| `Color` | Real photographed color samples, grouped by `ColorFamily` | `ColorTranslation` |
| `Shape` | Square, Hexagon, Triangle, Custom, ... | `ShapeTranslation` |
| `Finish` | Glossy, Matte, Raw, ... | `FinishTranslation` |
| `Format` | Physical dimensions + weights tied to a `Shape` | `FormatTranslation` |
| `Product` | The core catalog item | `ProductTranslation` |

## `Product` in detail

`Product` is the aggregate root for everything a customer sees on a product detail page. It references
`ProductCategory`, `Collection`, `Shape` and `Finish` by id (no cross-aggregate object references, per DDD
aggregate boundary rules), and owns:

- **`ProductTranslation`** (one per language) — name, descriptions, craftsmanship/installation/maintenance
  copy, SEO title/description. Query handlers apply language fallback (`ITranslation.ForLanguage()`):
  requested language → English → first available.
- **`ProductVariant`** — a concrete purchasable combination of `Color` + `Format` + `Finish`, with its own
  SKU, reference, stock status and dimensions (a Zellige Bejmat in Petrol Blue, 15×5cm, glossy, ref. 1020).
- **`ProductImage`** — a reference to a media item owned by the Media service (`MediaId`), tagged with a
  `ProductImageRole` (Primary, Hover, Gallery, TechnicalDiagram, Lifestyle) and display order. Catalog never
  stores binary image data.
- **`ProductRelatedProduct`** — curated "related products" links with display order.

Business rules enforced on the aggregate (see `Product.cs` and `tests/UnitTests/MTArt.Catalog.UnitTests`):

- A product can only be **published** if it has an English translation and at least one image.
- `Slug` is a value object (`MTArt.Catalog.Domain.ValueObjects.Slug`) enforcing a normalized, URL-safe
  format; uniqueness is enforced at the application layer (`AnyAsync` check before insert) and at the
  database layer (unique index via `OwnsOne`).
- Soft delete (`ISoftDeletable`) is used instead of hard delete so historical references (e.g. past
  quotations referencing a since-archived product) remain resolvable.

## Querying

All list/detail queries live in `Application/<Aggregate>/Queries/*` and:

- Use `AsNoTracking()` — nothing here is ever mutated through a query handler.
- Project directly into DTOs (`Application/<Aggregate>/Dtos/*`) — full entities are never returned from an
  endpoint.
- Compare value objects by their primitive `.Value` (e.g. `p.Slug.Value == slug.Value`) rather than by
  object equality, since EF Core cannot translate value-object equality directly into SQL for
  owned-type comparisons in a `Where` clause.

`GetProductsQuery` is the single filtering/sorting/pagination workhorse behind `/products`, `/in-stock`,
category pages and collection pages; `GetFeaturedProductsQuery` and `SearchProductsQuery` are thin wrappers
around it with preset filters.

## What's intentionally NOT here

- Pricing — out of scope for a B2B quotation-driven catalog (no cart, no checkout).
- Actual stock quantities — `StockStatus` is a coarse public-facing enum (`InStock`, `LowStock`,
  `MadeToOrder`, `ContactUs`); exact quantities are an admin-only concern reserved for Phase 7.
- Binary media — owned entirely by the Media service; Catalog only stores `MediaId` references.

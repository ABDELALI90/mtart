# Localization Strategy

**Status:** foundations (`LanguageCode`, `ITranslation`) implemented in Phase 1/2; frontend i18next/RTL
wiring lands in Phase 3.

## Supported languages

`en` (default), `fr`, `es`, `ar` (RTL) — see `MTArt.SharedKernel.Localization.LanguageCode`.

## Two kinds of content, two mechanisms

| Content type | Mechanism | Where |
|---|---|---|
| Static UI strings (buttons, labels, form validation, nav) | `i18next` JSON resource files, one namespace per feature | `src/Web/mtart-web/src/i18n/` (Phase 3) |
| Dynamic CMS/catalog content (product names, descriptions, page copy) | Translated database rows implementing `ITranslation` | `*Translation` entities per service |

Static UI text must **never** be hard-coded inside a React component — always routed through `i18next`.
Dynamic content must **never** be duplicated per-language in the frontend — it is always fetched from the
backend already resolved to the requested language via `?lang=` / `Accept-Language`-derived query params,
with fallback applied server-side.

## Translation fallback rule

`ITranslation.ForLanguage(languageCode)` (in `MTArt.SharedKernel.Localization`) implements: requested
language → English → first available translation. This runs in every Catalog/Content query handler so a
product missing, say, a Spanish translation still renders (in English) rather than 404s.

## URL structure

Every public route is prefixed with the language: `/en/...`, `/fr/...`, `/es/...`, `/ar/...`. Initial
architecture keeps slugs stable across languages (`/en/products/zellige-1020` and
`/fr/products/zellige-1020`); fully translated slugs per language are a possible future enhancement once
the SEO payoff is validated, without a breaking route-structure change.

## RTL

`ar` renders with `dir="rtl"` on `<html>`. Every shared component (header, mega menu, breadcrumbs, cards,
filters/drawers, galleries/carousels, forms, tables, pagination, footer, mobile nav, admin) must be built
with CSS logical properties (`margin-inline-start` rather than `margin-left`, etc.) and Tailwind's RTL-aware
utilities so mirroring is automatic rather than special-cased per component. Icons that convey direction
(arrows, chevrons) must flip with `dir`; icons that don't (search, phone, WhatsApp) must not.

## Admin translation UX

Admin editors work through an EN/FR/ES/AR tab strip per translatable entity (see §61 of the original
brief) with a completeness indicator per language, so content gaps are visible before publishing rather
than discovered by a site visitor.

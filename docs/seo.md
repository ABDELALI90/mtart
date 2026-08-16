# SEO & Rendering Strategy

**Status:** decision made in Phase 1 (documented now so Phases 3-4 build against it from day one);
implementation lands progressively in Phases 3, 4 and 8.

## The requirement

A plain client-side React SPA that renders an empty `<div id="root">` on first load is not acceptable —
crawlers and social-preview bots must see fully-formed HTML for every public marketing/catalog route, with
correct `<title>`, meta description, canonical, `hreflang` alternates, OpenGraph/Twitter tags and
structured data already present in the initial response.

## Chosen approach: build-time prerendering of public routes, SPA for `/admin`

Rather than running a Node SSR server in production (extra runtime, extra operational surface, extra
failure mode for a mostly-static marketing/catalog site), MT ART prerenders every public route at
**deploy time**:

1. The React app is built as a normal Vite SPA (`npm run build`).
2. A prerender step (Vite SSG-style, e.g. `vite-plugin-ssr`/a custom Puppeteer/`@vitejs` prerender script
   run in CI) enumerates every localized public URL by querying the Catalog/Content APIs at build time
   (products, collections, projects, blog posts, CMS pages, × 4 languages) and writes fully-rendered HTML
   for each into `dist/<lang>/<route>/index.html`, with `<head>` tags populated server-side from the same
   data the page renders (single source of truth — no separate "SEO data" duplication).
3. Nginx (see `deploy/docker/nginx/mtart-web.conf`) serves the prerendered HTML for the exact matching
   path when it exists, and falls back to the SPA shell (`index.html`) for anything else (client-side
   transitions, 404s, and the `/admin` app, which is intentionally **not** prerendered since it is
   `noindex` and always requires authentication).
4. Once hydrated, React Router takes over for all subsequent in-app navigation — the experience is
   identical to a normal SPA after first paint; only the *first* HTML response differs from a "raw" SPA.

This keeps Domain/Application layers, the API surface, and the runtime deployment topology unchanged
(no Node SSR server to deploy/scale/monitor), while giving crawlers exactly what they need. Content that
changes between deploys (e.g. a product's stock status) is still fetched live via TanStack Query after
hydration — the prerendered HTML only needs to be "correct enough to rank and preview well", not
byte-for-byte live.

If traffic/content-freshness requirements outgrow build-time prerendering later, the same architecture can
add an on-demand edge/CDN prerender cache (e.g. Cloudflare/Vercel-style) without touching the API layer.

## What every public page must ship

- One logical `<h1>` per page
- `<title>` and meta description translated per language
- `rel="canonical"`
- `hreflang` alternates for `en`, `fr`, `es`, `ar`, plus `x-default`
- OpenGraph + Twitter card tags
- JSON-LD structured data where it applies (Product, BreadcrumbList, FAQPage, Organization)
- Translated `alt` text on every image

## Sitemap & robots

- `/sitemap.xml` — generated at build/deploy time, includes every localized product, collection, project,
  blog post and CMS page URL with `<xhtml:link rel="alternate" hreflang="...">` entries.
- `/robots.txt` — allows all public routes, disallows `/admin` and API paths.

## Admin app

`/admin` is always client-rendered, requires authentication, and is marked `noindex, nofollow` — it is
never part of the prerender pipeline.

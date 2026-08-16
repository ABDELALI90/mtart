# MT ART — Web Frontend

React 19 + TypeScript + Vite single-page application for the public MT ART website. Talks to the
backend exclusively through the YARP Gateway (see `../../Gateway/MTArt.ApiGateway`).

## Stack

- **React 19** + **TypeScript** + **Vite 8**
- **React Router 7** — client-side routing, `/:lang` prefix for all public routes
- **TanStack Query 5** — server state, caching, retry/loading/error handling
- **React Hook Form + Zod** — forms and validation (see the Request a Quote page)
- **i18next / react-i18next** — English, French, Spanish, Arabic (RTL)
- **Tailwind CSS v4** — CSS-first theme in `src/styles/main.css` (no `tailwind.config.js`)
- **Lucide React** — icons
- **Axios** — centralized HTTP client (`src/services/apiClient.ts`)

## Getting started

```bash
cd src/Web/mtart-web
npm install
npm run dev
```

Open <http://localhost:5173/en> (or `/fr`, `/es`, `/ar`).

The Gateway must be running at the URL configured in `.env.development`
(`VITE_API_BASE_URL`, defaults to `http://localhost:5119`) for catalog data (collections, colors,
featured products, product listings/detail) to load. If the backend isn't running, every data
section degrades gracefully to an "unable to load" state with a retry button — the site never
shows a blank/crashed page.

## Scripts

| Command           | Description                                   |
| ----------------- | ---------------------------------------------- |
| `npm run dev`     | Start the Vite dev server on port 5173          |
| `npm run build`   | Type-check (`tsc -b`) then production build     |
| `npm run lint`    | Run `oxlint`                                    |
| `npm run preview` | Preview the production build locally            |

## Environment variables

| Variable              | Purpose                                              |
| ---------------------- | ----------------------------------------------------- |
| `VITE_API_BASE_URL`    | Base URL of the API Gateway, e.g. `http://localhost:5119` |

`.env.development` is committed with the local default; `.env.example` documents the variable for
other environments (staging/production values are injected at build/deploy time — see
`deploy/docker/web.Dockerfile`).

## Folder structure

```text
src/
├── app/            Router, providers (TanStack Query, Helmet), root App component
├── assets/         Local static assets bundled by Vite (icons, etc.)
├── components/
│   ├── layout/     Header, Footer, MobileNav, SiteLayout
│   ├── navigation/ MegaMenu, LanguageSwitcher, SearchOverlay
│   ├── home/       Homepage sections (Hero, ProductFamilies, ColorStory, ...)
│   ├── product/    ProductCard, ProductFilters, ColorSwatch
│   ├── gallery/    MasonryGallery
│   ├── forms/      FormField primitives, QuoteForm
│   └── ui/         ResponsiveImage, Button, Section, Badge, Skeleton, ErrorState, EmptyState
├── features/       Per-domain API calls + TanStack Query hooks (catalog, products, collections,
│                   colors, quote)
├── hooks/          useLang, useOnClickOutside
├── i18n/           i18next setup + en/fr/es/ar locale files
├── layouts/        LangLayout (:lang validation, <html lang/dir>, renders SiteLayout)
├── pages/          Route-level page components
├── services/       apiClient.ts — the single Axios instance every API call goes through
├── styles/         Tailwind v4 theme + global styles
├── types/          TypeScript mirrors of the Catalog API DTOs
└── utils/          paths.ts (localized route helpers), seo.tsx (PageMeta/Helmet)
```

## Images & catalogs

Real photography goes in `public/images/{home,products,colors,projects,craftsmanship,catalog}/` —
see `public/images/README.md`. PDF catalogs go in `public/catalogs/` — see
`public/catalogs/README.md`. Until real assets are added, every image slot renders an elegant,
clearly-labelled placeholder via `ResponsiveImage` instead of a broken image or stock photo.

## Notes on backend integration

- Every request goes through `src/services/apiClient.ts`, which points at the Gateway
  (`VITE_API_BASE_URL`) and normalizes errors into `ApiError` (RFC 7807 `ProblemDetails` aware).
- Product/category/collection/color/format/finish TypeScript types in `src/types/catalog.ts` are
  hand-mirrored from the actual Catalog API DTOs (not guessed) — keep them in sync if the backend
  DTOs change.
- The **Inquiry** service (Request a Quote submissions) is still a backend skeleton. The submission
  is isolated in `src/features/quote/submitQuote.ts` so only that file needs to change once the real
  endpoint ships; the UI never fakes a successful submission.
- Media/image URLs are not yet resolvable (Media service is a placeholder), so all product/category/
  collection images render as placeholders regardless of `imageId` — swap in real URLs in
  `ResponsiveImage` usages once the Media service exposes a public URL scheme.

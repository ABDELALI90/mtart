# MT ART image placement

Drop your real, high-resolution MT ART photography into the matching folder below. Filenames are used
as-is by the frontend components referenced in each folder — see the component source for the exact
expected filename where noted, or add new images and wire them into the corresponding component/section.

```text
public/images/
├── home/            Hero background, product-family cards (Zellige/Bejmat/Cement/Terracotta),
│                    craftsmanship, "Made in Morocco", professionals, catalog CTA sections
├── products/         Product gallery photos (organize by reference/family, matches import/products/)
├── colors/           Real photographed color swatches (matches import/colors/)
├── projects/         Project/architecture gallery photography (matches import/projects/)
├── craftsmanship/    Step-by-step production process photos/videos
└── catalog/          PDF catalog cover images (the PDFs themselves go in /public/catalogs, see below)
```

Until real photography is placed here, every image slot renders an elegant placeholder (a labelled,
textured block — never a generic/stock photo) via the shared `ResponsiveImage` component
(`src/components/ui/ResponsiveImage.tsx`), so the layout is already final and nothing needs to be
rebuilt once you add real photos — just drop files in and update the relevant `src` reference.

PDF catalogs go in **`public/catalogs/`** (sibling to `images/`), not here — see
`public/catalogs/README.md`.

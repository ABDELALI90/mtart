# Importing Real MT ART Assets

Drop your real photographs, factory images, project images, color samples and PDF catalogs into the
matching subfolder below. This folder is **not** served directly by any app — it is a staging area that
the Media admin importer (Phase 7) and the catalog CSV importer (Phase 7) read from, so nothing here needs
to be web-optimized up front; keep your best-quality originals.

```text
import/
├── products/
│   ├── zellige/
│   ├── bejmat/
│   ├── cement/
│   └── terracotta/
├── projects/
├── factory/
├── colors/
└── catalogs/
```

## Recommended file naming

Use lowercase, hyphen-separated names encoding: family — reference — color — format — shot type.

```text
zellige-1020-blue-10x10-front.jpg
zellige-1020-blue-10x10-stack.jpg
zellige-1020-blue-project-01.jpg
bejmat-2005-terracotta-15x5-front.jpg
cement-3010-charcoal-20x20-front.jpg
```

Shot type suffixes used by the importer/admin to guess the right `ProductImageRole`:

| Suffix | Maps to |
|---|---|
| `-front` | Primary |
| `-hover` / `-alt` | Hover |
| `-stack` / `-gallery-N` | Gallery |
| `-diagram` | TechnicalDiagram |
| `-project-N` / `-lifestyle-N` | Lifestyle |

## Colors

Name color sample photos after the color code used in the CSV import (`colors/1020-petrol-blue.jpg`) so
they can be matched automatically to a `Color` record by code.

## Catalogs (PDFs)

Name PDFs after the catalog they represent, e.g. `catalogs/mtart-zellige-collection-en.pdf`,
`catalogs/mtart-cement-tile-collection-fr.pdf` — the trailing language code lets the importer pre-fill the
catalog's language.

## CSV product import (Phase 7)

The admin CSV importer accepts:

```text
Reference,Category,Collection,NameEN,NameFR,NameES,NameAR,ColorCode,Format,Width,Height,Thickness,UnitsPerM2,WeightPerM2,StockStatus,ImageFileName
```

`ImageFileName` should reference a file already placed under `import/products/<family>/` using the naming
convention above. The importer validates every row before anything is written and requires explicit
confirmation, showing counts of valid/invalid rows, warnings, and products to be created vs. updated.

## Until real assets are added

Public pages render elegant placeholder blocks (clearly marked `TODO: replace with real photography`) —
generic stock/fake tile imagery is intentionally never used as a substitute for real MT ART photography.

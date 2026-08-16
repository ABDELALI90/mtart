"""Build classification + seed payload and copy catalog images into the web app."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
EXTRACTED = ROOT / "import" / "extracted"
MANIFEST = json.loads((EXTRACTED / "manifest.json").read_text(encoding="utf-8"))
WEB_PUBLIC = ROOT / "src" / "Web" / "mtart-web" / "public"
SEED_DIR = ROOT / "src" / "Services" / "Catalog" / "MTArt.Catalog.Infrastructure" / "SeedData"

PRODUCT_PAGES = {
    2, 4, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32,
    33, 34, 35, 36, 37, 38, 39, 40, 41, 43, 46, 47, 48, 55, 56, 60, 61, 63, 71, 72, 74, 79, 85,
    98, 108, 111, 125, 128, 131, 133, 136, 139, 156, 158, 159, 167, 168, 169, 178, 179, 180,
    189, 194, 195, 197, 203, 204, 206,
}
BORDER_PAGES = {182, 186, 187, 200}
MARKETING_PAGES = {1}
PATCHWORK_PAGES = {7, 17, 20, 61, 73, 79, 100, 103, 104, 133, 134, 193, 206}
PLAIN_PAGES = {2, 8, 11, 12}
HEXAGON_PAGES = {4, 8, 12}
FEATURED_PAGES = {9, 21, 24, 33, 35, 60, 69, 85, 126, 156, 179, 204}
SIMULATOR_PAGES = {6, 9, 13, 14, 15, 23, 27, 35, 37, 39, 60}  # star / cube families we author SVGs for


def classify(page: int) -> str:
    if page in MARKETING_PAGES:
        return "Marketing"
    if page in BORDER_PAGES:
        return "Border"
    if page in PATCHWORK_PAGES:
        return "Patchwork"
    if page in PLAIN_PAGES:
        return "ColorSample"
    if page in PRODUCT_PAGES:
        return "Product"
    return "Project"


def kind_label(page: int) -> str:
    mapping = {
        "Marketing": "Marketing",
        "Border": "Border",
        "Patchwork": "Patchwork",
        "ColorSample": "Plain",
        "Product": "Patterned",
        "Project": "Project",
    }
    return mapping[classify(page)]


def shape_of(page: int) -> str:
    if page in HEXAGON_PAGES:
        return "hexagon"
    if page in BORDER_PAGES:
        return "border"
    return "square"


def name_of(page: int, kind: str) -> dict[str, str]:
    import_id = f"CAT-P{page:03d}"
    en = {
        "Marketing": "MT ART Cement Tile Catalog",
        "Border": f"Cement Tile Border {import_id}",
        "Patchwork": f"Patchwork Cement Tiles {import_id}",
        "Plain": f"Plain Cement Tile {import_id}",
        "Patterned": f"Patterned Cement Tile {import_id}",
        "Project": f"Cement Tile Project {import_id}",
    }[kind]
    return {
        "en": en,
        "fr": en.replace("Cement Tile", "Carreau de ciment").replace("Patterned", "Motif").replace("Plain", "Uni").replace("Project", "Projet").replace("Border", "Bordure").replace("Patchwork", "Patchwork"),
        "es": en.replace("Cement Tile", "Baldosa de cemento").replace("Patterned", "Con motivo").replace("Plain", "Liso").replace("Project", "Proyecto").replace("Border", "Cenefa").replace("Patchwork", "Patchwork"),
        "ar": f"بلاط إسمنتي {import_id}",
    }


def main() -> None:
    catalog_dir = WEB_PUBLIC / "images" / "catalog"
    home_dir = WEB_PUBLIC / "images" / "home"
    colors_dir = WEB_PUBLIC / "images" / "colors"
    projects_dir = WEB_PUBLIC / "images" / "projects"
    catalogs_dir = WEB_PUBLIC / "catalogs"
    for folder in (catalog_dir, home_dir, colors_dir, projects_dir, catalogs_dir, SEED_DIR):
        folder.mkdir(parents=True, exist_ok=True)

    pages_out = []
    products_out = []
    for page in MANIFEST["pages"]:
        n = page["page"]
        cls = classify(n)
        kind = kind_label(n)
        images = page["images"]
        primary = images[0]["file"] if images else f"p{n:03d}.png"
        # Prefer the rendered page (full composition) when the embedded image is a crop.
        page_render = f"p{n:03d}.png"
        src_embedded = EXTRACTED / "images" / primary if images else None
        src_page = EXTRACTED / "pages" / page_render

        dest_name = page_render if src_page.exists() else primary
        dest = catalog_dir / dest_name
        if src_page.exists():
            shutil.copy2(src_page, dest)
        elif src_embedded and src_embedded.exists():
            shutil.copy2(src_embedded, dest)

        if src_embedded and src_embedded.exists() and src_embedded.name != dest_name:
            shutil.copy2(src_embedded, catalog_dir / src_embedded.name)

        record = {
            "page": n,
            "importId": page["importId"],
            "classification": cls,
            "kind": kind,
            "shape": shape_of(n),
            "priceDhPerM2": page["priceDhPerM2"],
            "priceUnit": "ml" if n in BORDER_PAGES else "m2",
            "imageUrl": f"/images/catalog/{dest_name}",
            "sourceImage": primary,
            "dominantColors": images[0]["dominantColors"] if images else [],
            "isSimulatorReady": n in SIMULATOR_PAGES,
            "isFeatured": n in FEATURED_PAGES,
            "names": name_of(n, kind),
        }
        pages_out.append(record)
        if cls != "Marketing":
            products_out.append(record)

    pdf_src = ROOT / "import" / "catalogs" / "catalog_with_price.pdf"
    if pdf_src.exists():
        shutil.copy2(pdf_src, catalogs_dir / "mtart-cement-tiles.pdf")

    # Homepage / about photography from real catalog pages.
    home_map = {
        "hero.jpg": "p018.png",
        "zellige.jpg": "p144.png",
        "cement.jpg": "p009.png",
        "bejmat.jpg": "p162.png",
        "terracotta.jpg": "p002.png",
        "craftsmanship.jpg": "p197.png",
        "morocco.jpg": "p201.png",
        "professionals.jpg": "p069.png",
        "catalog.jpg": "p085.png",
        "about-hero.jpg": "p076.png",
        "about-heritage.jpg": "p001.png",
        "about-factory.jpg": "p197.png",
        "about-international.jpg": "p120.png",
    }
    for dest_name, src_name in home_map.items():
        src = EXTRACTED / "pages" / src_name
        if src.exists():
            img = Image.open(src).convert("RGB")
            img.save(home_dir / dest_name, quality=88)

    # Project gallery: a spread of installed-project pages.
    project_pages = [p for p in pages_out if p["classification"] == "Project"][:24]
    for index, page in enumerate(project_pages, start=1):
        src = EXTRACTED / "pages" / f"p{page['page']:03d}.png"
        if src.exists():
            img = Image.open(src).convert("RGB")
            img.save(projects_dir / f"project-{index:02d}.jpg", quality=86)

    # Cement-tile colour library sampled from real catalog photography.
    color_sources = [
        ("MC01", "Ivory", "Ivoire", "Marfil", "عاجي", "White", 2, "#efe6c9"),
        ("MC02", "Snow", "Neige", "Nieve", "ثلجي", "White", 11, "#f4f1ea"),
        ("MC03", "Sand", "Sable", "Arena", "رملي", "Beige", 2, "#d9c38a"),
        ("MC04", "Cream", "Crème", "Crema", "كريمي", "Cream", 32, "#e8dcc4"),
        ("MC05", "Mustard", "Moutarde", "Mostaza", "خردلي", "Yellow", 23, "#d4a017"),
        ("MC06", "Ochre", "Ocre", "Ocre", "مغرة", "Yellow", 39, "#c48a2b"),
        ("MC07", "Terracotta", "Terracotta", "Terracota", "طيني", "Terracotta", 13, "#b45a32"),
        ("MC08", "Rust", "Rouille", "Óxido", "صدئ", "Orange", 48, "#a33b24"),
        ("MC09", "Burgundy", "Bordeaux", "Burdeos", "خمري", "Red", 26, "#7a2430"),
        ("MC10", "Blush", "Rosé", "Rosa", "وردي", "Pink", 14, "#e3b7b0"),
        ("MC11", "Sage", "Sauge", "Salvia", "مريمي", "Green", 15, "#8a9a6a"),
        ("MC12", "Olive", "Olive", "Oliva", "زيتوني", "Green", 46, "#6b6b3a"),
        ("MC13", "Emerald", "Émeraude", "Esmeralda", "زمردي", "Green", 57, "#2f6e4e"),
        ("MC14", "Turquoise", "Turquoise", "Turquesa", "فيروزي", "Turquoise", 11, "#5aa8a0"),
        ("MC15", "Aqua", "Aqua", "Agua", "مائي", "Turquoise", 12, "#7ec8c0"),
        ("MC16", "Sky", "Ciel", "Cielo", "سماوي", "Blue", 28, "#8bb8d4"),
        ("MC17", "Petrol", "Pétrole", "Petróleo", "بترولي", "Blue", 30, "#1f4a4c"),
        ("MC18", "Navy", "Marine", "Marino", "كحلي", "Blue", 24, "#1a3358"),
        ("MC19", "Cobalt", "Cobalt", "Cobalto", "كوبالت", "Blue", 41, "#2a4d8f"),
        ("MC20", "Charcoal", "Charbon", "Carbón", "فحمي", "Grey", 27, "#3a3a3a"),
        ("MC21", "Stone", "Pierre", "Piedra", "حجري", "Grey", 31, "#9a958c"),
        ("MC22", "Graphite", "Graphite", "Grafito", "غرافيت", "Grey", 37, "#5c5c5c"),
        ("MC23", "Black", "Noir", "Negro", "أسود", "Black", 21, "#1c1c1c"),
        ("MC24", "Ink", "Encre", "Tinta", "حبر", "Black", 33, "#111111"),
        ("MC25", "Taupe", "Taupe", "Topo", "رمادي بني", "Brown", 71, "#8a7460"),
        ("MC26", "Cocoa", "Cacao", "Cacao", "كاكاو", "Brown", 112, "#5a3a28"),
        ("MC27", "White Field", "Blanc", "Blanco", "أبيض", "White", 60, "#f7f4ee"),
        ("MC28", "Mint", "Menthe", "Menta", "نعناعي", "Green", 84, "#c5d5c0"),
        ("MC29", "Powder Blue", "Bleu Poudre", "Azul Polvo", "أزرق بودرة", 43, "#c5d4e0") if False else ("MC29", "Powder Blue", "Bleu Poudre", "Azul Polvo", "أزرق بودرة", "Blue", 43, "#c5d4e0"),
        ("MC30", "Coral", "Corail", "Coral", "مرجاني", "Orange", 22, "#d4786a"),
        ("MC31", "Forest", "Forêt", "Bosque", "غابة", "Green", 105, "#2f5a3a"),
        ("MC32", "Slate", "Ardoise", "Pizarra", "أردواز", "Grey", 126, "#4a5560"),
        ("MC33", "Sandstone", "Grès", "Arenisca", "حجر رملي", "Beige", 32, "#cbb89a"),
        ("MC34", "Deep Green", "Vert Profond", "Verde Profundo", "أخضر عميق", "Green", 143, "#1f4a3a"),
        ("MC35", "Marigold", "Souci", "Caléndula", "قطيفي", "Yellow", 93, "#e0b030"),
        ("MC36", "Special Mix", "Mélange", "Mezcla", "مزيج خاص", "Special", 20, "#6a5a4a"),
    ]

    colors_out = []
    for order, (code, en, fr, es, ar, family, page, hex_value) in enumerate(color_sources):
        src = EXTRACTED / "pages" / f"p{page:03d}.png"
        dest = colors_dir / f"{code.lower()}.jpg"
        if src.exists():
            img = Image.open(src).convert("RGB")
            w, h = img.size
            crop = img.crop((int(w * 0.22), int(h * 0.12), int(w * 0.78), int(h * 0.72)))
            crop = crop.resize((720, 720))
            crop.save(dest, quality=88)
        colors_out.append({
            "code": code,
            "family": family,
            "hex": hex_value,
            "imageUrl": f"/images/colors/{code.lower()}.jpg",
            "materialType": "CementTile",
            "isFeatured": order < 12,
            "names": {"en": en, "fr": fr, "es": es, "ar": ar},
        })

    classification = {
        "sourceCatalog": MANIFEST["sourceCatalog"],
        "pageCount": MANIFEST["pageCount"],
        "counts": {
            "product": sum(1 for p in pages_out if p["classification"] == "Product"),
            "project": sum(1 for p in pages_out if p["classification"] == "Project"),
            "patchwork": sum(1 for p in pages_out if p["classification"] == "Patchwork"),
            "plain": sum(1 for p in pages_out if p["classification"] == "ColorSample"),
            "border": sum(1 for p in pages_out if p["classification"] == "Border"),
            "marketing": sum(1 for p in pages_out if p["classification"] == "Marketing"),
            "simulatorReady": sum(1 for p in pages_out if p["isSimulatorReady"]),
        },
        "pages": pages_out,
        "colors": colors_out,
        "products": products_out,
    }

    (EXTRACTED / "classification.json").write_text(json.dumps(classification, indent=2, ensure_ascii=False), encoding="utf-8")
    (SEED_DIR / "catalog-import.json").write_text(json.dumps(classification, ensure_ascii=False), encoding="utf-8")
    print("pages", len(pages_out))
    print("products", len(products_out))
    print("colors", len(colors_out))
    print("counts", classification["counts"])
    print("catalog images", len(list(catalog_dir.glob("*"))))


if __name__ == "__main__":
    main()

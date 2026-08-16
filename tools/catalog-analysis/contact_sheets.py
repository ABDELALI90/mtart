"""Build labelled contact sheets (4x4 pages each) from rendered catalog pages
so a human/agent can classify all 207 pages quickly."""

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2] / "import" / "extracted"
PAGES = sorted((ROOT / "pages").glob("p*.png"))
OUT = ROOT / "sheets"
OUT.mkdir(exist_ok=True)

COLS, ROWS = 4, 4
CELL_W, CELL_H = 320, 420
LABEL_H = 28

per_sheet = COLS * ROWS
for sheet_index in range(0, len(PAGES), per_sheet):
    chunk = PAGES[sheet_index : sheet_index + per_sheet]
    sheet = Image.new("RGB", (COLS * CELL_W, ROWS * (CELL_H + LABEL_H)), "white")
    draw = ImageDraw.Draw(sheet)
    for i, page_path in enumerate(chunk):
        col, row = i % COLS, i // COLS
        x, y = col * CELL_W, row * (CELL_H + LABEL_H)
        img = Image.open(page_path)
        img.thumbnail((CELL_W - 8, CELL_H - 8))
        sheet.paste(img, (x + (CELL_W - img.width) // 2, y + LABEL_H + 2))
        draw.rectangle([x, y, x + CELL_W, y + LABEL_H], fill="#222222")
        draw.text((x + 8, y + 6), page_path.stem, fill="white")
    number = sheet_index // per_sheet + 1
    sheet.save(OUT / f"sheet{number:02d}.jpg", quality=82)
    print(f"sheet{number:02d}.jpg: {chunk[0].stem}..{chunk[-1].stem}")

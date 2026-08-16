from pathlib import Path

import pymupdf

folder = Path(r"E:\art carreaux ciment\ART\import\colors")
pdfs = list(folder.glob("*.pdf"))
print("pdfs", [p.name for p in pdfs])
pdf = pdfs[0]
doc = pymupdf.open(pdf)
print("pages", doc.page_count)
out = Path(r"E:\art carreaux ciment\ART\import\extracted\unicolor")
out.mkdir(parents=True, exist_ok=True)
for i, page in enumerate(doc):
    print("--- page", i + 1, "size", page.rect)
    words = page.get_text("words")
    nums = [w for w in words if w[4].strip().isdigit() and 2 <= len(w[4].strip()) <= 4]
    print("words", len(words), "numeric", len(nums))
    print("numeric sample", [w[4] for w in nums[:80]])
    print("all unique nums", sorted({w[4].strip() for w in nums}, key=lambda x: int(x)))
    pix = page.get_pixmap(matrix=pymupdf.Matrix(2, 2), alpha=False)
    dest = out / f"page-{i + 1}.png"
    pix.save(dest)
    print("saved", dest, pix.width, pix.height)
    print("text snippet:", page.get_text()[:800].replace("\n", " | "))

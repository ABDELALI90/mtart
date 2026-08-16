/**
 * Converts full-page catalog PNGs to WebP (max 1600px) plus card thumbs (max 800px).
 * Does not touch SVG moulds, -i1.jpeg crops, or catalog/web (removed separately).
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const catalogDir = path.resolve(import.meta.dirname, '../public/images/catalog');
const pngs = fs.readdirSync(catalogDir).filter((name) => /^p\d+\.png$/i.test(name)).sort();

if (pngs.length === 0) {
  console.log('No catalog PNGs to convert.');
  process.exit(0);
}

console.log(`Converting ${pngs.length} catalog PNGs…`);
let converted = 0;
let skippedAlphaWarning = 0;

for (const file of pngs) {
  const input = path.join(catalogDir, file);
  const stem = file.replace(/\.png$/i, '');
  const fullOut = path.join(catalogDir, `${stem}.webp`);
  const thumbOut = path.join(catalogDir, `${stem}-thumb.webp`);

  const meta = await sharp(input, { failOn: 'none' }).metadata();
  if (meta.format && meta.format !== 'png') {
    console.warn(`Skip unexpected format ${meta.format}: ${file}`);
    continue;
  }
  if (meta.hasAlpha) {
    skippedAlphaWarning += 1;
  }

  await sharp(input, { failOn: 'none' })
    .rotate()
    .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82, alphaQuality: 90, effort: 4 })
    .toFile(fullOut);

  await sharp(input, { failOn: 'none' })
    .rotate()
    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80, alphaQuality: 90, effort: 4 })
    .toFile(thumbOut);

  converted += 1;
  if (converted % 20 === 0 || converted === pngs.length) {
    console.log(`  ${converted}/${pngs.length}`);
  }
}

console.log(`Done. Converted ${converted} images to WebP (full + thumb). Alpha-channel PNGs preserved: ${skippedAlphaWarning}.`);

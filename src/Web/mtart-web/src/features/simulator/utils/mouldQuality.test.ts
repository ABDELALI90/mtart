/** @vitest-environment happy-dom */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { scoreMouldMarkup } from './mouldQuality';

function readPublic(relative: string) {
  return readFileSync(resolve(process.cwd(), `public${relative}`), 'utf8');
}

describe('MOR mould quality', () => {
  it('rejects the fragment-heavy MOR-004 trace and keeps the usable MOR-017 module', () => {
    const broken = scoreMouldMarkup(readPublic('/moulds/moroccan/MOR-004.svg'));
    const clean = scoreMouldMarkup(readPublic('/moulds/moroccan/MOR-017.svg'));
    expect(broken.ok).toBe(false);
    expect(broken.reason).toBeTruthy();
    expect(clean.ok).toBe(true);
    expect(clean.hasCenterMotif).toBe(true);
  });
});

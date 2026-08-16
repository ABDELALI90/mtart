import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { mergeCatalogues, matchesMouldSearch, preferCatalogueDetail, toDetail, toListItem, type CatalogueEntry, type MouldCatalogue } from './catalogue';
import { hydrateMouldDetail, hydrateMouldListItem, isRenderableMould } from './mouldAssets';

function entry(partial: Partial<CatalogueEntry> & Pick<CatalogueEntry, 'reference' | 'editable'>): CatalogueEntry {
  return {
    id: partial.reference,
    slug: partial.reference.toLowerCase(),
    name: partial.name ?? partial.reference,
    category: partial.category ?? 'geometric',
    family: 'cement',
    svgUrl: partial.editable ? `/moulds/${partial.reference}.svg` : null,
    thumbnail: partial.thumbnail ?? (partial.editable ? `/moulds/${partial.reference}.svg` : '/images/import/p004-i1.jpeg'),
    editable: partial.editable,
    status: partial.editable ? 'original' : 'needs-vectorization',
    regions: partial.regions ?? [],
    displayOrder: partial.displayOrder ?? 1,
    ...partial,
  };
}

describe('simulator catalogue merge', () => {
  it('keeps static moulds when the API only returns a small subset', () => {
    const staticItems = [
      toListItem(entry({ reference: '1040', editable: true, displayOrder: 1 })),
      toListItem(entry({ reference: 'GEO-001', editable: true, displayOrder: 2 })),
      toListItem(entry({ reference: 'MOR-001', editable: false, displayOrder: 3 })),
    ];
    const apiItems = [toListItem(entry({ reference: '1040', editable: true, displayOrder: 1 }))];
    const merged = mergeCatalogues(staticItems, apiItems);
    expect(merged.map((item) => item.reference)).toEqual(['1040', 'GEO-001', 'MOR-001']);
  });

  it('excludes blank uni / 1010 cards', () => {
    const merged = mergeCatalogues(
      [
        toListItem(entry({ reference: '1010', slug: 'uni', editable: true, svgUrl: '/images/patterns/uni.svg' })),
        toListItem(entry({ reference: '1040', editable: true })),
      ],
      [],
    );
    expect(merged.map((item) => item.reference)).toEqual(['1040']);
  });

  it('lists editable moulds before raster-only photographs', () => {
    const merged = mergeCatalogues(
      [
        toListItem(entry({ reference: 'MOR-010', editable: false, displayOrder: 1 })),
        toListItem(entry({ reference: '1025', editable: true, displayOrder: 9 })),
      ],
      [],
    );
    expect(merged[0].reference).toBe('1025');
    expect(merged[0].isCustomizable).toBe(true);
    expect(merged[1].isCustomizable).toBe(false);
  });

  it('filters search on the merged list instead of truncating it', () => {
    const items = [
      toListItem(entry({ reference: '1040', name: 'Quatrefoil', editable: true })),
      toListItem(entry({ reference: 'MOR-042', name: 'Moroccan Star', editable: false })),
    ];
    expect(items.filter((item) => matchesMouldSearch(item, '1040'))).toHaveLength(1);
    expect(items.filter((item) => matchesMouldSearch(item, 'star'))).toHaveLength(1);
    expect(items.filter((item) => matchesMouldSearch(item, ''))).toHaveLength(2);
  });
});

describe('generated mould catalogue', () => {
  const catalogue = JSON.parse(
    readFileSync(resolve(process.cwd(), 'public/moulds/catalogue.json'), 'utf8'),
  ) as MouldCatalogue;
  const quatrefoil = readFileSync(resolve(process.cwd(), 'public/images/patterns/quatrefoil.svg'), 'utf8');

  it('contains 50+ tile-pattern references after scanning the import folder', () => {
    expect(catalogue.diagnostics.totalSourceAssets).toBeGreaterThanOrEqual(200);
    expect(catalogue.diagnostics.tilePatternCandidates).toBeGreaterThanOrEqual(50);
    expect(catalogue.items.length).toBeGreaterThanOrEqual(50);
    expect(catalogue.items.some((item) => item.reference === '1010')).toBe(false);
  });

  it('keeps original moulds including 1040 and imported Moroccan references', () => {
    const refs = new Set(catalogue.items.map((item) => item.reference));
    for (const reference of ['1025', '1026', '1027', '1035', '1040', '1042', '1048', '1050', '1070', '1072', '1080', '1088', 'GEO-001', 'ZL-001', 'MOR-001']) {
      expect(refs.has(reference)).toBe(true);
    }
  });

  it('keeps visible stroke geometry on built-in editable references', () => {
    const needed = ['1025', '1026', '1027', '1035', '1040', '1042', '1048', '1050', '1055', '1060', '1068', '1070', '1072', '1075', '1080'];
    for (const reference of needed) {
      const item = catalogue.items.find((entry) => entry.reference === reference);
      expect(item?.svgUrl, reference).toBeTruthy();
      const svg = readFileSync(resolve(process.cwd(), `public${item!.svgUrl}`), 'utf8');
      expect(svg).toMatch(/<(path|polygon|circle|rect)\b/i);
      expect(svg).toMatch(/stroke="#/i);
      expect(svg).not.toMatch(/stroke-opacity:\s*0\s*!important/);
      expect(svg).not.toMatch(/<style[\s\S]*\[data-region\]/);
    }
  });

  it('publishes only high-confidence Moroccan SVGs, never photo traces', () => {
    const imported = catalogue.items.filter((item) => item.reference.startsWith('MOR-') && item.editable);
    for (const item of imported) {
      expect(item.svgUrl).toMatch(/^\/moulds\/moroccan\/MOR-\d+\.svg$/);
      expect(item.status).toBe('editable-svg');
      const svg = readFileSync(resolve(process.cwd(), `public${item.svgUrl}`), 'utf8');
      expect(svg).toContain('fill="#FFFFFF"');
      expect(svg).toContain('stroke="#666666"');
      expect(svg).not.toMatch(/<image /i);
    }
    expect(imported.some((item) => item.reference === 'MOR-017')).toBe(true);
    const rejected = catalogue.items.find((item) => item.reference === 'MOR-001');
    expect(rejected?.editable).toBe(false);
    expect(rejected?.svgUrl).toBeNull();
  });
});

describe('preferCatalogueDetail', () => {
  it('keeps the generated SVG when the API still returns a photograph', () => {
    const local = entry({
      reference: 'MOR-018',
      editable: true,
      svgUrl: '/moulds/moroccan/MOR-018.svg',
      regions: [{ key: 'background', name: 'Background' }, { key: 'region-1', name: 'Area 1' }],
    });
    const api = {
      ...toDetail(local),
      vectorAssetUrl: null,
      previewImageUrl: '/images/catalog/p029.png',
      isCustomizable: false,
      regions: [],
    };
    const merged = preferCatalogueDetail(api, local);
    expect(merged?.vectorAssetUrl).toBe('/moulds/moroccan/MOR-018.svg');
    expect(merged?.isCustomizable).toBe(true);
    expect(merged?.previewImageUrl).toBe('/moulds/moroccan/MOR-018.svg');
    expect(merged?.regions.map((region) => region.regionKey)).toEqual(['background', 'region-1']);
  });
});

describe('simulator mould asset hydration', () => {
  it('hides broken imported MOR traces from the customer simulator', () => {
    const mor006 = hydrateMouldListItem({
      id: 'MOR-006',
      reference: 'MOR-006',
      slug: 'mor-006',
      name: 'Moroccan Star MOR-006',
      categorySlug: 'geometric',
      categoryName: 'geometric',
      previewImageUrl: '/images/catalog/p014.png',
      vectorAssetUrl: '/moulds/imported/MOR-006.svg',
      regionCount: 0,
      isSimulatorReady: true,
      isCustomizable: true,
      displayOrder: 250,
    });
    expect(mor006.vectorAssetUrl).toBeNull();
    expect(isRenderableMould(mor006)).toBe(false);

    const mor004 = hydrateMouldListItem({
      ...mor006,
      id: 'MOR-004',
      reference: 'MOR-004',
      slug: 'mor-004',
      vectorAssetUrl: '/moulds/moroccan/MOR-004.svg',
    });
    expect(isRenderableMould(mor004)).toBe(false);

    const mor017 = hydrateMouldListItem({
      ...mor006,
      id: 'MOR-017',
      reference: 'MOR-017',
      slug: 'mor-017',
      vectorAssetUrl: '/moulds/imported/MOR-017.svg',
    });
    expect(mor017.vectorAssetUrl).toBe('/moulds/moroccan/MOR-017.svg');
    expect(isRenderableMould(mor017)).toBe(true);
  });

  it('uses the same resolved SVG for thumbnail and selected editor detail', () => {
    const list = hydrateMouldListItem(toListItem(entry({
      reference: 'MOR-017',
      editable: true,
      svgUrl: '/moulds/moroccan/MOR-017.svg',
    })));
    const detail = hydrateMouldDetail(toDetail(entry({
      reference: 'MOR-017',
      editable: true,
      svgUrl: '/moulds/moroccan/MOR-017.svg',
    })));
    expect(list.vectorAssetUrl).toBe('/moulds/moroccan/MOR-017.svg');
    expect(detail.vectorAssetUrl).toBe(list.vectorAssetUrl);
    expect(detail.previewImageUrl).toBe(list.previewImageUrl);
  });
});

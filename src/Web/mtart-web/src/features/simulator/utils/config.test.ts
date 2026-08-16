import { applyRegionColor, calculateSurface, defaultsFromRegions, nextRotation, parseShareParams, resolveRegionKeys, serializeShareParams, suggestLayoutRotations } from './config';
import { useSimulatorStore } from '../store/useSimulatorStore';
import { describe, expect, it } from 'vitest';

describe('region color changes', () => {
  it('changes only the selected region', () => {
    const current = { background: '#EFE6D8', petalA: '#B5623F', petalB: '#9CAA8C', center: '#1F4E79' };
    const next = applyRegionColor(current, 'petalA', '#C76D3A');
    expect(next.background).toBe('#EFE6D8');
    expect(next.petalA).toBe('#C76D3A');
    expect(next.petalB).toBe('#9CAA8C');
    expect(next.center).toBe('#1F4E79');
  });

  it('uses a dynamic region count from the mould', () => {
    const two = defaultsFromRegions([
      { regionKey: 'a', defaultColorCode: '#111111' },
      { regionKey: 'b', defaultColorCode: '#222222' },
    ]);
    const four = defaultsFromRegions([
      { regionKey: 'background' },
      { regionKey: 'petalA' },
      { regionKey: 'petalB' },
      { regionKey: 'center' },
    ]);
    expect(Object.keys(two)).toHaveLength(2);
    expect(Object.keys(four)).toHaveLength(4);
    expect(two.a).toBe('#111111');
    expect(four.background).toBe('#FFFFFF');
  });

  it('supports 2, 3, 4 and 5+ region moulds independently', () => {
    const counts = [2, 3, 4, 5].map((count) =>
      defaultsFromRegions(Array.from({ length: count }, (_, index) => ({ regionKey: `region-${index + 1}` }))),
    );
    expect(counts.map((item) => Object.keys(item))).toEqual([
      ['region-1', 'region-2'],
      ['region-1', 'region-2', 'region-3'],
      ['region-1', 'region-2', 'region-3', 'region-4'],
      ['region-1', 'region-2', 'region-3', 'region-4', 'region-5'],
    ]);
    const next = applyRegionColor(counts[3], 'region-2', '#1A3C66');
    expect(next['region-1']).toBe('#FFFFFF');
    expect(next['region-2']).toBe('#1A3C66');
    expect(next['region-5']).toBe('#FFFFFF');
  });

  it('replaces the entire region map when switching moulds', () => {
    const previous = { background: '#D79A2B', petalA: '#1A3C66' };
    const next = defaultsFromRegions([
      { regionKey: 'background' },
      { regionKey: 'star' },
      { regionKey: 'center' },
      { regionKey: 'border' },
      { regionKey: 'detail' },
    ]);
    expect(Object.keys(previous)).toEqual(['background', 'petalA']);
    expect(Object.keys(next)).toEqual(['background', 'star', 'center', 'border', 'detail']);
    expect(next.petalA).toBeUndefined();
  });
});

describe('URL serialization', () => {
  it('round-trips mould, packed hex colours and rotation', () => {
    const params = serializeShareParams({
      mould: 'MOR-042',
      regionColors: { background: '#D79A2B', star: '#1A3C66', detail: '#F4EBDD' },
      rotation: 90,
      repeat: 2,
    });
    expect(params.get('c')).toContain('background.D79A2B');
    expect(params.get('c')).not.toContain('#');
    const parsed = parseShareParams(params, ['background', 'star', 'detail']);
    expect(parsed.mould).toBe('MOR-042');
    expect(parsed.regionColors).toEqual({ background: '#D79A2B', star: '#1A3C66', detail: '#F4EBDD' });
    expect(parsed.rotation).toBe(90);
    expect(parsed.repeat).toBe(2);
  });

  it('reads legacy r1 r2 keys', () => {
    const params = new URLSearchParams('mould=1025&r1=MC04&r2=MC10');
    const parsed = parseShareParams(params, ['background', 'main']);
    expect(parsed.regionColors?.background).toBe('MC04');
    expect(parsed.regionColors?.main).toBe('MC10');
  });

  it('does not treat start as a region colour', () => {
    const params = new URLSearchParams('start=choose&mould=GEO-001&c=background.D79A2B');
    const parsed = parseShareParams(params, ['background']);
    expect(parsed.regionColors).toEqual({ background: '#D79A2B' });
    expect(parsed.mould).toBe('GEO-001');
  });
});

describe('rotation reset and surface', () => {
  it('rotates 0 → 90 → 180 → 270 → 0', () => {
    expect(nextRotation(0)).toBe(90);
    expect(nextRotation(270)).toBe(0);
  });

  it('resets to mould defaults without changing the mould', () => {
    const defaults = defaultsFromRegions([{ regionKey: 'background' }]);
    expect(defaults.background).toBe('#FFFFFF');
  });

  it('calculates surface, tiles, weight and price', () => {
    const result = calculateSurface({ surfaceM2: 20, wastePercent: 10, unitsPerM2: 25, weightPerM2Kg: 18, pricePerM2: 110 });
    expect(result.requiredM2).toBeCloseTo(22);
    expect(result.tiles).toBe(550);
    expect(result.weightKg).toBe(396);
    expect(result.total).toBe(2420);
  });

  it('suggests a rotating layout', () => {
    expect(suggestLayoutRotations(4)).toEqual([0, 90, 180, 270]);
  });

  it('restores a favorite configuration including rotation', () => {
    useSimulatorStore.getState().restoreFavorite({
      mouldReference: '1072',
      mouldSlug: 'garden',
      colors: { background: '#EFE6D8', petalA: '#B5623F' },
      rotation: 90,
      timestamp: 1,
    });
    const state = useSimulatorStore.getState();
    expect(state.patternKey).toBe('garden');
    expect(state.regionColors).toEqual({ background: '#EFE6D8', petalA: '#B5623F' });
    expect(state.rotation).toBe(90);
  });

  it('prefers SVG region keys over a stale declared list', () => {
    expect(resolveRegionKeys(['background', 'main'], ['background', 'star', 'center'])).toEqual([
      'background',
      'star',
      'center',
    ]);
    expect(resolveRegionKeys(['background', 'main'], [])).toEqual(['background', 'main']);
  });
});

import { describe, expect, it } from 'vitest';
import { hexToRgb, normalizeHex, rgbToHex, hslToHex, hexToHsl, resolveColorValue, rgbColorFromChannels } from './hex';

describe('custom RGB/HEX colour values', () => {
  it('normalizes hex with or without hash', () => {
    expect(normalizeHex('#1f4e79')).toBe('#1F4E79');
    expect(normalizeHex('1f4e79')).toBe('#1F4E79');
    expect(normalizeHex('abc')).toBe('#AABBCC');
  });

  it('keeps HEX and RGB in sync', () => {
    expect(hexToRgb('#1D3D62')).toEqual({ r: 29, g: 61, b: 98 });
    expect(rgbToHex(29, 61, 98)).toBe('#1D3D62');
    expect(hexToRgb('#5DCFBE')).toEqual({ r: 93, g: 207, b: 190 });
    expect(rgbToHex(93, 207, 190)).toBe('#5DCFBE');
    expect(rgbColorFromChannels(93, 207, 190)).toEqual({ r: 93, g: 207, b: 190, hex: '#5DCFBE' });
    expect(rgbColorFromChannels(-4, 300, 190)).toEqual({ r: 0, g: 255, b: 190, hex: '#00FFBE' });
    const rgb = hexToRgb('#1F4E79');
    expect(rgb).toEqual({ r: 31, g: 78, b: 121 });
    expect(rgbToHex(31, 78, 121)).toBe('#1F4E79');
    expect(rgbToHex(255, 0, 0)).toBe('#FF0000');
    expect(rgbToHex(0, 255, 0)).toBe('#00FF00');
    expect(rgbToHex(0, 0, 255)).toBe('#0000FF');
    expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb('#00FF00')).toEqual({ r: 0, g: 255, b: 0 });
    expect(hexToRgb('#0000FF')).toEqual({ r: 0, g: 0, b: 255 });
    expect(rgbColorFromChannels(255, 0, 0)).toEqual({ r: 255, g: 0, b: 0, hex: '#FF0000' });
    expect(rgbColorFromChannels(0, 255, 0).hex).toBe('#00FF00');
    expect(rgbColorFromChannels(0, 0, 255).hex).toBe('#0000FF');
  });

  it('converts HSL back to the same hex family', () => {
    const hsl = hexToHsl('#1F4E79');
    expect(hsl).not.toBeNull();
    const roundTrip = hslToHex(hsl!.h, hsl!.s, hsl!.l);
    expect(hexToRgb(roundTrip)).toEqual({ r: 31, g: 78, b: 121 });
  });

  it('uses hex directly and does not require Bjmat colour ids', () => {
    expect(resolveColorValue('#D79A2B', { 'BJ-C0028': '#000000' })).toBe('#D79A2B');
    expect(resolveColorValue('BJ-C0028', {})).toBeUndefined();
  });
});

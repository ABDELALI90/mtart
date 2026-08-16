import { describe, expect, it } from 'vitest';
import {
  applyImageColor,
  cancelImagePreview,
  clearImageSelection,
  getImageSession,
  installImageSession,
  previewImageColor,
  resetImageAll,
  selectImageSurface,
  undoImageEdit,
} from './imageColorSession';

function fill(width: number, height: number, rgb: [number, number, number]) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    data[i * 4] = rgb[0];
    data[i * 4 + 1] = rgb[1];
    data[i * 4 + 2] = rgb[2];
    data[i * 4 + 3] = 255;
  }
  return data;
}

function setRect(data: Uint8ClampedArray, width: number, x: number, y: number, w: number, h: number, rgb: [number, number, number]) {
  for (let row = y; row < y + h; row += 1) {
    for (let col = x; col < x + w; col += 1) {
      const i = (row * width + col) * 4;
      data[i] = rgb[0];
      data[i + 1] = rgb[1];
      data[i + 2] = rgb[2];
    }
  }
}

describe('uploaded image color persistence', () => {
  it('keeps the first applied color after selecting a second region', () => {
    const pixels = fill(12, 8, [250, 250, 250]);
    setRect(pixels, 12, 1, 1, 4, 6, [200, 30, 30]);
    setRect(pixels, 12, 7, 1, 4, 6, [200, 30, 30]);
    installImageSession('persist', 12, 8, pixels);

    expect(selectImageSurface('persist', 2, 3, 20, false)?.count).toBeGreaterThan(0);
    expect(applyImageColor('persist', '#0E41E9', 'flat')).toBe(true);

    const afterFirst = getImageSession('persist')!;
    const firstBlue = afterFirst.edited[ (3 * 12 + 2) * 4 ];
    expect(firstBlue).toBe(14);

    expect(selectImageSurface('persist', 8, 3, 20, false)?.count).toBeGreaterThan(0);
    const afterSecondSelect = getImageSession('persist')!;
    expect(afterSecondSelect.edited[(3 * 12 + 2) * 4]).toBe(14);
    expect(afterSecondSelect.original[(3 * 12 + 2) * 4]).toBe(200);

    expect(applyImageColor('persist', '#661374', 'flat')).toBe(true);
    const final = getImageSession('persist')!;
    expect(final.edited[(3 * 12 + 2) * 4]).toBe(14);
    expect(final.edited[(3 * 12 + 8) * 4]).toBe(0x66);
    expect(final.edited[(3 * 12 + 8) * 4 + 1]).toBe(0x13);
  });

  it('commits a live preview when another region is selected without clicking Apply', () => {
    const pixels = fill(12, 8, [250, 250, 250]);
    setRect(pixels, 12, 1, 1, 4, 6, [200, 30, 30]);
    setRect(pixels, 12, 7, 1, 4, 6, [200, 30, 30]);
    installImageSession('switch', 12, 8, pixels);

    expect(selectImageSurface('switch', 2, 3, 20, false)?.count).toBeGreaterThan(0);
    previewImageColor('switch', '#0E41E9', 'flat');
    expect(selectImageSurface('switch', 8, 3, 20, false)?.count).toBeGreaterThan(0);

    const session = getImageSession('switch')!;
    expect(session.edited[(3 * 12 + 2) * 4]).toBe(14);
    expect(session.original[(3 * 12 + 2) * 4]).toBe(200);
    expect(session.preview).toBeNull();
  });

  it('keeps committed colors when the selection overlay is cleared', () => {
    const pixels = fill(8, 8, [240, 240, 240]);
    setRect(pixels, 8, 0, 0, 4, 8, [10, 80, 180]);
    installImageSession('overlay', 8, 8, pixels);
    selectImageSurface('overlay', 1, 1, 20, false);
    applyImageColor('overlay', '#0E41E9', 'flat');
    clearImageSelection('overlay');
    const session = getImageSession('overlay')!;
    expect(session.edited[0]).toBe(14);
    expect(session.preview).toBeNull();
    expect(session.mask).toBeNull();
    expect(session.original[0]).toBe(10);
  });

  it('undoes the last applied region and reset restores the original upload', () => {
    const pixels = fill(18, 6, [250, 250, 250]);
    setRect(pixels, 18, 1, 1, 4, 4, [200, 30, 30]);
    setRect(pixels, 18, 7, 1, 4, 4, [30, 200, 30]);
    setRect(pixels, 18, 13, 1, 4, 4, [30, 30, 200]);
    installImageSession('history', 18, 6, pixels);

    selectImageSurface('history', 2, 2, 20, false);
    applyImageColor('history', '#00FF00', 'flat');
    selectImageSurface('history', 8, 2, 20, false);
    applyImageColor('history', '#0000FF', 'flat');
    selectImageSurface('history', 14, 2, 20, false);
    applyImageColor('history', '#FF0000', 'flat');

    const after = getImageSession('history')!;
    expect(after.edited[(2 * 18 + 2) * 4 + 1]).toBe(255);
    expect(after.edited[(2 * 18 + 8) * 4 + 2]).toBe(255);
    expect(after.edited[(2 * 18 + 14) * 4]).toBe(255);

    undoImageEdit('history');
    const afterUndoC = getImageSession('history')!;
    expect(afterUndoC.edited[(2 * 18 + 14) * 4]).toBe(30);
    expect(afterUndoC.edited[(2 * 18 + 8) * 4 + 2]).toBe(255);
    expect(afterUndoC.edited[(2 * 18 + 2) * 4 + 1]).toBe(255);

    undoImageEdit('history');
    const afterUndoB = getImageSession('history')!;
    expect(afterUndoB.edited[(2 * 18 + 8) * 4 + 2]).toBe(30);
    expect(afterUndoB.edited[(2 * 18 + 2) * 4 + 1]).toBe(255);

    resetImageAll('history');
    const reset = getImageSession('history')!;
    expect(reset.edited[(2 * 18 + 2) * 4]).toBe(200);
    expect(reset.edited[(2 * 18 + 8) * 4 + 1]).toBe(200);
    expect(reset.edited[(2 * 18 + 14) * 4 + 2]).toBe(200);
  });

  it('does not restore the original image when the popup is cancelled after a committed edit', () => {
    const pixels = fill(8, 8, [240, 240, 240]);
    setRect(pixels, 8, 0, 0, 4, 8, [10, 80, 180]);
    installImageSession('cancel', 8, 8, pixels);
    selectImageSurface('cancel', 1, 1, 20, false);
    applyImageColor('cancel', '#0E41E9', 'flat');
    selectImageSurface('cancel', 6, 1, 20, false);
    previewImageColor('cancel', '#661374', 'flat');
    cancelImagePreview('cancel');
    const session = getImageSession('cancel')!;
    expect(session.edited[0]).toBe(14);
    expect(session.edited[(6 * 8 + 6) * 4]).toBe(240);
  });

  it('does not throw when apply is missing a mask or uses an invalid color', () => {
    const pixels = fill(4, 4, [240, 240, 240]);
    installImageSession('safe', 4, 4, pixels);
    expect(applyImageColor('missing-session', '#2ECC71', 'flat')).toBe(false);
    expect(applyImageColor('safe', 'not-a-color', 'flat')).toBe(false);
    expect(applyImageColor('safe', '#2ECC71', 'flat')).toBe(false);
    expect(getImageSession('safe')!.edited[0]).toBe(240);
  });
});

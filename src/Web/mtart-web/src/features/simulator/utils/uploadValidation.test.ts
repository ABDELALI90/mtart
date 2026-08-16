import { describe, expect, it } from 'vitest';
import { validateUploadMeta } from './uploadValidation';

describe('upload validation', () => {
  it('rejects files over 10 MB', () => {
    expect(validateUploadMeta({ size: 11 * 1024 * 1024, type: 'image/jpeg', name: 'tile.jpg', width: 800, height: 800 })).toEqual({
      ok: false,
      code: 'too-large',
    });
  });

  it('rejects images smaller than 300px', () => {
    expect(validateUploadMeta({ size: 1200, type: 'image/png', name: 'tiny.png', width: 120, height: 400 })).toEqual({
      ok: false,
      code: 'too-small',
    });
  });

  it('rejects unsupported types', () => {
    expect(validateUploadMeta({ size: 1200, type: 'application/pdf', name: 'tile.pdf' })).toEqual({
      ok: false,
      code: 'bad-type',
    });
  });

  it('accepts a clear jpeg tile', () => {
    expect(validateUploadMeta({ size: 400_000, type: 'image/jpeg', name: 'zellige.jpg', width: 1200, height: 1200 })).toEqual({
      ok: true,
    });
  });

  it('rejects svg uploads', () => {
    expect(validateUploadMeta({ size: 8000, type: 'image/svg+xml', name: 'mould.svg', width: 800, height: 800 })).toEqual({
      ok: false,
      code: 'bad-type',
    });
  });
});

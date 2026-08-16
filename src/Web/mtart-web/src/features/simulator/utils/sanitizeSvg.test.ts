import { describe, expect, it } from 'vitest';
import { sanitizeSvg, outlineUploadedSvg } from './sanitizeSvg';

describe('sanitizeSvg', () => {
  it('strips scripts, handlers and external urls', () => {
    const dirty = `<svg onload="alert(1)"><script>alert(1)</script><path onclick="x" d="M0 0" href="https://evil.test/x"/><foreignObject><div/></foreignObject></svg>`;
    const clean = sanitizeSvg(dirty);
    expect(clean).not.toMatch(/script/i);
    expect(clean).not.toMatch(/onload/i);
    expect(clean).not.toMatch(/onclick/i);
    expect(clean).not.toMatch(/foreignObject/i);
    expect(clean).not.toMatch(/https:\/\/evil/);
  });

  it('forces white fills for uploaded vector moulds', () => {
    const outlined = outlineUploadedSvg(`<svg><path fill="#CE7338" stroke="#111" d="M0 0"/></svg>`);
    expect(outlined).toContain('fill="#FFFFFF"');
    expect(outlined).toContain('stroke="#707070"');
  });
});

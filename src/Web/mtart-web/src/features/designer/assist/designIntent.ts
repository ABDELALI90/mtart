import { addShape, emptyDocument } from '../geometry/document';
import { TILE_UNITS, type CustomDesignDocument, type ShapeType } from '../types';

export interface DesignIntent {
  motifs: ShapeType[];
  symmetry: CustomDesignDocument['symmetry'];
  repeatMode: CustomDesignDocument['repeatMode'];
}

const KEYWORDS: Array<{ pattern: RegExp; motif: ShapeType }> = [
  { pattern: /\b12[- ]?point|\b12\b.{0,12}star/i, motif: 'star12' },
  { pattern: /\b10[- ]?point|\b10\b.{0,12}star/i, motif: 'star10' },
  { pattern: /\b8[- ]?point|\beight[- ]?point|\bkhatem|\bkhatam/i, motif: 'khatem' },
  { pattern: /moroccan star|étoile marocaine/i, motif: 'moroccanStar' },
  { pattern: /star and cross|étoile et croix/i, motif: 'starAndCross' },
  { pattern: /rosette|zahra|fleur/i, motif: 'rosette' },
  { pattern: /interlac|entrelac/i, motif: 'interlace' },
  { pattern: /diamond|losange/i, motif: 'diamondsRing' },
  { pattern: /octagon|octogone/i, motif: 'octagon' },
  { pattern: /radial|moorish|andalus/i, motif: 'moorishRadial' },
  { pattern: /hexagon|hexagone/i, motif: 'hexagon' },
  { pattern: /cross|croix/i, motif: 'cross' },
  { pattern: /star|étoile|najma/i, motif: 'star8' },
];

export function parseDesignIntent(prompt: string): DesignIntent {
  const motifs: ShapeType[] = [];
  for (const entry of KEYWORDS) {
    if (entry.pattern.test(prompt) && !motifs.includes(entry.motif)) {
      motifs.push(entry.motif);
    }
  }
  if (motifs.length === 0) {
    motifs.push('khatem');
  }
  const symmetry: DesignIntent['symmetry'] = /4[- ]way|quatre/i.test(prompt)
    ? '4'
    : /8[- ]way|huit/i.test(prompt)
      ? '8'
      : /radial|6[- ]way/i.test(prompt)
        ? 'radial'
        : 'none';
  const repeatMode: DesignIntent['repeatMode'] = /rotat|90/i.test(prompt) ? 'compose2' : 'straight';
  return { motifs: motifs.slice(0, 3), symmetry, repeatMode };
}

/**
 * Local motif generator used until an optional AI provider is wired.
 * The geometry editor never depends on this module.
 */
export function generateFromIntent(intent: DesignIntent, name = 'Suggested motif'): CustomDesignDocument {
  let document = emptyDocument(name);
  document = { ...document, symmetry: intent.symmetry, repeatMode: intent.repeatMode };
  const center = TILE_UNITS / 2;
  intent.motifs.forEach((motif, index) => {
    const sizeOffset = index * 18;
    document = addShape(document, motif, center, center);
    const last = document.elements.at(-1);
    if (last) {
      last.width = Math.max(36, last.width - sizeOffset);
      last.height = Math.max(36, last.height - sizeOffset);
    }
  });
  return document;
}

export interface DesignAssistProvider {
  generate(prompt: string): Promise<CustomDesignDocument>;
}

export const localMotifAssist: DesignAssistProvider = {
  async generate(prompt: string) {
    return generateFromIntent(parseDesignIntent(prompt), prompt.slice(0, 48) || 'Suggested motif');
  },
};

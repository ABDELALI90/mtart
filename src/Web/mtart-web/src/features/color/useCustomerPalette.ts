import { useCallback, useState } from 'react';
import { normalizeHex } from './hex';

const PALETTE_KEY = 'mtart.simulator.myPalette';
const RECENT_KEY = 'mtart.simulator.recentColors';
const MAX_PALETTE = 12;
const MAX_RECENT = 12;

function readList(key: string): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? '[]') as string[];
    return parsed.map((item) => normalizeHex(item)).filter((item): item is string => Boolean(item));
  } catch {
    return [];
  }
}

function writeList(key: string, values: string[]) {
  localStorage.setItem(key, JSON.stringify(values));
}

export function useCustomerPalette() {
  const [palette, setPalette] = useState<string[]>(() => readList(PALETTE_KEY));
  const [recent, setRecent] = useState<string[]>(() => readList(RECENT_KEY));

  const addToPalette = useCallback((hex: string) => {
    const normalized = normalizeHex(hex);
    if (!normalized) {
      return;
    }
    setPalette((current) => {
      const next = [normalized, ...current.filter((item) => item !== normalized)].slice(0, MAX_PALETTE);
      writeList(PALETTE_KEY, next);
      return next;
    });
  }, []);

  const removeFromPalette = useCallback((hex: string) => {
    const normalized = normalizeHex(hex);
    setPalette((current) => {
      const next = current.filter((item) => item !== normalized);
      writeList(PALETTE_KEY, next);
      return next;
    });
  }, []);

  const rememberRecent = useCallback((hex: string) => {
    const normalized = normalizeHex(hex);
    if (!normalized) {
      return;
    }
    setRecent((current) => {
      const next = [normalized, ...current.filter((item) => item !== normalized)].slice(0, MAX_RECENT);
      writeList(RECENT_KEY, next);
      return next;
    });
  }, []);

  return { palette, recent, addToPalette, removeFromPalette, rememberRecent };
}

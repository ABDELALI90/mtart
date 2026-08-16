import { create } from 'zustand';
import { applyRegionColor, nextRotation, suggestLayoutRotations, type Rotation } from '../utils/config';

export interface SimulatorFavorite {
  mouldReference: string;
  mouldSlug: string;
  colors: Record<string, string>;
  rotation: Rotation;
  format?: string;
  timestamp: number;
}

export type RepeatCount = 1 | 2 | 3 | 4;
export type TileSizeCm = 10 | 15 | 20 | 25 | 30;
export type SimulatorScene = 'floor' | 'kitchen' | 'bathroom' | 'living' | 'commercial' | 'bedroom';

interface SimulatorState {
  patternKey?: string;
  activeRegion?: string;
  pendingColor?: string;
  regionColors: Record<string, string>;
  rotation: Rotation;
  repeat: RepeatCount;
  tileSizeCm: TileSizeCm;
  surfaceM2: number;
  wastePercent: 5 | 10 | 15;
  scene: SimulatorScene;
  floorCells: Array<{ filled: boolean; rotation: Rotation }>;
  selectedCell?: number;
  setPattern: (key: string) => void;
  setActiveRegion: (key: string) => void;
  setPendingColor: (code?: string) => void;
  setRegionColor: (regionKey: string, colorCode: string) => void;
  setRegionColors: (colors: Record<string, string>) => void;
  rotate: () => void;
  setRotation: (rotation: Rotation) => void;
  setRepeat: (repeat: RepeatCount) => void;
  setTileSizeCm: (cm: TileSizeCm) => void;
  resetColors: (defaults: Record<string, string>) => void;
  setSurface: (m2: number) => void;
  setWaste: (waste: 5 | 10 | 15) => void;
  setScene: (scene: SimulatorScene) => void;
  fillFloor: () => void;
  clearFloor: () => void;
  toggleCell: (index: number) => void;
  rotateCell: (index: number) => void;
  selectCell: (index: number) => void;
  deleteSelected: () => void;
  suggestLayout: () => void;
  restoreFavorite: (favorite: SimulatorFavorite) => void;
}

const emptyGrid = (filled = true) =>
  Array.from({ length: 36 }, () => ({ filled, rotation: 0 as Rotation }));

export const useSimulatorStore = create<SimulatorState>((set) => ({
  regionColors: {},
  rotation: 0,
  repeat: 1,
  tileSizeCm: 20,
  surfaceM2: 10,
  wastePercent: 10,
  scene: 'floor',
  floorCells: emptyGrid(true),
  setPattern: (key) => set({ patternKey: key, pendingColor: undefined }),
  setActiveRegion: (key) => set({ activeRegion: key }),
  setPendingColor: (code) => set({ pendingColor: code }),
  setRegionColor: (regionKey, colorCode) =>
    set((state) => ({ regionColors: applyRegionColor(state.regionColors, regionKey, colorCode) })),
  setRegionColors: (colors) => set({ regionColors: colors }),
  rotate: () => set((state) => ({ rotation: nextRotation(state.rotation) })),
  setRotation: (rotation) => set({ rotation }),
  setRepeat: (repeat) => set({ repeat }),
  setTileSizeCm: (tileSizeCm) => set({ tileSizeCm }),
  resetColors: (defaults) => set({ regionColors: defaults }),
  setSurface: (m2) => set({ surfaceM2: m2 }),
  setWaste: (waste) => set({ wastePercent: waste }),
  setScene: (scene) => set({ scene }),
  fillFloor: () => set((state) => ({
    floorCells: emptyGrid(true).map((cell) => ({ ...cell, rotation: state.rotation })),
  })),
  clearFloor: () => set({ floorCells: emptyGrid(false), selectedCell: undefined }),
  toggleCell: (index) =>
    set((state) => ({
      selectedCell: index,
      floorCells: state.floorCells.map((cell, i) =>
        i === index ? { ...cell, filled: !cell.filled, rotation: cell.filled ? cell.rotation : state.rotation } : cell,
      ),
    })),
  rotateCell: (index) =>
    set((state) => ({
      floorCells: state.floorCells.map((cell, i) =>
        i === index ? { ...cell, rotation: nextRotation(cell.rotation) } : cell,
      ),
    })),
  selectCell: (index) => set({ selectedCell: index }),
  deleteSelected: () =>
    set((state) => ({
      floorCells: state.floorCells.map((cell, i) =>
        i === state.selectedCell ? { ...cell, filled: false } : cell,
      ),
    })),
  suggestLayout: () =>
    set({
      floorCells: emptyGrid(true).map((_, index) => ({
        filled: true,
        rotation: suggestLayoutRotations(36)[index],
      })),
    }),
  restoreFavorite: (favorite) =>
    set({
      patternKey: favorite.mouldSlug || favorite.mouldReference,
      regionColors: favorite.colors,
      rotation: favorite.rotation,
    }),
}));

const FAVORITES_KEY = 'mtart.simulator.favorites';

export function loadFavorites(): SimulatorFavorite[] {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]') as SimulatorFavorite[];
  } catch {
    return [];
  }
}

export function saveFavorite(favorite: SimulatorFavorite) {
  const next = [favorite, ...loadFavorites()].slice(0, 24);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  return next;
}

export function removeFavorite(timestamp: number) {
  const next = loadFavorites().filter((item) => item.timestamp !== timestamp);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  return next;
}

export function clearFavorites() {
  localStorage.removeItem(FAVORITES_KEY);
  return [] as SimulatorFavorite[];
}

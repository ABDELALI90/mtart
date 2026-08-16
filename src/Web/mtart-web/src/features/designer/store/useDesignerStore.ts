import { create } from 'zustand';
import {
  BACKGROUND_REGION_ID,
  type CustomDesignDocument,
  type DesignerTool,
  type GridSettings,
  type RepeatMode,
  type ShapeType,
  type SymmetryMode,
} from '../types';
import { addShape, cloneDocument, emptyDocument, snapAngle, snapValue } from '../geometry/document';
import { motifPath } from '../geometry/moroccan';
import { nanoidLike } from '../geometry/ids';

const COMPOUND: ShapeType[] = ['rosette', 'diamondsRing', 'interlace', 'starAndCross', 'moorishRadial'];
const HISTORY_LIMIT = 80;

function syncCompound(element: CustomDesignDocument['elements'][number]) {
  if (!COMPOUND.includes(element.type)) {
    return element;
  }
  return { ...element, d: motifPath(element.type, element.width, element.height, element.params) };
}

interface DesignerState {
  document: CustomDesignDocument;
  past: CustomDesignDocument[];
  future: CustomDesignDocument[];
  tool: DesignerTool;
  selectedIds: string[];
  activeRegionId: string;
  savedId?: string;
  savedReference?: string;
  dirty: boolean;
  commit: (next: CustomDesignDocument) => void;
  setTool: (tool: DesignerTool) => void;
  select: (ids: string[], regionId?: string) => void;
  setActiveRegion: (id: string) => void;
  placeShape: (type: ShapeType, x: number, y: number, color?: string) => void;
  updateElement: (id: string, patch: Partial<CustomDesignDocument['elements'][number]>) => void;
  setRegionColor: (regionId: string, colorReference: string) => void;
  renameRegion: (regionId: string, name: string) => void;
  duplicateSelected: () => void;
  deleteSelected: () => void;
  mirrorSelected: (axis: 'x' | 'y') => void;
  bringForward: () => void;
  sendBackward: () => void;
  alignCenter: () => void;
  setSymmetry: (mode: SymmetryMode) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  setTessellation: (size: 4 | 8) => void;
  setGrid: (patch: Partial<GridSettings>) => void;
  setName: (name: string) => void;
  toggleVisible: (id: string) => void;
  toggleLocked: (id: string) => void;
  renameElement: (id: string, name: string) => void;
  reorder: (from: number, to: number) => void;
  reset: () => void;
  loadDocument: (document: CustomDesignDocument, saved?: { id: string; reference: string }) => void;
  markSaved: (id: string, reference: string) => void;
  beginGesture: () => void;
  patchSilent: (id: string, patch: Partial<CustomDesignDocument['elements'][number]>) => void;
  undo: () => void;
  redo: () => void;
}

export const useDesignerStore = create<DesignerState>((set, get) => ({
  document: emptyDocument(),
  past: [],
  future: [],
  tool: 'select',
  selectedIds: [],
  activeRegionId: BACKGROUND_REGION_ID,
  dirty: false,
  commit: (next) => {
    const { document, past } = get();
    set({
      document: next,
      past: [...past, cloneDocument(document)].slice(-HISTORY_LIMIT),
      future: [],
      dirty: true,
    });
  },
  setTool: (tool) => set({ tool }),
  select: (ids, regionId) =>
    set((state) => ({
      selectedIds: ids,
      activeRegionId: regionId ?? state.document.elements.find((el) => el.id === ids[0])?.regionId ?? state.activeRegionId,
      tool: 'select',
    })),
  setActiveRegion: (id) => set({ activeRegionId: id, selectedIds: get().document.elements.filter((el) => el.regionId === id).map((el) => el.id) }),
  placeShape: (type, x, y, color) => {
    const next = addShape(get().document, type, x, y, color);
    const created = next.elements.at(-1);
    get().commit(next);
    if (created) {
      set({ selectedIds: [created.id], activeRegionId: created.regionId, tool: 'select' });
    }
  },
  updateElement: (id, patch) => {
    const next = cloneDocument(get().document);
    next.elements = next.elements.map((element) =>
      element.id === id && !element.locked ? syncCompound({ ...element, ...patch }) : element,
    );
    get().commit(next);
  },
  setRegionColor: (regionId, colorReference) => {
    const next = cloneDocument(get().document);
    next.regions = next.regions.map((region) => (region.id === regionId ? { ...region, colorReference } : region));
    get().commit(next);
  },
  renameRegion: (regionId, name) => {
    const next = cloneDocument(get().document);
    next.regions = next.regions.map((region) => (region.id === regionId ? { ...region, name } : region));
    get().commit(next);
  },
  duplicateSelected: () => {
    const { document, selectedIds } = get();
    if (selectedIds.length === 0) {
      return;
    }
    const next = cloneDocument(document);
    const copies = next.elements
      .filter((element) => selectedIds.includes(element.id))
      .map((element) => ({
        ...element,
        id: nanoidLike('el'),
        x: element.x + 12,
        y: element.y + 12,
      }));
    next.elements.push(...copies);
    get().commit(next);
    set({ selectedIds: copies.map((item) => item.id) });
  },
  deleteSelected: () => {
    const { document, selectedIds } = get();
    if (selectedIds.length === 0) {
      return;
    }
    const next = cloneDocument(document);
    const removedRegions = new Set(
      next.elements.filter((element) => selectedIds.includes(element.id)).map((element) => element.regionId),
    );
    next.elements = next.elements.filter((element) => !selectedIds.includes(element.id));
    const stillUsed = new Set(next.elements.map((element) => element.regionId));
    stillUsed.add(BACKGROUND_REGION_ID);
    next.regions = next.regions.filter((region) => !removedRegions.has(region.id) || stillUsed.has(region.id));
    get().commit(next);
    set({ selectedIds: [], activeRegionId: BACKGROUND_REGION_ID });
  },
  mirrorSelected: (axis) => {
    const { document, selectedIds } = get();
    const next = cloneDocument(document);
    next.elements = next.elements.map((element) => {
      if (!selectedIds.includes(element.id) || element.locked) {
        return element;
      }
      return syncCompound({
        ...element,
        scaleX: axis === 'x' ? -element.scaleX : element.scaleX,
        scaleY: axis === 'y' ? -element.scaleY : element.scaleY,
      });
    });
    get().commit(next);
  },
  bringForward: () => {
    const { document, selectedIds } = get();
    const next = cloneDocument(document);
    for (let i = next.elements.length - 2; i >= 0; i -= 1) {
      if (selectedIds.includes(next.elements[i].id) && !selectedIds.includes(next.elements[i + 1].id)) {
        [next.elements[i], next.elements[i + 1]] = [next.elements[i + 1], next.elements[i]];
      }
    }
    get().commit(next);
  },
  sendBackward: () => {
    const { document, selectedIds } = get();
    const next = cloneDocument(document);
    for (let i = 1; i < next.elements.length; i += 1) {
      if (selectedIds.includes(next.elements[i].id) && !selectedIds.includes(next.elements[i - 1].id)) {
        [next.elements[i], next.elements[i - 1]] = [next.elements[i - 1], next.elements[i]];
      }
    }
    get().commit(next);
  },
  alignCenter: () => {
    const { document, selectedIds } = get();
    const next = cloneDocument(document);
    next.elements = next.elements.map((element) =>
      selectedIds.includes(element.id) && !element.locked ? { ...element, x: 100, y: 100 } : element,
    );
    get().commit(next);
  },
  setSymmetry: (mode) => get().commit({ ...get().document, symmetry: mode }),
  setRepeatMode: (mode) => get().commit({ ...get().document, repeatMode: mode }),
  setTessellation: (size) => get().commit({ ...get().document, tessellation: size }),
  setGrid: (patch) => get().commit({ ...get().document, grid: { ...get().document.grid, ...patch } }),
  setName: (name) => get().commit({ ...get().document, name }),
  toggleVisible: (id) => {
    const next = cloneDocument(get().document);
    next.elements = next.elements.map((element) => (element.id === id ? { ...element, visible: !element.visible } : element));
    get().commit(next);
  },
  toggleLocked: (id) => {
    const next = cloneDocument(get().document);
    next.elements = next.elements.map((element) => (element.id === id ? { ...element, locked: !element.locked } : element));
    get().commit(next);
  },
  renameElement: (id, name) => {
    const next = cloneDocument(get().document);
    next.elements = next.elements.map((element) => (element.id === id ? { ...element, name } : element));
    get().commit(next);
  },
  reorder: (from, to) => {
    const next = cloneDocument(get().document);
    const [moved] = next.elements.splice(from, 1);
    next.elements.splice(to, 0, moved);
    get().commit(next);
  },
  reset: () => {
    set({
      document: emptyDocument(),
      past: [],
      future: [],
      selectedIds: [],
      activeRegionId: BACKGROUND_REGION_ID,
      savedId: undefined,
      savedReference: undefined,
      dirty: false,
      tool: 'select',
    });
  },
  loadDocument: (document, saved) => {
    set({
      document: cloneDocument(document),
      past: [],
      future: [],
      selectedIds: [],
      activeRegionId: document.backgroundRegionId,
      savedId: saved?.id,
      savedReference: saved?.reference,
      dirty: false,
      tool: 'select',
    });
  },
  markSaved: (id, reference) => set({ savedId: id, savedReference: reference, dirty: false }),
  beginGesture: () => {
    const { document, past } = get();
    set({
      past: [...past, cloneDocument(document)].slice(-HISTORY_LIMIT),
      future: [],
      dirty: true,
    });
  },
  patchSilent: (id, patch) => {
    const { document } = get();
    set({
      document: {
        ...document,
        elements: document.elements.map((element) =>
          element.id === id && !element.locked ? syncCompound({ ...element, ...patch }) : element,
        ),
      },
      dirty: true,
    });
  },
  undo: () => {
    const { past, document, future } = get();
    const previous = past.at(-1);
    if (!previous) {
      return;
    }
    set({
      document: previous,
      past: past.slice(0, -1),
      future: [cloneDocument(document), ...future],
      dirty: true,
    });
  },
  redo: () => {
    const { past, document, future } = get();
    const next = future[0];
    if (!next) {
      return;
    }
    set({
      document: next,
      past: [...past, cloneDocument(document)],
      future: future.slice(1),
      dirty: true,
    });
  },
}));

export function snapPoint(x: number, y: number, grid: GridSettings) {
  return { x: snapValue(x, grid), y: snapValue(y, grid) };
}

export { snapAngle, snapValue };

import { useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { TILE_UNITS, type CustomDesignDocument, type DesignElement } from '../types';
import { elementLocalPath } from '../geometry/paths';
import { symmetryCopies, symmetryGroupTransform } from '../geometry/symmetry';
import { snapAngle, snapPoint, useDesignerStore } from '../store/useDesignerStore';
import { resolveColorValue } from '@/features/color/hex';

function svgPoint(svg: SVGSVGElement, clientX: number, clientY: number) {
  const point = svg.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) {
    return { x: 0, y: 0 };
  }
  const mapped = point.matrixTransform(ctm.inverse());
  return { x: mapped.x, y: mapped.y };
}

function fillOf(document: CustomDesignDocument, regionId: string, hexByCode: Record<string, string>) {
  const code = document.regions.find((region) => region.id === regionId)?.colorReference;
  return resolveColorValue(code ?? undefined, hexByCode) || '#d9d0c3';
}

type Gesture =
  | { kind: 'move'; id: string; dx: number; dy: number }
  | { kind: 'resize'; id: string; startW: number; startH: number; startDist: number }
  | { kind: 'rotate'; id: string };

export function TileCanvas({ hexByCode }: { hexByCode: Record<string, string> }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const document = useDesignerStore((state) => state.document);
  const tool = useDesignerStore((state) => state.tool);
  const selectedIds = useDesignerStore((state) => state.selectedIds);
  const activeRegionId = useDesignerStore((state) => state.activeRegionId);
  const placeShape = useDesignerStore((state) => state.placeShape);
  const select = useDesignerStore((state) => state.select);
  const setActiveRegion = useDesignerStore((state) => state.setActiveRegion);
  const beginGesture = useDesignerStore((state) => state.beginGesture);
  const patchSilent = useDesignerStore((state) => state.patchSilent);

  const selected = document.elements.find((element) => element.id === selectedIds[0]);
  const copies = symmetryCopies(document.symmetry);

  function colorForActive() {
    const region = document.regions.find((item) => item.id === activeRegionId);
    return region?.colorReference ?? '#EFE6D8';
  }

  function onCanvasPointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) {
      return;
    }
    const raw = svgPoint(svg, event.clientX, event.clientY);
    const point = snapPoint(raw.x, raw.y, document.grid);
    const target = event.target as SVGElement;
    if (tool !== 'select') {
      placeShape(tool, point.x, point.y, colorForActive());
      return;
    }
    if (target.dataset.handle && selected) {
      beginGesture();
      if (target.dataset.handle === 'rotate') {
        gesture.current = { kind: 'rotate', id: selected.id };
      } else {
        const dist = Math.max(8, Math.hypot(raw.x - selected.x, raw.y - selected.y));
        gesture.current = { kind: 'resize', id: selected.id, startW: selected.width, startH: selected.height, startDist: dist };
      }
      svg.setPointerCapture(event.pointerId);
      return;
    }
    const region = target.getAttribute('data-region');
    const id = target.id;
    if (id && document.elements.some((element) => element.id === id)) {
      select([id], region ?? undefined);
      const element = document.elements.find((item) => item.id === id);
      if (element && !element.locked) {
        beginGesture();
        gesture.current = { kind: 'move', id, dx: raw.x - element.x, dy: raw.y - element.y };
        svg.setPointerCapture(event.pointerId);
      }
      return;
    }
    if (region === document.backgroundRegionId) {
      setActiveRegion(document.backgroundRegionId);
      select([]);
    }
  }

  function onPointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    const current = gesture.current;
    if (!svg || !current) {
      return;
    }
    const raw = svgPoint(svg, event.clientX, event.clientY);
    const element = useDesignerStore.getState().document.elements.find((item) => item.id === current.id);
    if (!element) {
      return;
    }
    if (current.kind === 'move') {
      const snapped = snapPoint(raw.x - current.dx, raw.y - current.dy, document.grid);
      patchSilent(current.id, { x: snapped.x, y: snapped.y });
    } else if (current.kind === 'resize') {
      const dist = Math.max(8, Math.hypot(raw.x - element.x, raw.y - element.y));
      const scale = dist / current.startDist;
      patchSilent(current.id, {
        width: Math.max(8, current.startW * scale),
        height: Math.max(8, current.startH * scale),
      });
    } else {
      const degrees = (Math.atan2(raw.y - element.y, raw.x - element.x) * 180) / Math.PI;
      patchSilent(current.id, { rotation: snapAngle(degrees, document.grid.angleSnap) });
    }
  }

  function onPointerUp() {
    gesture.current = null;
  }

  function onBackgroundClick() {
    if (tool === 'select') {
      setActiveRegion(document.backgroundRegionId);
    }
  }

  return (
    <div className="border border-charcoal/10 bg-[#efe8dc]" dir="ltr">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${TILE_UNITS} ${TILE_UNITS}`}
        className="aspect-square w-full touch-none"
        onPointerDown={onCanvasPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <rect
          id={document.backgroundRegionId}
          data-region={document.backgroundRegionId}
          x="0"
          y="0"
          width={TILE_UNITS}
          height={TILE_UNITS}
          fill={fillOf(document, document.backgroundRegionId, hexByCode)}
          onClick={onBackgroundClick}
        />
        {document.grid.visible ? <GridOverlay grid={document.grid} /> : null}
        {copies.map((copy, index) => (
          <g key={index} transform={symmetryGroupTransform(copy)} pointerEvents={index === 0 ? 'auto' : 'none'} opacity={index === 0 ? 1 : 0.92}>
            {document.elements.filter((element) => element.visible).map((element) => (
              <ShapePath
                key={`${element.id}-${index}`}
                element={element}
                fill={fillOf(document, element.regionId, hexByCode)}
                selected={index === 0 && selectedIds.includes(element.id)}
                active={element.regionId === activeRegionId}
              />
            ))}
          </g>
        ))}
        {selected ? <Handles element={selected} /> : null}
      </svg>
    </div>
  );
}

function ShapePath({
  element,
  fill,
  selected,
  active,
}: {
  element: DesignElement;
  fill: string;
  selected: boolean;
  active: boolean;
}) {
  const { d, closed } = element.d ? { d: element.d, closed: /z/i.test(element.d) } : elementLocalPath(element);
  const transform = `translate(${element.x} ${element.y}) rotate(${element.rotation}) scale(${element.scaleX} ${element.scaleY})`;
  return (
    <path
      id={element.id}
      data-region={element.regionId}
      d={d}
      transform={transform}
      fill={element.strokeOnly && !closed ? 'none' : fill}
      fillRule="evenodd"
      stroke={selected || active ? '#1f4a4c' : element.strokeOnly ? '#262320' : 'none'}
      strokeWidth={selected || active ? 2.2 : element.strokeOnly ? element.strokeWidth || 1.6 : 0}
      style={{ cursor: element.locked ? 'not-allowed' : 'move' }}
    />
  );
}

function Handles({ element }: { element: DesignElement }) {
  const size = Math.max(element.width, element.height) / 2;
  return (
    <g>
      <circle cx={element.x} cy={element.y} r={size} fill="none" stroke="#1f4a4c" strokeDasharray="3 2" strokeWidth="0.8" pointerEvents="none" />
      <circle data-handle="resize" cx={element.x + size} cy={element.y + size} r="4" fill="#1f4a4c" style={{ cursor: 'nwse-resize' }} />
      <circle data-handle="rotate" cx={element.x} cy={element.y - size - 10} r="4" fill="#c45c26" style={{ cursor: 'grab' }} />
      <line x1={element.x} y1={element.y - size} x2={element.x} y2={element.y - size - 10} stroke="#c45c26" strokeWidth="0.8" pointerEvents="none" />
    </g>
  );
}

function GridOverlay({ grid }: { grid: CustomDesignDocument['grid'] }) {
  const lines = [];
  for (let i = grid.size; i < TILE_UNITS; i += grid.size) {
    lines.push(<line key={`v-${i}`} x1={i} y1={0} x2={i} y2={TILE_UNITS} stroke="#262320" strokeOpacity="0.08" strokeWidth="0.4" />);
    lines.push(<line key={`h-${i}`} x1={0} y1={i} x2={TILE_UNITS} y2={i} stroke="#262320" strokeOpacity="0.08" strokeWidth="0.4" />);
  }
  return (
    <g pointerEvents="none">
      {lines}
      {grid.verticalGuide ? <line x1={100} y1={0} x2={100} y2={TILE_UNITS} stroke="#1f4a4c" strokeOpacity="0.35" strokeWidth="0.6" /> : null}
      {grid.horizontalGuide ? <line x1={0} y1={100} x2={TILE_UNITS} y2={100} stroke="#1f4a4c" strokeOpacity="0.35" strokeWidth="0.6" /> : null}
      {grid.centerGuides ? <circle cx={100} cy={100} r="2" fill="#1f4a4c" fillOpacity="0.5" /> : null}
      {grid.diagonalGuides ? (
        <>
          <line x1={0} y1={0} x2={TILE_UNITS} y2={TILE_UNITS} stroke="#1f4a4c" strokeOpacity="0.2" strokeWidth="0.5" />
          <line x1={TILE_UNITS} y1={0} x2={0} y2={TILE_UNITS} stroke="#1f4a4c" strokeOpacity="0.2" strokeWidth="0.5" />
        </>
      ) : null}
    </g>
  );
}

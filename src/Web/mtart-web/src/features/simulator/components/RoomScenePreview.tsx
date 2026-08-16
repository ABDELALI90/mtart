import { useCallback, useEffect, useState } from 'react';
import {
  ROOM_FLOOR_PERCENT,
  ROOM_WALL_PERCENT,
  rasterImageTextureUrl,
  tileRasterSize,
  tileScaleForCm,
  tileTextureUrl,
  tilesAcrossForCm,
  tilesDeepForCm,
} from '../utils/tileTexture';
import { PerspectiveFloor } from './PerspectiveFloor';
import { ConfigurableTile } from './ConfigurableTile';
import { RoomFurniture } from './RoomFurniture';

export function RoomScenePreview({
  vectorUrl,
  imageUrl,
  imageRevision = 0,
  regionColors,
  rotation,
  tileSizeCm,
}: {
  vectorUrl?: string;
  imageUrl?: string;
  imageRevision?: number;
  regionColors: Record<string, string>;
  rotation: number;
  tileSizeCm: number;
}) {
  const [texture, setTexture] = useState<string>();
  const [failed, setFailed] = useState(false);
  const [compact, setCompact] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches);
  const across = tilesAcrossForCm(tileSizeCm, compact);
  const rows = tilesDeepForCm(tileSizeCm, compact);
  const tileScale = tileScaleForCm(tileSizeCm);
  const handleFloorError = useCallback(() => setFailed(true), []);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const sync = () => setCompact(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    if (imageUrl) {
      setTexture(imageUrl);
    }
    const resolution = tileRasterSize(compact);
    const handle = window.setTimeout(() => {
      const source = imageUrl
        ? rasterImageTextureUrl(imageUrl, rotation, 1, resolution)
        : vectorUrl
          ? tileTextureUrl(vectorUrl, regionColors, rotation, 1, resolution)
          : Promise.reject(new Error('missing preview source'));
      void source
        .then((url) => {
          if (cancelled) {
            return;
          }
          setTexture(url);
          if (import.meta.env.DEV) {
            console.log({
              selectedMouldId: imageUrl ? 'uploaded-image' : vectorUrl,
              svgLength: url.length,
              regionCount: Object.keys(regionColors).length,
              regionColors,
              textureWidth: resolution,
              textureHeight: resolution,
              previewMode: 'floor',
              tileScale,
            });
          }
        })
        .catch((error) => {
          console.error('Preview render failed', error);
          if (cancelled) {
            return;
          }
          if (imageUrl) {
            setTexture(imageUrl);
            return;
          }
          setFailed(true);
        });
    }, 40);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [vectorUrl, imageUrl, imageRevision, regionColors, rotation, compact, tileScale]);

  const showFallback = failed || !texture;

  return (
    <div className="room-scene relative h-[260px] w-full overflow-hidden border border-charcoal/10 bg-[#eadfcf] sm:h-[340px] md:h-[560px] lg:h-[620px]">
      <div
        className="room-scene__wall pointer-events-none absolute inset-x-0 top-0"
        style={{ height: `${ROOM_WALL_PERCENT}%` }}
      />
      {showFallback ? (
        <div
          className="absolute inset-x-0 bottom-0 grid bg-white"
          style={{ height: `${ROOM_FLOOR_PERCENT}%`, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}
        >
          {Array.from({ length: 16 }, (_, index) => (
            imageUrl ? (
              <img
                key={`${imageUrl}-${rotation}-${index}`}
                src={imageUrl}
                alt=""
                className="h-full w-full object-cover"
                style={{ transform: `rotate(${rotation}deg)` }}
              />
            ) : (
              <ConfigurableTile
                key={`${vectorUrl}-${index}`}
                src={vectorUrl ?? ''}
                regionColors={regionColors}
                colors={[]}
                rotation={rotation}
                className="h-full w-full bg-white [&_svg]:h-full [&_svg]:w-full"
              />
            )
          ))}
        </div>
      ) : (
        <PerspectiveFloor
          textureUrl={texture}
          across={across}
          rows={rows}
          className="absolute inset-x-0 bottom-0"
          heightPercent={ROOM_FLOOR_PERCENT}
          onError={handleFloorError}
        />
      )}
      <div
        className="room-scene__junction pointer-events-none absolute inset-x-0 z-[1]"
        style={{ top: `calc(${ROOM_WALL_PERCENT}% - 2px)` }}
      />
      <RoomFurniture scene="floor" />
    </div>
  );
}

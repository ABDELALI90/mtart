/** Factory videos served from `public/videos/` — keep filenames as they exist on disk. */

export interface FactoryVideo {
  id: string;
  file: string;
  poster: string;
}

function video(id: string, file: string, posterIndex: string): FactoryVideo {
  return {
    id,
    file,
    poster: `/videos/posters/video-${posterIndex}.jpg`,
  };
}

export function factoryVideoSrc(file: string): string {
  return `/videos/${encodeURIComponent(file)}`;
}

const fillingClose = video('filling-close', 'WhatsApp Video 2026-08-15 at 14.25.41.mp4', '01');
const pigments = video('pigments', 'WhatsApp Video 2026-08-15 at 14.25.49.mp4', '03');
const preparingMould = video('preparing-mould', 'WhatsApp Video 2026-08-15 at 14.25.56.mp4', '04');
const artisanFilling = video('artisan-filling', 'WhatsApp Video 2026-08-15 at 14.26.07.mp4', '05');
const mouldPress = video('mould-press', 'WhatsApp Video 2026-08-15 at 14.26.14.mp4', '06');
const pressing = video('pressing', 'WhatsApp Video 2026-08-15 at 14.26.23.mp4', '08');
const finishing = video('finishing', 'WhatsApp Video 2026-08-15 at 14.26.34.mp4', '10');
const finalDisplay = video('final-display', 'WhatsApp Video 2026-08-15 at 14.26.39.mp4', '11');

/** Longest artisan clip — best single hero background. */
export const HERO_VIDEO = artisanFilling;

export const HERO_POSTER_FALLBACK = '/images/home/hero.jpg';

export const CRAFT_STEPS: { step: '1' | '2' | '3' | '4' | '5' | '6' | '7'; video: FactoryVideo }[] = [
  { step: '1', video: preparingMould },
  { step: '2', video: pigments },
  { step: '3', video: fillingClose },
  { step: '4', video: mouldPress },
  { step: '5', video: pressing },
  { step: '6', video: finishing },
  { step: '7', video: finalDisplay },
];

export const CRAFT_PREVIEW_VIDEOS: FactoryVideo[] = [pigments, fillingClose, finalDisplay];

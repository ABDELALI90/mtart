import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { clsx } from 'clsx';
import { looksLikeAssetPath } from '@/utils/media';

export interface ResponsiveImageProps {
  src?: string | null;
  alt: string;
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain';
  loading?: 'lazy' | 'eager';
  className?: string;
  /** Shown inside the placeholder block when `src` is missing/broken - e.g. "Zellige · Model 1020". */
  placeholderLabel?: string;
  sizes?: string;
}

/**
 * Central image primitive for the whole site. Reserves aspect ratio up front (no layout shift),
 * lazy-loads by default, and degrades to an elegant, clearly-marked placeholder - never a broken
 * image icon or a generic stock photo - whenever `src` is absent or fails to load.
 *
 * TODO(real photography): every placeholder marks a spot to drop a real MT ART photo - see
 * public/images/README.md for where files should go.
 */
export function ResponsiveImage({
  src,
  alt,
  aspectRatio,
  objectFit = 'cover',
  loading = 'lazy',
  className,
  placeholderLabel,
  sizes,
}: ResponsiveImageProps) {
  const [failed, setFailed] = useState(false);
  const showPlaceholder = !src || failed;

  return (
    <div
      className={clsx('relative overflow-hidden bg-ivory-dark', className)}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {showPlaceholder ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ivory-dark text-charcoal-soft">
          <ImageOff className="h-6 w-6 opacity-40" aria-hidden="true" />
          {placeholderLabel && !looksLikeAssetPath(placeholderLabel) ? (
            <span className="px-4 text-center text-[11px] font-medium uppercase tracking-[0.14em] opacity-60">
              {placeholderLabel}
            </span>
          ) : null}
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading={loading}
          sizes={sizes}
          onError={(event) => {
            const failedSrc = event.currentTarget.currentSrc || event.currentTarget.src || src;
            console.error('[MT ART image] failed to load', failedSrc);
            setFailed(true);
          }}
          className={clsx(
            'h-full w-full',
            objectFit === 'cover' ? 'object-cover' : 'object-contain',
          )}
        />
      )}
    </div>
  );
}

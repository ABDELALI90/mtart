import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import { factoryVideoSrc, type FactoryVideo } from '@/features/craft/videos';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface LazyFactoryVideoProps {
  video: FactoryVideo;
  title: string;
  variant?: 'story' | 'preview';
  controls?: boolean;
  fallbackPoster?: string;
}

export function LazyFactoryVideo({
  video,
  title,
  variant = 'story',
  controls = true,
  fallbackPoster,
}: LazyFactoryVideoProps) {
  const reducedMotion = usePrefersReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [nearViewport, setNearViewport] = useState(false);
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const poster = video.poster || fallbackPoster;
  const preview = variant === 'preview';

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNearViewport(true);
        } else if (preview) {
          videoRef.current?.pause();
          setPlaying(false);
        }
      },
      { rootMargin: '240px 0px', threshold: 0.2 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [preview]);

  const shouldLoad = nearViewport && !reducedMotion && !failed;
  const showImage = reducedMotion || failed || !shouldLoad;

  function togglePreviewPlayback() {
    const el = videoRef.current;
    if (!el || !preview) return;
    if (el.paused) {
      el.muted = true;
      void el.play().then(() => setPlaying(true)).catch(() => setFailed(true));
    } else {
      el.pause();
      setPlaying(false);
    }
  }

  return (
    <Box
      ref={containerRef}
      onClick={preview && shouldLoad ? togglePreviewPlayback : undefined}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 1,
        bgcolor: 'action.hover',
        aspectRatio: preview ? '3 / 4' : { xs: '3 / 4', md: '4 / 5' },
        maxHeight: preview ? 280 : { md: 560 },
        width: '100%',
        cursor: preview && shouldLoad ? 'pointer' : 'default',
      }}
    >
      {showImage ? (
        <Box
          component="img"
          src={poster}
          alt={title}
          loading="lazy"
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <Box
          component="video"
          ref={videoRef}
          poster={poster}
          playsInline
          muted={preview}
          loop={preview}
          controls={controls && !preview}
          preload="none"
          controlsList="nodownload"
          disablePictureInPicture
          onError={() => setFailed(true)}
          aria-label={title}
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        >
          <source src={factoryVideoSrc(video.file)} type="video/mp4" />
        </Box>
      )}

      {preview && shouldLoad && !playing ? (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(17,17,17,0.22)',
            pointerEvents: 'none',
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box
              sx={{
                width: 0,
                height: 0,
                ml: '3px',
                borderTop: '7px solid transparent',
                borderBottom: '7px solid transparent',
                borderLeft: '11px solid #fff',
              }}
            />
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}

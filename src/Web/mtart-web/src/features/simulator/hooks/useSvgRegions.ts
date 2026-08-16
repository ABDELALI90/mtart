import { useEffect, useState } from 'react';
import { extractSvgRegions, loadSvgMarkup, prepareSvgMarkup } from '../utils/svgPaint';

export function useSvgRegions(src?: string | null) {
  const [keys, setKeys] = useState<string[]>([]);

  useEffect(() => {
    if (!src) {
      setKeys([]);
      return;
    }
    let cancelled = false;
    loadSvgMarkup(src)
      .then((markup) => {
        if (!cancelled) {
          setKeys(extractSvgRegions(prepareSvgMarkup(markup, src)));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setKeys([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [src]);

  return keys;
}

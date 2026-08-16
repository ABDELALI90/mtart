import { useEffect, useState } from 'react';
import {
  canRedoImage,
  canUndoImage,
  ensureImageSession,
  getImageRevision,
  getImageTextureUrl,
  subscribeImageSession,
} from '../utils/imageColorSession';

export function useImageColorSession(id?: string, sourceUrl?: string) {
  const [revision, setRevision] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!id || !sourceUrl) {
      setReady(false);
      return;
    }
    let cancelled = false;
    void ensureImageSession(id, sourceUrl).then(() => {
      if (!cancelled) {
        setReady(true);
        setRevision(getImageRevision(id));
      }
    }).catch((error) => {
      console.error('Preview render failed', error);
    });
    return subscribeImageSession(id, () => {
      if (!cancelled) {
        setRevision((current) => current + 1);
        setReady(true);
      }
    });
  }, [id, sourceUrl]);

  return {
    ready,
    revision,
    textureUrl: id ? getImageTextureUrl(id) : undefined,
    canUndo: id ? canUndoImage(id) : false,
    canRedo: id ? canRedoImage(id) : false,
  };
}

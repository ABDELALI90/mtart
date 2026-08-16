import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Resets window scroll on every route change so a new page never opens
 * at the previous page's scroll offset.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return null;
}

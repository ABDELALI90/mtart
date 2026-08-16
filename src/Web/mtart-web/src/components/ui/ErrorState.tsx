import { RefreshCw, TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}

/** Used whenever a TanStack Query call fails - never let a failed fetch produce a blank/crashed section. */
export function ErrorState({ message, onRetry, compact }: ErrorStateProps) {
  const { t } = useTranslation();

  return (
    <div
      className={
        compact
          ? 'flex flex-col items-center gap-3 py-8 text-center'
          : 'flex flex-col items-center gap-4 rounded-none border border-charcoal/10 bg-ivory-dark/60 px-6 py-16 text-center'
      }
      role="alert"
    >
      <TriangleAlert className="h-6 w-6 text-charcoal-soft" aria-hidden="true" />
      <p className="max-w-sm text-sm text-charcoal-soft">{message || t('common.errorGeneric')}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 text-sm font-medium text-charcoal underline-offset-4 hover:underline"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          {t('common.retry')}
        </button>
      ) : null}
    </div>
  );
}

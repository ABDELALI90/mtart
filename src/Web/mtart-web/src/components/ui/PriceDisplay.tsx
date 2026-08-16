import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import type { PriceVisibility } from '@/types/catalog';
import { useLang } from '@/hooks/useLang';

type PriceSize = 'sm' | 'md' | 'lg' | 'xl';

const sizeClass: Record<PriceSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl md:text-2xl',
  xl: 'text-2xl md:text-[32px]',
};

export function PriceDisplay({
  amount,
  currency = 'MAD',
  unit = 'm²',
  size = 'md',
  visibility = 'Public',
  className,
}: {
  amount?: number | null;
  currency?: string;
  unit?: string;
  size?: PriceSize;
  visibility?: PriceVisibility;
  className?: string;
}) {
  const { t } = useTranslation();
  const lang = useLang();
  const isolateLtr = lang === 'ar';

  if (visibility === 'Hidden') {
    return null;
  }

  if (visibility === 'QuoteOnly' || amount == null) {
    return (
      <p className={clsx('font-medium text-charcoal', sizeClass[size === 'xl' ? 'lg' : size], className)}>
        {t('common.contactUs')}
      </p>
    );
  }

  return (
    <p
      className={clsx('font-semibold tracking-tight text-charcoal', sizeClass[size], className)}
      dir={isolateLtr ? 'ltr' : undefined}
      style={isolateLtr ? { unicodeBidi: 'isolate' } : undefined}
    >
      <span>{amount.toLocaleString()} {currency}</span>
      {unit ? <span className="ms-1 font-medium text-charcoal-soft/80">/ {unit}</span> : null}
    </p>
  );
}

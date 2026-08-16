import { useTranslation } from 'react-i18next';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import type { PriceVisibility } from '@/types/catalog';

export function SimulatorSummary({
  reference,
  colors,
  size,
  pricePerM2,
  currency,
  visibility,
}: {
  reference?: string;
  colors: string;
  size?: string;
  pricePerM2?: number | null;
  currency?: string;
  visibility?: PriceVisibility | null;
}) {
  const { t } = useTranslation();
  return (
    <div className="grid gap-6 border-t border-charcoal/10 px-4 py-6 md:grid-cols-4 md:px-8">
      <SummaryItem label={t('simulator.reference')} value={reference ?? '—'} />
      <SummaryItem label={t('simulator.selectedColors')} value={colors || '—'} />
      <SummaryItem label={t('simulator.size')} value={size ?? '—'} />
      <div>
        <p className="text-[10px] uppercase tracking-[0.16em] text-charcoal-soft">{t('simulator.price')}</p>
        <PriceDisplay amount={pricePerM2 || null} currency={currency} visibility={visibility ?? 'QuoteOnly'} size="xl" className="mt-1" />
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.16em] text-charcoal-soft">{label}</p>
      <p className="mt-1 font-display text-lg text-charcoal">{value}</p>
    </div>
  );
}

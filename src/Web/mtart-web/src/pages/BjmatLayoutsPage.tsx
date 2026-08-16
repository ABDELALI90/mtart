import { useTranslation } from 'react-i18next';
import { PageMeta } from '@/utils/seo';
import { useLang } from '@/hooks/useLang';
import { useColors } from '@/features/colors/hooks';
import { BjmatLayoutVisualizer } from '@/features/bjmat/BjmatLayoutVisualizer';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatApiError } from '@/services/apiClient';

export function BjmatLayoutsPage() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data: colors, isError, error, refetch, isLoading } = useColors(lang, undefined, 'Bejmat');

  return (
    <>
      <PageMeta title={t('bjmat.layoutsHeading')} description={t('bjmat.layoutsBody')} lang={lang} path="/bjmat/layouts" />
      <div className="border-b border-charcoal/10 bg-ivory-dark py-14 pt-32 md:pt-40">
        <div className="container-mtart">
          <h1 className="font-display text-3xl text-charcoal md:text-4xl">{t('bjmat.layoutsHeading')}</h1>
          <p className="mt-3 max-w-xl text-sm text-charcoal-soft/75">{t('bjmat.layoutsBody')}</p>
        </div>
      </div>
      <div className="container-mtart py-14">
        {isLoading ? (
          <p className="text-sm text-charcoal-soft">{t('common.loading')}</p>
        ) : isError ? (
          <ErrorState message={formatApiError(error, t('colors.unavailable'))} onRetry={() => refetch()} />
        ) : !colors || colors.length === 0 ? (
          <EmptyState message={t('common.noResults')} />
        ) : (
          <BjmatLayoutVisualizer colors={colors} />
        )}
      </div>
    </>
  );
}

export default BjmatLayoutsPage;

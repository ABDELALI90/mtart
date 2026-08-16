import { useTranslation } from 'react-i18next';
import { PageMeta } from '@/utils/seo';
import { useLang } from '@/hooks/useLang';
import { useFormats } from '@/features/catalog/hooks';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatApiError } from '@/services/apiClient';
import { FormatShapeIcon } from '@/components/format/FormatShapeIcon';
import type { MaterialType } from '@/types/catalog';

export function FormatsPage({
  material,
  titleKey = 'formatsPage.title',
  subtitleKey = 'formatsPage.subtitle',
  path = '/formats',
}: {
  material?: MaterialType;
  titleKey?: string;
  subtitleKey?: string;
  path?: string;
} = {}) {
  const { t } = useTranslation();
  const lang = useLang();
  const { data, isError, error, isLoading, refetch } = useFormats(lang, undefined, material);
  const formats = (data ?? []).filter((format) => format.isActive);

  const contact = t('common.contactUs');

  return (
    <>
      <PageMeta title={t(titleKey)} description={t(subtitleKey)} lang={lang} path={path} />
      <div className="border-b border-charcoal/10 bg-ivory-dark py-14 pt-32 md:pt-40">
        <div className="container-mtart">
          <h1 className="mtart-page-enter font-display text-3xl text-charcoal md:text-4xl">{t(titleKey)}</h1>
          <p className="mt-3 max-w-xl text-sm text-charcoal-soft/75">{t(subtitleKey)}</p>
        </div>
      </div>
      <div className="container-mtart py-14 md:py-20">
        {isLoading ? (
          <p className="text-sm text-charcoal-soft">{t('common.loading')}</p>
        ) : isError ? (
          <ErrorState message={formatApiError(error, t('common.errorGeneric'))} onRetry={() => refetch()} />
        ) : formats.length === 0 ? (
          <EmptyState message={t('common.noResults')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-charcoal/15 text-[11px] uppercase tracking-[0.14em] text-charcoal-soft">
                  <th className="py-3 pe-4 font-medium">{t('formatsPage.shape')}</th>
                  <th className="py-3 pe-4 font-medium">{t('formatsPage.format')}</th>
                  <th className="py-3 pe-4 font-medium">{t('formatsPage.reference')}</th>
                  <th className="py-3 pe-4 font-medium">{t('formatsPage.dimensions')}</th>
                  <th className="py-3 pe-4 font-medium">{t('formatsPage.thickness')}</th>
                  <th className="py-3 pe-4 font-medium">{t('formatsPage.weightUnit')}</th>
                  <th className="py-3 pe-4 font-medium">{t('formatsPage.units')}</th>
                  <th className="py-3 font-medium">{t('formatsPage.weightM2')}</th>
                </tr>
              </thead>
              <tbody>
                {formats.map((format) => {
                  const verified = format.hasVerifiedTechnicalData;
                  return (
                    <tr key={format.id} className="border-b border-charcoal/10 align-middle">
                      <td className="py-4 pe-4">
                        <FormatShapeIcon widthCm={format.widthCm} heightCm={format.heightCm} />
                      </td>
                      <td className="py-4 pe-4 font-display text-lg text-charcoal">{format.name ?? format.reference}</td>
                      <td className="py-4 pe-4 uppercase tracking-wide text-charcoal-soft">{format.reference}</td>
                      <td className="py-4 pe-4">{format.widthCm} × {format.heightCm} cm</td>
                      <td className="py-4 pe-4">{format.thicknessCm} cm</td>
                      <td className="py-4 pe-4">{verified && format.weightPerUnitKg > 0 ? `${format.weightPerUnitKg} kg` : contact}</td>
                      <td className="py-4 pe-4">{format.unitsPerM2}</td>
                      <td className="py-4">{verified && format.weightPerM2Kg > 0 ? `${format.weightPerM2Kg} kg/m²` : contact}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export default FormatsPage;

import { useTranslation } from 'react-i18next';

export function SimulatorStartGate({
  onChooseReference,
  onCreateDesign,
}: {
  onChooseReference: () => void;
  onCreateDesign: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="bg-ivory px-4 py-16 md:px-8 md:py-24">
      <p className="text-center text-[11px] uppercase tracking-[0.2em] text-charcoal-soft">{t('simulator.eyebrow')}</p>
      <h1 className="mt-2 text-center font-display text-3xl text-charcoal md:text-4xl">{t('simulator.startTitle')}</h1>
      <p className="mx-auto mt-3 max-w-xl text-center text-sm text-charcoal-soft/75">{t('simulator.startSubtitle')}</p>
      <div className="mx-auto mt-10 grid max-w-3xl gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <button
          type="button"
          onClick={onChooseReference}
          className="border border-charcoal/15 bg-ivory p-8 text-left transition hover:border-charcoal hover:shadow-md"
        >
          <p className="text-[11px] uppercase tracking-[0.18em] text-charcoal-soft">{t('simulator.chooseMouldKicker')}</p>
          <h2 className="mt-2 font-display text-2xl">{t('simulator.chooseMould')}</h2>
          <p className="mt-2 text-sm text-charcoal-soft/75">{t('simulator.chooseMouldBody')}</p>
        </button>
        <p className="text-center text-xs uppercase tracking-[0.2em] text-charcoal-soft">{t('simulator.or')}</p>
        <button
          type="button"
          onClick={onCreateDesign}
          className="border border-petrol bg-petrol p-8 text-left text-ivory transition hover:bg-charcoal"
        >
          <p className="text-[11px] uppercase tracking-[0.18em] text-ivory/70">{t('simulator.createKicker')}</p>
          <h2 className="mt-2 font-display text-2xl">{t('simulator.createDesign')}</h2>
          <p className="mt-2 text-sm text-ivory/80">{t('simulator.createDesignBody')}</p>
        </button>
      </div>
    </div>
  );
}

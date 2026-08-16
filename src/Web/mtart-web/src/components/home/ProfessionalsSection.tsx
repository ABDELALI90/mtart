import { useTranslation } from 'react-i18next';
import { Building2, Hammer, HomeIcon, Hotel, Store, UtensilsCrossed } from 'lucide-react';
import { Section, SectionHeading } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { useLang } from '@/hooks/useLang';
import { ROUTES } from '@/utils/paths';

const AUDIENCES = [
  { key: 'architects', icon: Building2 },
  { key: 'designers', icon: HomeIcon },
  { key: 'hotels', icon: Hotel },
  { key: 'restaurants', icon: UtensilsCrossed },
  { key: 'distributors', icon: Store },
  { key: 'contractors', icon: Hammer },
] as const;

export function ProfessionalsSection() {
  const { t } = useTranslation();
  const lang = useLang();

  return (
    <Section tone="charcoal">
      <SectionHeading
        eyebrow="MT ART"
        title={t('home.professionals.heading')}
        subtitle={t('home.professionals.body')}
        className="[&_h2]:text-ivory [&_p]:text-ivory/75"
      />

      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 md:gap-10">
        {AUDIENCES.map(({ key, icon: Icon }) => (
          <div key={key} className="flex flex-col items-start gap-3 border-t border-ivory/15 pt-5">
            <Icon className="h-6 w-6 text-sand" aria-hidden="true" />
            <span className="text-sm font-medium text-ivory/90">{t(`professionalsPage.audiences.${key}`)}</span>
          </div>
        ))}
      </div>

      <Button to={ROUTES.requestQuote(lang)} variant="outline-light" size="lg" className="mt-12">
        {t('home.professionals.cta')}
      </Button>
    </Section>
  );
}

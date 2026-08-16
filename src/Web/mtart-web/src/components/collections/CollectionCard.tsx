import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight } from 'lucide-react';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { catalogImageUrl } from '@/utils/media';
import { ROUTES } from '@/utils/paths';
import type { Collection } from '@/types/catalog';

export function CollectionCard({
  collection,
  lang,
  index = 0,
}: {
  collection: Collection;
  lang: string;
  index?: number;
}) {
  const { t } = useTranslation();
  const image = catalogImageUrl(collection.coverImageUrl, { cropped: true });

  return (
    <Link
      to={ROUTES.collection(lang, collection.slug)}
      className="mtart-card mtart-media-card group block"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="relative overflow-hidden">
        <ResponsiveImage
          src={image}
          alt={collection.name}
          aspectRatio="4/5"
          placeholderLabel={collection.name}
          className="mtart-card-media"
        />
        <div className="pointer-events-none absolute inset-0 bg-cinema/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <span className="absolute bottom-4 end-4 inline-flex h-10 w-10 translate-x-2 items-center justify-center bg-ivory text-charcoal opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 rtl:-translate-x-2 rtl:group-hover:translate-x-0">
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <div className="mt-4">
        <h2 className="font-display text-xl text-charcoal">{collection.name}</h2>
        {collection.story ? <p className="mt-2 line-clamp-2 text-sm text-charcoal-soft/75">{collection.story}</p> : null}
        <p className="mt-3 text-xs uppercase tracking-[0.14em] text-charcoal-soft/70">
          {t('collections.productCount', { count: collection.productCount ?? 0 })}
        </p>
        <span className="mt-2 inline-block text-xs font-medium uppercase tracking-[0.14em] text-charcoal">
          {t('collections.viewCollection')}
        </span>
      </div>
    </Link>
  );
}

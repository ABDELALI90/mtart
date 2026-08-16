import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ColorModeToggle } from '@/theme/ColorModeToggle';
import { ROUTES } from '@/utils/paths';

interface ReviewItem {
  reference: string;
  status: string;
  confidence: number;
  iou: number;
  published: boolean;
  reason?: string | null;
  crop_url?: string | null;
  preview_url?: string | null;
  svg_url?: string | null;
  source_image?: string | null;
}

interface ReviewPayload {
  generatedAt: string;
  publishThreshold: number;
  published: number;
  rejected: number;
  items: ReviewItem[];
}

export function AdminMouldReviewPage() {
  const query = useQuery({
    queryKey: ['mould-extraction-review'],
    queryFn: async () => {
      const response = await fetch('/moulds/vectorize-review.json');
      if (!response.ok) {
        throw new Error('Review file missing. Run python tools/vectorize-moulds/vectorize.py');
      }
      return response.json() as Promise<ReviewPayload>;
    },
  });
  const data = query.data;

  return (
    <div className="min-h-screen bg-ivory text-charcoal">
      <header className="flex items-center justify-between border-b border-charcoal/10 px-6 py-4">
        <p className="text-xs uppercase tracking-[0.2em]">MT ART Admin</p>
        <nav className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-wide">
          <Link to={ROUTES.adminImport()}>Import</Link>
          <Link to={ROUTES.adminMoulds()}>Moulds</Link>
          <Link to={ROUTES.adminMouldReview()}>Extraction</Link>
          <a href="/moulds/review.html">HTML review</a>
          <ColorModeToggle />
        </nav>
      </header>
      <main className="px-6 py-8">
        <h1 className="mb-2 font-display text-3xl">Mould extraction review</h1>
        <p className="mb-8 max-w-2xl text-sm text-charcoal-soft">
          Source crop versus generated outline. Only items at or above the publish threshold appear in the customer catalogue.
        </p>
        {data ? (
          <p className="mb-6 text-sm">
            Published {data.published} · Hidden {data.rejected} · Threshold {data.publishThreshold.toFixed(2)}
          </p>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(data?.items ?? []).map((item) => (
            <article key={item.reference} className={`border bg-white p-3 ${item.published ? 'border-petrol' : 'border-charcoal/10'}`}>
              <div className="mb-2 flex items-baseline gap-2">
                <strong>{item.reference}</strong>
                <span className="text-[10px] uppercase tracking-wide text-charcoal-soft">{item.published ? 'published' : item.status}</span>
                <span className="ml-auto text-sm">{item.confidence.toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <figure>
                  {item.crop_url ? <img src={item.crop_url} alt={`${item.reference} source`} className="aspect-square w-full bg-white object-contain" /> : <div className="aspect-square bg-ivory" />}
                  <figcaption className="mt-1 text-center text-[10px] uppercase tracking-wide text-charcoal-soft">Source</figcaption>
                </figure>
                <figure>
                  {item.preview_url ? <img src={item.preview_url} alt={`${item.reference} mould`} className="aspect-square w-full bg-white object-contain" /> : <div className="aspect-square bg-ivory" />}
                  <figcaption className="mt-1 text-center text-[10px] uppercase tracking-wide text-charcoal-soft">Generated</figcaption>
                </figure>
              </div>
              <p className="mt-2 text-[11px] text-charcoal-soft">{item.reason ?? item.svg_url ?? ''}</p>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}

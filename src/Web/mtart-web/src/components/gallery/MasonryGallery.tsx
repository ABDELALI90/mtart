import { ResponsiveImage } from '@/components/ui/ResponsiveImage';

interface MasonryItem {
  id: string;
  label: string;
  aspectRatio: string;
  src?: string | null;
}

export function MasonryGallery({ items }: { items: MasonryItem[] }) {
  return (
    <div className="columns-2 gap-4 md:columns-3 md:gap-6">
      {items.map((item) => (
        <div key={item.id} className="mb-4 break-inside-avoid md:mb-6">
          <ResponsiveImage src={item.src} alt={item.label} aspectRatio={item.aspectRatio} placeholderLabel={item.label} />
        </div>
      ))}
    </div>
  );
}

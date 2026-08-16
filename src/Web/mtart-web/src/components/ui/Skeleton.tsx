import { clsx } from 'clsx';

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('animate-pulse bg-ivory-dark', className)} aria-hidden="true" />;
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-[4/5] w-full" />
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export function CollectionCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-[3/4] w-full" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function ColorSwatchSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="aspect-square w-full" />
      <Skeleton className="mx-auto h-3 w-10" />
    </div>
  );
}

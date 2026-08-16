import { clsx } from 'clsx';

export function FormatShapeIcon({
  widthCm,
  heightCm,
  className,
}: {
  widthCm: number;
  heightCm: number;
  className?: string;
}) {
  const max = Math.max(widthCm, heightCm, 1);
  const w = (widthCm / max) * 48;
  const h = (heightCm / max) * 48;

  return (
    <svg viewBox="0 0 64 64" className={clsx('h-16 w-16 text-charcoal', className)} aria-hidden="true">
      <rect
        x={(64 - w) / 2}
        y={(64 - h) / 2}
        width={w}
        height={h}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

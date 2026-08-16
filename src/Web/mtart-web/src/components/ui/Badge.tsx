import type { ReactNode } from 'react';
import { clsx } from 'clsx';

interface BadgeProps {
  children: ReactNode;
  tone?: 'terracotta' | 'petrol' | 'charcoal';
  className?: string;
}

const tones: Record<NonNullable<BadgeProps['tone']>, string> = {
  terracotta: 'border border-charcoal/15 text-charcoal',
  petrol: 'border border-charcoal/15 text-charcoal',
  charcoal: 'bg-charcoal text-ivory',
};

export function Badge({ children, tone = 'charcoal', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em]',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

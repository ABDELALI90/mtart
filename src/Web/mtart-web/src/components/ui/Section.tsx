import type { ReactNode } from 'react';
import { clsx } from 'clsx';

interface SectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  tone?: 'ivory' | 'charcoal' | 'sand';
  containerClassName?: string;
  narrow?: boolean;
}

const tones: Record<NonNullable<SectionProps['tone']>, string> = {
  ivory: 'bg-ivory text-charcoal',
  charcoal: 'bg-charcoal text-ivory',
  sand: 'bg-ivory-dark text-charcoal',
};

export function Section({ children, className, id, tone = 'ivory', containerClassName, narrow }: SectionProps) {
  return (
    <section id={id} className={clsx('py-16 md:py-24', tones[tone], className)}>
      <div className={clsx(narrow ? 'container-mtart max-w-3xl' : 'container-mtart', containerClassName)}>
        {children}
      </div>
    </section>
  );
}

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
}

export function SectionHeading({ eyebrow, title, subtitle, align = 'left', className }: SectionHeadingProps) {
  return (
    <div className={clsx('mb-10 md:mb-14', align === 'center' && 'text-center', className)}>
      {eyebrow ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-charcoal-soft">{eyebrow}</p>
      ) : null}
      <h2 className="font-display text-3xl leading-tight text-charcoal md:text-4xl">{title}</h2>
      {subtitle ? <p className="mt-4 max-w-2xl text-base text-charcoal-soft/80 md:text-lg">{subtitle}</p> : null}
    </div>
  );
}

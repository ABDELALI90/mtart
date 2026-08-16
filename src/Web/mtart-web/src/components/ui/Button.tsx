import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline-light' | 'on-photo';
type Size = 'md' | 'lg';

const base =
  'inline-flex min-h-11 items-center justify-center gap-2 font-medium tracking-wide transition-opacity duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

const variants: Record<Variant, string> = {
  primary: 'bg-action text-action-text hover:opacity-90',
  secondary: 'bg-transparent text-charcoal border border-charcoal hover:bg-charcoal hover:text-ivory',
  ghost: 'bg-transparent text-charcoal hover:opacity-70',
  'outline-light': 'bg-transparent text-ivory border border-ivory/70 hover:bg-ivory hover:text-charcoal',
  'on-photo': 'bg-transparent text-cinema-fg border border-cinema-fg/70 hover:bg-cinema-fg hover:text-cinema',
};

const sizes: Record<Size, string> = {
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-sm',
};

interface BaseProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

interface RouterLinkProps extends BaseProps {
  to: string;
  href?: undefined;
  onClick?: never;
}

interface AnchorProps extends BaseProps {
  href: string;
  to?: undefined;
  target?: string;
  rel?: string;
  download?: boolean | string;
}

interface NativeButtonProps extends BaseProps {
  to?: undefined;
  href?: undefined;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  disabled?: boolean;
  'aria-label'?: string;
  'aria-expanded'?: boolean;
  'aria-controls'?: string;
}

export type ButtonProps = RouterLinkProps | AnchorProps | NativeButtonProps;

/** Single button primitive: renders a router <Link>, a native <a>, or a <button> based on props. */
export function Button(props: ButtonProps) {
  const { variant = 'primary', size = 'md', className, children } = props;
  const classes = clsx(base, variants[variant], sizes[size], className);

  if (props.to !== undefined) {
    return (
      <Link to={props.to} className={classes}>
        {children}
      </Link>
    );
  }

  if (props.href !== undefined) {
    return (
      <a href={props.href} target={props.target} rel={props.rel} download={props.download} className={classes}>
        {children}
      </a>
    );
  }

  const buttonProps = props as NativeButtonProps;
  return (
    <button
      type={buttonProps.type ?? 'button'}
      onClick={buttonProps.onClick}
      disabled={buttonProps.disabled}
      aria-label={buttonProps['aria-label']}
      aria-expanded={buttonProps['aria-expanded']}
      aria-controls={buttonProps['aria-controls']}
      className={classes}
    >
      {children}
    </button>
  );
}

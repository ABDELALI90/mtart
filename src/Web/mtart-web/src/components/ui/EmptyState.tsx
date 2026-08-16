import type { ReactNode } from 'react';

interface EmptyStateProps {
  message: string;
  action?: ReactNode;
}

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 border border-dashed border-charcoal/15 px-6 py-16 text-center">
      <p className="max-w-sm text-sm text-charcoal-soft">{message}</p>
      {action}
    </div>
  );
}

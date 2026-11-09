import type { ReactNode } from 'react';

interface EmptyStateProps {
  message: ReactNode;
  description?: ReactNode;
  className?: string;
}

export function EmptyState({ message, description, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`py-8 px-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 ${className}`}
    >
      <p className="text-sm font-medium text-slate-600">{message}</p>
      {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
    </div>
  );
}

import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: ReactNode;
  subtext?: ReactNode;
  variant?: 'default' | 'primary';
  className?: string;
}

export function StatCard({
  label,
  value,
  subtext,
  variant = 'default',
  className = '',
}: StatCardProps) {
  if (variant === 'primary') {
    return (
      <div
        className={`bg-blue-600 text-white rounded-xl p-6 flex flex-col justify-between shadow-xs ${className}`}
      >
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-blue-100">
            {label}
          </span>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        {subtext && <span className="text-xs text-blue-100 mt-3">{subtext}</span>}
      </div>
    );
  }

  return (
    <div
      className={`bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between ${className}`}
    >
      <div>
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</span>
        <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
      </div>
      {subtext && <span className="text-xs text-slate-400 mt-3">{subtext}</span>}
    </div>
  );
}

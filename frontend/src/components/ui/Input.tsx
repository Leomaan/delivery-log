import type { InputHTMLAttributes, SelectHTMLAttributes } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { FeedbackMessage } from '../../types/domain';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, id, className = '', ...rest }: InputProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none ${className}`}
        {...rest}
      />
    </div>
  );
}

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
}

export function Select({ label, id, options, className = '', ...rest }: SelectProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-slate-600 mb-1">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-blue-600 focus:outline-none ${className}`}
        {...rest}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface FeedbackBannerProps {
  feedback: FeedbackMessage | null;
}

export function FeedbackBanner({ feedback }: FeedbackBannerProps) {
  if (!feedback) return null;

  return (
    <div
      className={`mb-4 rounded-lg border px-3 py-2 text-xs flex items-center gap-2 ${
        feedback.type === 'success'
          ? 'border-blue-200 bg-blue-50 text-blue-800'
          : 'border-red-200 bg-red-50 text-red-700'
      }`}
    >
      <CheckCircle2 className="w-4 h-4 shrink-0" />
      <span>{feedback.text}</span>
    </div>
  );
}

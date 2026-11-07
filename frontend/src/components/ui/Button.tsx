import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Pencil, Trash2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'tab';
type ButtonSize = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  active?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium',
  secondary:
    'border border-slate-200 bg-white hover:bg-slate-50 hover:border-blue-600 hover:text-blue-600 text-slate-700',
  danger: 'bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-medium',
  ghost: 'text-slate-500 hover:text-blue-600 bg-transparent',
  tab: '',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  active = false,
  fullWidth = false,
  className = '',
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  const tabClass =
    variant === 'tab'
      ? active
        ? 'bg-blue-600 text-white shadow-xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
      : VARIANT_CLASSES[variant];

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none ${SIZE_CLASSES[size]} ${tabClass} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

interface InlineRowActionsProps {
  isEditing: boolean;
  isDeleting: boolean;
  deleteConfirmLabel?: string;
  onStartEdit: () => void;
  onConfirmEdit: () => void;
  onCancelEdit: () => void;
  onStartDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  align?: 'end' | 'center';
}

export function InlineRowActions({
  isEditing,
  isDeleting,
  deleteConfirmLabel = 'Excluir?',
  onStartEdit,
  onConfirmEdit,
  onCancelEdit,
  onStartDelete,
  onConfirmDelete,
  onCancelDelete,
  align = 'end',
}: InlineRowActionsProps) {
  const justifyClass = align === 'center' ? 'justify-center' : 'justify-end';

  if (isEditing) {
    return (
      <div className={`flex items-center ${justifyClass} gap-1.5`}>
        <Button variant="primary" size="sm" onClick={onConfirmEdit}>
          Salvar
        </Button>
        <Button variant="secondary" size="sm" onClick={onCancelEdit}>
          Voltar
        </Button>
      </div>
    );
  }

  if (isDeleting) {
    return (
      <div className={`flex items-center ${justifyClass} gap-1.5`}>
        <span className="text-xs text-slate-500 mr-1">{deleteConfirmLabel}</span>
        <Button variant="danger" size="sm" onClick={onConfirmDelete}>
          Confirmar
        </Button>
        <Button variant="secondary" size="sm" onClick={onCancelDelete}>
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex items-center ${justifyClass} gap-3`}>
      <button
        type="button"
        onClick={onStartEdit}
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
      >
        <Pencil className="w-3.5 h-3.5" />
        <span>Editar</span>
      </button>

      <button
        type="button"
        onClick={onStartDelete}
        className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Excluir</span>
      </button>
    </div>
  );
}

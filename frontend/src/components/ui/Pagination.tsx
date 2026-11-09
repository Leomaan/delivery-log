import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (newPage: number) => void;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
  className = '',
}: PaginationProps) {
  if (total <= 0) return null;

  return (
    <div
      className={`pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 ${className}`}
    >
      <span>
        Página <strong className="text-slate-800">{String(page)}</strong> de{' '}
        <strong className="text-slate-800">{String(totalPages)}</strong> ({String(total)} registros)
      </span>

      <div className="flex items-center gap-1.5">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Anterior</span>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        >
          <span>Próxima</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

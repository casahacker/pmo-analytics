import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  className,
}) => {
  if (totalPages <= 1) return null;

  const start = pageSize ? (page - 1) * pageSize + 1 : undefined;
  const end = pageSize && totalItems ? Math.min(page * pageSize, totalItems) : undefined;

  return (
    <div className={cn("flex items-center justify-between pt-3 border-t border-line", className)}>
      {totalItems !== undefined && start !== undefined && end !== undefined ? (
        <span className="text-xs text-text-secondary">
          {start}–{end} de {totalItems}
        </span>
      ) : (
        <span className="text-xs text-text-secondary">Página {page} de {totalPages}</span>
      )}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
          className="p-1.5 rounded border border-line text-text-secondary hover:bg-sidebar-active hover:text-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          let p: number;
          if (totalPages <= 5) {
            p = i + 1;
          } else if (page <= 3) {
            p = i + 1;
          } else if (page >= totalPages - 2) {
            p = totalPages - 4 + i;
          } else {
            p = page - 2 + i;
          }
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                "w-7 h-7 rounded text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-primary",
                p === page
                  ? "bg-primary text-white border border-primary"
                  : "border border-line text-text-secondary hover:bg-sidebar-active hover:text-text"
              )}
            >
              {p}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Próxima página"
          className="p-1.5 rounded border border-line text-text-secondary hover:bg-sidebar-active hover:text-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

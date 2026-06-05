"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ROWS_OPTIONS = [50, 100, 500];

interface TablePaginationProps {
  page: number;
  totalPages: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function TablePagination({
  page,
  totalPages,
  limit,
  total,
  onPageChange,
  onLimitChange,
}: TablePaginationProps) {
  const [pageInput, setPageInput] = useState(String(page));

  // Keep pageInput in sync when page prop changes from outside
  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow empty or digits only
    if (val === "" || /^\d+$/.test(val)) {
      setPageInput(val);
    }
  };

  const commitPageInput = useCallback(() => {
    const parsed = parseInt(pageInput);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
      onPageChange(parsed);
      setPageInput(String(parsed));
    } else {
      // Reset to current page
      setPageInput(String(page));
    }
  }, [pageInput, page, totalPages, onPageChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      commitPageInput();
      (e.target as HTMLInputElement).blur();
    }
  };

  const handlePrev = () => {
    if (page > 1) {
      onPageChange(page - 1);
    }
  };

  const handleNext = () => {
    if (page < totalPages) {
      onPageChange(page + 1);
    }
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onLimitChange(parseInt(e.target.value));
  };

  return (
    <div className="border-t border-outline-variant p-4 flex flex-col sm:flex-row justify-between items-center gap-3 bg-surface-container-lowest">
      {/* Info text */}
      <span className="text-sm text-on-surface-variant font-medium order-2 sm:order-1">
        Showing {total > 0 ? ((page - 1) * limit + 1).toLocaleString() : 0} to{" "}
        {Math.min(page * limit, total).toLocaleString()} of {total.toLocaleString()} entries
      </span>

      {/* Controls */}
      <div className="flex items-center gap-3 order-1 sm:order-2">
        {/* Page navigation */}
        <div className="flex items-center gap-2">
          {/* Previous */}
          <button
            onClick={handlePrev}
            disabled={page <= 1}
            className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4 text-on-surface" />
          </button>

          {/* Page label + input */}
          <div className="flex items-center gap-1.5 text-sm text-on-surface-variant font-medium">
            <span>Page</span>
            <input
              type="text"
              inputMode="numeric"
              value={pageInput}
              onChange={handlePageInputChange}
              onBlur={commitPageInput}
              onFocus={(e) => e.target.select()}
              onKeyDown={handleKeyDown}
              className="w-12 h-10 text-center rounded-lg border border-outline-variant bg-on-surface text-surface-container-lowest text-sm font-bold focus:border-scanner-focus focus:ring-1 focus:ring-scanner-focus outline-none"
            />
            <span>of {totalPages || 1}</span>
          </div>

          {/* Next */}
          <button
            onClick={handleNext}
            disabled={page >= totalPages}
            className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4 text-on-surface" />
          </button>
        </div>

        {/* Rows per page selector */}
        <select
          value={limit}
          onChange={handleLimitChange}
          className="h-10 pl-3 pr-8 rounded-lg border border-outline-variant bg-on-surface text-surface-container-lowest text-sm font-bold cursor-pointer focus:border-scanner-focus focus:ring-1 focus:ring-scanner-focus outline-none appearance-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundPosition: "right 0.5rem center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "1.25em 1.25em",
          }}
        >
          {ROWS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt} rows
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

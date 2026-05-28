"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface POSearchProps {
  onSearch: (query: string) => void;
  className?: string;
}

export function POSearch({ onSearch, className }: POSearchProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      onSearch(value);
    },
    [onSearch]
  );

  const handleClear = useCallback(() => {
    setQuery("");
    onSearch("");
  }, [onSearch]);

  return (
    <div className={cn("relative", className)}>
      <Search
        className={cn(
          "absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200",
          isFocused ? "text-scanner-focus" : "text-on-surface-variant"
        )}
      />
      <Input
        id="po-search-input"
        type="text"
        placeholder="Cari nomor PO..."
        value={query}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn(
          "pl-10 pr-10 h-12 rounded-xl bg-surface-container-lowest border-outline-variant text-sm",
          "placeholder:text-on-surface-variant/60",
          "focus:border-scanner-focus/50 focus:ring-2 focus:ring-scanner-focus/20",
          "touch-target transition-all duration-200"
        )}
      />
      {query && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-full bg-surface-container-high hover:bg-surface-container-highest transition-colors"
        >
          <X className="h-3.5 w-3.5 text-on-surface-variant" />
        </button>
      )}
    </div>
  );
}

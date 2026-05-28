"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Keyboard, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ManualInputProps {
  onSubmit: (barcode: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function ManualInput({ onSubmit, isLoading, className }: ManualInputProps) {
  const [barcode, setBarcode] = useState("");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (barcode.trim()) {
        onSubmit(barcode.trim());
        setBarcode("");
      }
    },
    [barcode, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className={cn("flex gap-2", className)}>
      <div className="relative flex-1">
        <Keyboard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="manual-barcode-input"
          type="text"
          inputMode="numeric"
          placeholder="Ketik barcode manual..."
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          className="pl-10 h-12 rounded-xl bg-card border-border/50 text-sm touch-target"
          disabled={isLoading}
        />
      </div>
      <Button
        type="submit"
        disabled={!barcode.trim() || isLoading}
        className="h-12 px-4 rounded-xl touch-target bg-primary hover:bg-primary/90"
      >
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}

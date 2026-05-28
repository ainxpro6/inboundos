"use client";

import { cn, getProgressPercent, getFulfillmentStatus } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

interface ProgressBarProps {
  qtyOrder: number;
  qtyReceived: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ProgressBar({
  qtyOrder,
  qtyReceived,
  showLabel = true,
  size = "md",
  className,
}: ProgressBarProps) {
  const percent = getProgressPercent(qtyOrder, qtyReceived);
  const status = getFulfillmentStatus(qtyOrder, qtyReceived);

  const barColor = (() => {
    switch (status) {
      case "NOT_STARTED":
        return "bg-outline-variant";
      case "PARTIAL":
        return "bg-gradient-to-r from-warning-amber/80 to-warning-amber";
      case "FULFILLED":
        return "bg-gradient-to-r from-success-vibrant/80 to-success-vibrant";
      case "OVER":
        return "bg-gradient-to-r from-danger-signal/80 to-danger-signal";
    }
  })();

  const heightClass = size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2";

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-on-surface-variant font-medium">Progress</span>
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "font-semibold tabular-nums animate-count-up",
                status === "FULFILLED" && "text-success-vibrant",
                status === "OVER" && "text-danger-signal",
                status === "PARTIAL" && "text-warning-amber"
              )}
            >
              {qtyReceived}
            </span>
            <span className="text-on-surface-variant">/</span>
            <span className="text-on-surface-variant tabular-nums">
              {qtyOrder}
            </span>
            {status === "FULFILLED" && (
              <CheckCircle2 className="h-3.5 w-3.5 text-success-vibrant ml-0.5" />
            )}
          </div>
        </div>
      )}
      <div
        className={cn(
          "w-full rounded-full bg-surface-container-highest overflow-hidden",
          heightClass
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            barColor,
            status === "FULFILLED" && "animate-pulse-glow"
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

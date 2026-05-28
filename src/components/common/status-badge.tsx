"use client";

import { cn } from "@/lib/utils";
import { ItemFulfillmentStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: ItemFulfillmentStatus;
  className?: string;
}

const statusConfig: Record<
  ItemFulfillmentStatus,
  { label: string; classes: string }
> = {
  NOT_STARTED: {
    label: "Belum Mulai",
    classes:
      "bg-surface-container-high text-on-surface-variant border-outline-variant",
  },
  PARTIAL: {
    label: "Kurang",
    classes:
      "bg-status-bg-amber text-warning-amber border-warning-amber/30",
  },
  FULFILLED: {
    label: "Sesuai",
    classes:
      "bg-status-bg-green text-success-vibrant border-success-vibrant/30",
  },
  OVER: {
    label: "Berlebih",
    classes:
      "bg-status-bg-red text-danger-signal border-danger-signal/30",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.classes,
        className
      )}
    >
      {status === "FULFILLED" && (
        <svg
          className="w-3 h-3 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}
      {config.label}
    </span>
  );
}

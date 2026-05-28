"use client";

import { PurchaseOrderItem } from "@/lib/types";
import { ProgressBar } from "@/components/common/progress-bar";
import { StatusBadge } from "@/components/common/status-badge";
import { getFulfillmentStatus, cn } from "@/lib/utils";
import { ScanBarcode } from "lucide-react";
import { Button } from "@/components/ui/button";

interface POItemRowProps {
  item: PurchaseOrderItem;
  onScan: (item: PurchaseOrderItem) => void;
}

export function POItemRow({ item, onScan }: POItemRowProps) {
  const status = getFulfillmentStatus(item.qty_order, item.qty_received);

  return (
    <div
      className={cn(
        "rounded-xl border border-outline-variant bg-surface-container-lowest p-4 transition-all duration-200 hover:border-scanner-focus/20",
        status === "FULFILLED" && "border-success-vibrant/20 bg-status-bg-green/30"
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium leading-snug mb-1 line-clamp-2">
            {item.sku?.name || "Unknown SKU"}
          </h4>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-on-surface-variant font-mono">
              {item.sku?.sku_code}
            </span>
            <StatusBadge status={status} />
          </div>
        </div>

        <Button
          size="sm"
          variant={status === "FULFILLED" ? "outline" : "default"}
          className={cn(
            "shrink-0 touch-target gap-1.5 rounded-lg font-medium",
            status === "FULFILLED"
              ? "text-success-vibrant border-success-vibrant/30 hover:bg-status-bg-green"
              : "bg-industrial-blue hover:bg-industrial-blue/90"
          )}
          onClick={() => onScan(item)}
        >
          <ScanBarcode className="h-4 w-4" />
          <span className="text-xs">Scan</span>
        </Button>
      </div>

      <ProgressBar
        qtyOrder={item.qty_order}
        qtyReceived={item.qty_received}
        size="sm"
      />

      <div className="mt-2 text-[11px] text-on-surface-variant font-mono">
        Barcode: {item.sku?.barcode || "—"}
      </div>
    </div>
  );
}

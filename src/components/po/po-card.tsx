"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/common/progress-bar";
import { PurchaseOrderWithItems, POStatus } from "@/lib/types";
import { formatDate, cn } from "@/lib/utils";
import { ChevronRight, Truck, CalendarDays } from "lucide-react";

interface POCardProps {
  po: PurchaseOrderWithItems;
}

function getStatusConfig(status: POStatus) {
  switch (status) {
    case "PENDING":
      return {
        label: "Pending",
        classes: "bg-status-bg-amber text-warning-amber border-warning-amber/30",
      };
    case "PARTIAL":
      return {
        label: "Partial",
        classes: "bg-secondary-container text-on-secondary-container border-scanner-focus/30",
      };
    case "COMPLETED":
      return {
        label: "Completed",
        classes: "bg-status-bg-green text-success-vibrant border-success-vibrant/30",
      };
  }
}

export function POCard({ po }: POCardProps) {
  const statusConfig = getStatusConfig(po.status);
  const totalOrdered = po.items.reduce((sum, i) => sum + i.qty_order, 0);
  const totalReceived = po.items.reduce((sum, i) => sum + i.qty_received, 0);
  const itemCount = po.items.length;

  return (
    <Link href={`/po/${po.id}`}>
      <Card className="group relative overflow-hidden border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low hover:border-scanner-focus/30 transition-all duration-300 cursor-pointer">
        {/* Subtle gradient accent line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-scanner-focus/60 via-scanner-focus to-scanner-focus/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm truncate text-industrial-blue">
                  {po.po_number}
                </h3>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-1.5 py-0 h-5 font-medium",
                    statusConfig.classes
                  )}
                >
                  {statusConfig.label}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                <Truck className="h-3 w-3 shrink-0" />
                <span className="truncate">{po.supplier_name}</span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-outline-variant group-hover:text-scanner-focus group-hover:translate-x-0.5 transition-all duration-200 shrink-0 mt-1" />
          </div>

          <ProgressBar
            qtyOrder={totalOrdered}
            qtyReceived={totalReceived}
            size="sm"
          />

          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-outline-variant/50">
            <div className="flex items-center gap-1 text-[11px] text-on-surface-variant">
              <CalendarDays className="h-3 w-3" />
              {formatDate(po.created_at)}
            </div>
            <span className="text-[11px] text-on-surface-variant">
              {itemCount} item{itemCount !== 1 ? "s" : ""}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

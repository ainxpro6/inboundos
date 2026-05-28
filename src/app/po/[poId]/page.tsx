"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useInbound } from "@/context/inbound-context";
import { Header } from "@/components/layout/header";
import { POItemRow } from "@/components/po/po-item-row";
import { ProgressBar } from "@/components/common/progress-bar";
import { StatusBadge } from "@/components/common/status-badge";
import { InboundForm } from "@/components/inbound/inbound-form";
import { PurchaseOrderItem, MasterSku } from "@/lib/types";
import {
  getFulfillmentStatus,
  formatDate,
  cn,
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Truck,
  CalendarDays,
  ScanBarcode,
  ArrowLeft,
  Package,
} from "lucide-react";
import { toast } from "sonner";

export default function PODetailPage({
  params,
}: {
  params: Promise<{ poId: string }>;
}) {
  const { poId } = use(params);
  const router = useRouter();
  const { currentPO, isLoading, loadPODetail, submitInbound } = useInbound();

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PurchaseOrderItem | null>(null);
  const [selectedSku, setSelectedSku] = useState<MasterSku | null>(null);

  useEffect(() => {
    loadPODetail(poId);
  }, [poId, loadPODetail]);

  const handleScanItem = useCallback(
    (item: PurchaseOrderItem) => {
      router.push(`/scan/${currentPO?.id}?sku=${item.sku_id}`);
    },
    [router, currentPO]
  );

  const handleOpenForm = useCallback(
    (item: PurchaseOrderItem) => {
      setSelectedItem(item);
      setSelectedSku(item.sku || null);
      setIsFormOpen(true);
    },
    []
  );

  const handleSubmit = useCallback(
    async (data: Parameters<typeof submitInbound>[0]) => {
      const result = await submitInbound(data);
      if (result.success) {
        toast.success("Data inbound berhasil disimpan!");
      } else {
        toast.error(result.message);
      }
      return result;
    },
    [submitInbound]
  );

  // Aggregate stats
  const totalOrdered = currentPO?.items.reduce((s, i) => s + i.qty_order, 0) || 0;
  const totalReceived = currentPO?.items.reduce((s, i) => s + i.qty_received, 0) || 0;
  const overallStatus = getFulfillmentStatus(totalOrdered, totalReceived);

  if (isLoading || !currentPO) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 px-4 pt-6">
          <div className="space-y-4">
            <div className="h-8 w-48 rounded-lg animate-shimmer" />
            <div className="h-32 rounded-xl animate-shimmer" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-xl animate-shimmer" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 px-4 pb-24">
        {/* Back button */}
        <div className="pt-4 pb-2">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors touch-target"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali</span>
          </button>
        </div>

        {/* PO Header Card */}
        <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 mb-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-lg font-bold text-industrial-blue">{currentPO.po_number}</h1>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-1.5 h-5",
                    currentPO.status === "COMPLETED"
                      ? "bg-status-bg-green text-success-vibrant border-success-vibrant/30"
                      : currentPO.status === "PARTIAL"
                      ? "bg-secondary-container text-on-secondary-container border-scanner-focus/30"
                      : "bg-status-bg-amber text-warning-amber border-warning-amber/30"
                  )}
                >
                  {currentPO.status}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <Truck className="h-3 w-3" />
                  {currentPO.supplier_name}
                </span>
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {formatDate(currentPO.created_at)}
                </span>
              </div>
            </div>
            <StatusBadge status={overallStatus} />
          </div>

          <ProgressBar
            qtyOrder={totalOrdered}
            qtyReceived={totalReceived}
            size="md"
          />
        </div>

        {/* Item List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">
              Daftar Item ({currentPO.items.length})
            </h2>
          </div>

          {currentPO.items.map((item) => (
            <POItemRow key={item.id} item={item} onScan={handleScanItem} />
          ))}
        </div>
      </main>

      {/* Floating Scan FAB */}
      <div className="fixed bottom-6 right-4 z-40 animate-fab-entrance">
        <Button
          onClick={() => router.push(`/scan/${currentPO.id}`)}
          className="h-14 w-14 rounded-2xl shadow-lg shadow-primary/25 bg-primary hover:bg-primary/90 touch-target"
          size="icon"
        >
          <ScanBarcode className="h-6 w-6" />
        </Button>
      </div>

      {/* Inbound Form Sheet */}
      <InboundForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedItem(null);
          setSelectedSku(null);
        }}
        poItem={selectedItem}
        sku={selectedSku}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

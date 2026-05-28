"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useInbound } from "@/context/inbound-context";
import { Header } from "@/components/layout/header";
import { BarcodeScanner } from "@/components/scanner/barcode-scanner";
import { ManualInput } from "@/components/scanner/manual-input";
import { InboundForm } from "@/components/inbound/inbound-form";
import { PurchaseOrderItem, MasterSku, BarcodeValidationResult } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  ScanBarcode,
  Keyboard,
  CheckCircle2,
  XCircle,
  History,
} from "lucide-react";
import { toast } from "sonner";

interface ScanHistoryEntry {
  barcode: string;
  success: boolean;
  message: string;
  skuName?: string;
  timestamp: Date;
}

export default function ScanPage({
  params,
}: {
  params: Promise<{ poId: string }>;
}) {
  const { poId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentPO, loadPODetail, validateScan, submitInbound } = useInbound();

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [inputMode, setInputMode] = useState<"camera" | "manual">("manual");
  const [isValidating, setIsValidating] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanHistoryEntry[]>([]);

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PurchaseOrderItem | null>(null);
  const [selectedSku, setSelectedSku] = useState<MasterSku | null>(null);

  useEffect(() => {
    if (!currentPO || currentPO.id !== poId) {
      loadPODetail(poId);
    }
  }, [poId, currentPO, loadPODetail]);

  const handleBarcodeScan = useCallback(
    async (barcode: string) => {
      if (isValidating) return;
      setIsValidating(true);

      try {
        const result: BarcodeValidationResult = await validateScan(barcode, poId);

        const historyEntry: ScanHistoryEntry = {
          barcode,
          success: result.success,
          message: result.message,
          skuName: result.sku?.name,
          timestamp: new Date(),
        };

        setScanHistory((prev) => [historyEntry, ...prev.slice(0, 9)]);

        if (result.success && result.po_item && result.sku) {
          toast.success("SKU valid!", {
            description: result.sku.name,
          });

          // Stop camera if active
          if (isCameraActive) {
            setIsCameraActive(false);
          }

          // Open inbound form
          setSelectedItem(result.po_item);
          setSelectedSku(result.sku);
          setIsFormOpen(true);
        } else {
          toast.error("SKU Tidak Terdaftar", {
            description: result.message,
          });
        }
      } catch {
        toast.error("Gagal memvalidasi barcode");
      } finally {
        setIsValidating(false);
      }
    },
    [poId, isValidating, validateScan, isCameraActive]
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

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 px-4 pb-8">
        {/* Back & PO info */}
        <div className="pt-4 pb-4">
          <button
            onClick={() => router.push(`/po/${poId}`)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors touch-target mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Detail PO</span>
          </button>
          {currentPO && (
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">Scan Barcode</h1>
              <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md font-mono">
                {currentPO.po_number}
              </span>
            </div>
          )}
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-5">
          <Button
            variant={inputMode === "camera" ? "default" : "outline"}
            size="sm"
            className="flex-1 h-10 rounded-xl touch-target gap-2 text-xs font-medium"
            onClick={() => {
              setInputMode("camera");
              if (!isCameraActive) setIsCameraActive(true);
            }}
          >
            <ScanBarcode className="h-4 w-4" />
            Kamera
          </Button>
          <Button
            variant={inputMode === "manual" ? "default" : "outline"}
            size="sm"
            className="flex-1 h-10 rounded-xl touch-target gap-2 text-xs font-medium"
            onClick={() => {
              setInputMode("manual");
              setIsCameraActive(false);
            }}
          >
            <Keyboard className="h-4 w-4" />
            Manual
          </Button>
        </div>

        {/* Scanner / Manual Input */}
        {inputMode === "camera" ? (
          <BarcodeScanner
            onScan={handleBarcodeScan}
            isActive={isCameraActive}
            onToggle={() => setIsCameraActive(!isCameraActive)}
            className="mb-6"
          />
        ) : (
          <div className="mb-6">
            <ManualInput
              onSubmit={handleBarcodeScan}
              isLoading={isValidating}
            />
            <p className="text-[11px] text-muted-foreground mt-2 px-1">
              Masukkan nomor barcode secara manual. Contoh:{" "}
              <button
                type="button"
                className="text-primary hover:underline font-mono"
                onClick={() => handleBarcodeScan("8991234560011")}
              >
                8991234560011
              </button>
            </p>
          </div>
        )}

        <Separator className="bg-border/30 mb-5" />

        {/* Scan History */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <History className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Riwayat Scan
            </h3>
          </div>

          {scanHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-xl bg-muted/30 flex items-center justify-center mb-3">
                <ScanBarcode className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <p className="text-xs text-muted-foreground/60">
                Belum ada scan. Mulai scan barcode produk.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {scanHistory.map((entry, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "rounded-xl border p-3 transition-all",
                    entry.success
                      ? "border-success/20 bg-success/5"
                      : "border-destructive/20 bg-destructive/5"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    {entry.success ? (
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium line-clamp-1">
                        {entry.skuName || entry.message}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {entry.barcode}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {entry.timestamp.toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

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

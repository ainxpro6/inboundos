"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Camera, CameraOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  isActive: boolean;
  onToggle: () => void;
  className?: string;
}

export function BarcodeScanner({
  onScan,
  isActive,
  onToggle,
  className,
}: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const startScanner = useCallback(async () => {
    if (!scannerRef.current) return;

    setIsInitializing(true);
    setError(null);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scannerId = "barcode-scanner-viewport";

      // Make sure DOM element exists
      if (!document.getElementById(scannerId)) {
        setError("Scanner element tidak ditemukan");
        setIsInitializing(false);
        return;
      }

      const html5QrCode = new Html5Qrcode(scannerId);
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 280, height: 120 },
          aspectRatio: 1.5,
        },
        (decodedText: string) => {
          // Haptic feedback if available
          if (navigator.vibrate) {
            navigator.vibrate(100);
          }
          onScan(decodedText);
        },
        () => {
          // Ignore scan failures (expected while scanning)
        }
      );

      setIsInitializing(false);
    } catch (err) {
      console.error("Scanner error:", err);
      setError(
        "Gagal mengakses kamera. Pastikan izin kamera telah diberikan."
      );
      setIsInitializing(false);
    }
  }, [onScan]);

  const stopScanner = useCallback(async () => {
    try {
      const scanner = html5QrCodeRef.current as {
        isScanning?: boolean;
        stop: () => Promise<void>;
        clear: () => void;
      } | null;
      if (scanner && scanner.isScanning) {
        await scanner.stop();
        scanner.clear();
      }
    } catch {
      // Ignore stop errors
    }
    html5QrCodeRef.current = null;
  }, []);

  useEffect(() => {
    if (isActive) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isActive, startScanner, stopScanner]);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* Scanner viewport */}
      <div className="relative w-full max-w-sm aspect-[3/2] rounded-2xl overflow-hidden bg-black/90 border border-outline-variant">
        {isActive ? (
          <>
            <div
              id="barcode-scanner-viewport"
              ref={scannerRef}
              className="w-full h-full"
            />
            {/* Scan line overlay */}
            {!error && !isInitializing && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[280px] h-[120px] relative">
                  {/* Corner markers */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-scanner-focus rounded-tl-sm" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-scanner-focus rounded-tr-sm" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-scanner-focus rounded-bl-sm" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-scanner-focus rounded-br-sm" />
                  {/* Scanning line */}
                  <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line" />
                </div>
              </div>
            )}
            {isInitializing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-6 w-6 text-scanner-focus animate-spin" />
                  <p className="text-xs text-white/70">Memuat kamera...</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-muted/20 flex items-center justify-center">
                <CameraOff className="h-7 w-7 text-muted-foreground/50" />
              </div>
              <p className="text-xs text-muted-foreground/70">
                Kamera tidak aktif
              </p>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm px-6">
            <div className="text-center">
              <CameraOff className="h-8 w-8 text-danger-signal mx-auto mb-2" />
              <p className="text-xs text-white/80">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Toggle button */}
      <Button
        onClick={onToggle}
        variant={isActive ? "destructive" : "default"}
        className="mt-4 h-12 px-6 rounded-xl touch-target gap-2 font-medium"
      >
        {isActive ? (
          <>
            <CameraOff className="h-4 w-4" />
            Stop Kamera
          </>
        ) : (
          <>
            <Camera className="h-4 w-4" />
            Mulai Kamera
          </>
        )}
      </Button>
    </div>
  );
}

"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import {
  PurchaseOrderWithItems,
  InboundFormData,
  BarcodeValidationResult,
} from "@/lib/types";

interface InboundContextType {
  // Data
  purchaseOrders: PurchaseOrderWithItems[];
  currentPO: PurchaseOrderWithItems | null;
  isLoading: boolean;

  // Actions
  loadPurchaseOrders: () => Promise<void>;
  searchPurchaseOrders: (query: string) => Promise<void>;
  loadPODetail: (poId: string) => Promise<void>;
  validateScan: (barcode: string, poId: string) => Promise<BarcodeValidationResult>;
  submitInbound: (data: InboundFormData) => Promise<{ success: boolean; message: string }>;
}

const InboundContext = createContext<InboundContextType | undefined>(undefined);

export function InboundProvider({ children }: { children: ReactNode }) {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderWithItems[]>([]);
  const [currentPO, setCurrentPO] = useState<PurchaseOrderWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadPurchaseOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/po");
      if (!res.ok) throw new Error("Failed to fetch POs");
      const data = await res.json();
      setPurchaseOrders(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchPurchaseOrders = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      const url = query.trim()
        ? `/api/po?search=${encodeURIComponent(query)}`
        : "/api/po";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to search POs");
      const data = await res.json();
      setPurchaseOrders(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadPODetail = useCallback(async (poId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/po/${poId}`);
      if (!res.ok) throw new Error("Failed to fetch PO detail");
      const data = await res.json();
      setCurrentPO(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const validateScan = useCallback(
    async (barcode: string, poId: string): Promise<BarcodeValidationResult> => {
      const res = await fetch(`/api/po/${poId}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode }),
      });
      if (!res.ok) throw new Error("Failed to validate barcode");
      return res.json();
    },
    []
  );

  const submitInbound = useCallback(
    async (data: InboundFormData): Promise<{ success: boolean; message: string }> => {
      const res = await fetch("/api/inbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to submit inbound");
      const result = await res.json();

      if (result.success && currentPO) {
        // Refresh current PO detail
        const detailRes = await fetch(`/api/po/${currentPO.id}`);
        if (detailRes.ok) {
          const updated = await detailRes.json();
          setCurrentPO(updated);
        }

        // Also refresh the PO list
        const listRes = await fetch("/api/po");
        if (listRes.ok) {
          const pos = await listRes.json();
          setPurchaseOrders(pos);
        }
      }

      return { success: result.success, message: result.message };
    },
    [currentPO]
  );

  return (
    <InboundContext.Provider
      value={{
        purchaseOrders,
        currentPO,
        isLoading,
        loadPurchaseOrders,
        searchPurchaseOrders,
        loadPODetail,
        validateScan,
        submitInbound,
      }}
    >
      {children}
    </InboundContext.Provider>
  );
}

export function useInbound() {
  const context = useContext(InboundContext);
  if (!context) {
    throw new Error("useInbound must be used within an InboundProvider");
  }
  return context;
}

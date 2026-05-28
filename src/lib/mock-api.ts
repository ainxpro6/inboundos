// ============================================================================
// Mock API Service — Simulates backend responses with realistic delays
// ============================================================================

import {
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderWithItems,
  InboundLog,
  InboundFormData,
  BarcodeValidationResult,
} from "./types";
import {
  MOCK_POS,
  MOCK_PO_ITEMS,
  MOCK_SKUS,
  MOCK_INBOUND_LOGS,
} from "./mock-data";
import { delay, generateId } from "./utils";

// In-memory mutable copies for state simulation
let purchaseOrders = [...MOCK_POS];
let poItems = MOCK_PO_ITEMS.map((item) => ({ ...item }));
let inboundLogs = [...MOCK_INBOUND_LOGS];

/**
 * Reset all data to initial state (useful for testing)
 */
export function resetMockData() {
  purchaseOrders = [...MOCK_POS];
  poItems = MOCK_PO_ITEMS.map((item) => ({ ...item }));
  inboundLogs = [...MOCK_INBOUND_LOGS];
}

/**
 * Get all active POs (not COMPLETED)
 */
export async function getActivePurchaseOrders(): Promise<PurchaseOrderWithItems[]> {
  await delay(300);
  return purchaseOrders.map((po) => ({
    ...po,
    items: poItems
      .filter((item) => item.po_id === po.id)
      .map((item) => ({ ...item })),
  }));
}

/**
 * Search PO by number (partial match)
 */
export async function searchPO(query: string): Promise<PurchaseOrderWithItems[]> {
  await delay(200);
  const normalizedQuery = query.toUpperCase().trim();
  return purchaseOrders
    .filter((po) => po.po_number.toUpperCase().includes(normalizedQuery))
    .map((po) => ({
      ...po,
      items: poItems
        .filter((item) => item.po_id === po.id)
        .map((item) => ({ ...item })),
    }));
}

/**
 * Get full PO detail with all items
 */
export async function getPODetail(
  poId: string
): Promise<PurchaseOrderWithItems | null> {
  await delay(250);
  const po = purchaseOrders.find((p) => p.id === poId);
  if (!po) return null;
  return {
    ...po,
    items: poItems
      .filter((item) => item.po_id === po.id)
      .map((item) => ({ ...item })),
  };
}

/**
 * Validate a barcode against a specific PO
 */
export async function validateBarcode(
  barcode: string,
  poId: string
): Promise<BarcodeValidationResult> {
  await delay(350);

  // Find SKU by barcode
  const sku = MOCK_SKUS.find((s) => s.barcode === barcode);
  if (!sku) {
    return {
      success: false,
      message: "Barcode tidak terdaftar di Master SKU",
    };
  }

  // Check if this SKU is part of the PO
  const poItem = poItems.find(
    (item) => item.po_id === poId && item.sku_id === sku.id
  );
  if (!poItem) {
    return {
      success: false,
      message: "SKU tidak terdaftar dalam PO ini",
    };
  }

  return {
    success: true,
    message: "SKU valid dan terdaftar dalam PO",
    sku,
    po_item: { ...poItem },
  };
}

/**
 * Save inbound log and update PO item quantities (simulates DB transaction)
 */
export async function saveInboundLog(
  data: InboundFormData
): Promise<{
  success: boolean;
  message: string;
  log?: InboundLog;
  updatedItem?: PurchaseOrderItem;
}> {
  await delay(400);

  // Find PO item
  const itemIndex = poItems.findIndex((i) => i.id === data.po_item_id);
  if (itemIndex === -1) {
    return {
      success: false,
      message: "PO Item tidak ditemukan. Transaksi dibatalkan.",
    };
  }

  // Create the inbound log
  const newLog: InboundLog = {
    id: generateId(),
    po_item_id: data.po_item_id,
    expiry_date: data.expiry_date,
    qty_good: data.qty_good,
    qty_reject: data.qty_reject,
    checker_name: "Mock Checker",
    scanned_at: new Date().toISOString(),
  };

  // "Atomic" update — add log AND update qty_received
  const totalQtyInput = data.qty_good + data.qty_reject;
  poItems[itemIndex] = {
    ...poItems[itemIndex],
    qty_received: poItems[itemIndex].qty_received + totalQtyInput,
  };

  inboundLogs.push(newLog);

  // Update PO status
  const poId = poItems[itemIndex].po_id;
  updatePOStatus(poId);

  return {
    success: true,
    message: "Data berhasil disimpan!",
    log: newLog,
    updatedItem: { ...poItems[itemIndex] },
  };
}

/**
 * Get inbound logs for a specific PO item
 */
export async function getInboundLogs(poItemId: string): Promise<InboundLog[]> {
  await delay(200);
  return inboundLogs.filter((log) => log.po_item_id === poItemId);
}

/**
 * Auto-update PO status based on item fulfillment
 */
function updatePOStatus(poId: string) {
  const items = poItems.filter((i) => i.po_id === poId);
  const allFulfilled = items.every((i) => i.qty_received >= i.qty_order);
  const anyStarted = items.some((i) => i.qty_received > 0);

  const poIndex = purchaseOrders.findIndex((p) => p.id === poId);
  if (poIndex === -1) return;

  if (allFulfilled) {
    purchaseOrders[poIndex] = { ...purchaseOrders[poIndex], status: "COMPLETED" };
  } else if (anyStarted) {
    purchaseOrders[poIndex] = { ...purchaseOrders[poIndex], status: "PARTIAL" };
  }
}

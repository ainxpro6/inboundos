// ============================================================================
// Inbound Warehouse Scanner — TypeScript Type Definitions
// Matches database schema from PRD (without category on MasterSku)
// ============================================================================

export interface MasterSku {
  id: string;
  sku_code: string;
  name: string;
  barcode: string;
}

export type POStatus = "PENDING" | "PARTIAL" | "COMPLETED";

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_name: string;
  status: POStatus;
  created_at: string; // ISO timestamp
}

export interface PurchaseOrderItem {
  id: string;
  po_id: string;
  sku_id: string;
  qty_order: number;
  qty_received: number;
  // Joined SKU data for display
  sku?: MasterSku;
}

export interface InboundLog {
  id: string;
  po_item_id: string;
  expiry_date: string; // ISO date string (YYYY-MM-DD)
  qty_good: number;
  qty_reject: number;
  checker_name: string;
  scanned_at: string; // ISO timestamp
}

// ---------- UI-specific types ----------

export type ItemFulfillmentStatus =
  | "NOT_STARTED"    // Belum Mulai
  | "PARTIAL"        // Kurang
  | "FULFILLED"      // Sesuai
  | "OVER"           // Berlebih

export interface PurchaseOrderWithItems extends PurchaseOrder {
  items: PurchaseOrderItem[];
}

export interface InboundFormData {
  po_item_id: string;
  expiry_date: string;
  qty_good: number;
  qty_reject: number;
}

export interface BarcodeValidationResult {
  success: boolean;
  message: string;
  sku?: MasterSku;
  po_item?: PurchaseOrderItem;
}

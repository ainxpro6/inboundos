// ============================================================================
// Mock Data — Realistic FMCG warehouse data for development
// ============================================================================

import {
  MasterSku,
  PurchaseOrder,
  PurchaseOrderItem,
  InboundLog,
} from "./types";

// ---------- Master SKUs (Baby/FMCG Products) ----------
export const MOCK_SKUS: MasterSku[] = [
  {
    id: "sku-001",
    sku_code: "SKU-MILK-001",
    name: "Susu Bayi Formula S-26 Gold 400g",
    barcode: "8991234560011",
  },
  {
    id: "sku-002",
    sku_code: "SKU-MILK-002",
    name: "Susu Bayi Bebelac 3 Vanila 800g",
    barcode: "8991234560028",
  },
  {
    id: "sku-003",
    sku_code: "SKU-DIAPER-001",
    name: "Popok Bayi MamyPoko Pants M 34pcs",
    barcode: "8991234560035",
  },
  {
    id: "sku-004",
    sku_code: "SKU-WIPES-001",
    name: "Tisu Basah Cussons Baby 50 Lembar",
    barcode: "8991234560042",
  },
  {
    id: "sku-005",
    sku_code: "SKU-CEREAL-001",
    name: "Bubur Bayi Cerelac Beras Merah 120g",
    barcode: "8991234560059",
  },
];

// ---------- Purchase Orders ----------
export const MOCK_POS: PurchaseOrder[] = [
  {
    id: "po-001",
    po_number: "PO-2025-0042",
    supplier_name: "PT. Nutricia Indonesia",
    status: "PENDING",
    created_at: "2025-05-20T08:00:00Z",
  },
  {
    id: "po-002",
    po_number: "PO-2025-0043",
    supplier_name: "PT. Unicharm Indonesia",
    status: "PARTIAL",
    created_at: "2025-05-21T09:30:00Z",
  },
  {
    id: "po-003",
    po_number: "PO-2025-0038",
    supplier_name: "PT. PZ Cussons Indonesia",
    status: "COMPLETED",
    created_at: "2025-05-15T07:00:00Z",
  },
];

// ---------- Purchase Order Items ----------
export const MOCK_PO_ITEMS: PurchaseOrderItem[] = [
  // PO-001 items (PENDING — nothing received yet)
  {
    id: "poi-001",
    po_id: "po-001",
    sku_id: "sku-001",
    qty_order: 100,
    qty_received: 0,
    sku: MOCK_SKUS[0],
  },
  {
    id: "poi-002",
    po_id: "po-001",
    sku_id: "sku-002",
    qty_order: 80,
    qty_received: 0,
    sku: MOCK_SKUS[1],
  },
  {
    id: "poi-003",
    po_id: "po-001",
    sku_id: "sku-005",
    qty_order: 60,
    qty_received: 0,
    sku: MOCK_SKUS[4],
  },

  // PO-002 items (PARTIAL — some received)
  {
    id: "poi-004",
    po_id: "po-002",
    sku_id: "sku-003",
    qty_order: 200,
    qty_received: 120,
    sku: MOCK_SKUS[2],
  },
  {
    id: "poi-005",
    po_id: "po-002",
    sku_id: "sku-004",
    qty_order: 150,
    qty_received: 0,
    sku: MOCK_SKUS[3],
  },
  {
    id: "poi-006",
    po_id: "po-002",
    sku_id: "sku-001",
    qty_order: 50,
    qty_received: 50,
    sku: MOCK_SKUS[0],
  },

  // PO-003 items (COMPLETED — all received)
  {
    id: "poi-007",
    po_id: "po-003",
    sku_id: "sku-004",
    qty_order: 100,
    qty_received: 100,
    sku: MOCK_SKUS[3],
  },
  {
    id: "poi-008",
    po_id: "po-003",
    sku_id: "sku-005",
    qty_order: 75,
    qty_received: 75,
    sku: MOCK_SKUS[4],
  },
];

// ---------- Inbound Logs (pre-populated history) ----------
export const MOCK_INBOUND_LOGS: InboundLog[] = [
  {
    id: "log-001",
    po_item_id: "poi-004",
    expiry_date: "2026-03-15",
    qty_good: 60,
    qty_reject: 0,
    checker_name: "Ahmad Fauzi",
    scanned_at: "2025-05-22T10:15:00Z",
  },
  {
    id: "log-002",
    po_item_id: "poi-004",
    expiry_date: "2026-06-20",
    qty_good: 58,
    qty_reject: 2,
    checker_name: "Ahmad Fauzi",
    scanned_at: "2025-05-22T11:30:00Z",
  },
  {
    id: "log-003",
    po_item_id: "poi-006",
    expiry_date: "2026-12-01",
    qty_good: 48,
    qty_reject: 2,
    checker_name: "Budi Santoso",
    scanned_at: "2025-05-22T14:00:00Z",
  },
  {
    id: "log-004",
    po_item_id: "poi-007",
    expiry_date: "2026-08-10",
    qty_good: 100,
    qty_reject: 0,
    checker_name: "Siti Rahayu",
    scanned_at: "2025-05-18T09:00:00Z",
  },
  {
    id: "log-005",
    po_item_id: "poi-008",
    expiry_date: "2026-07-22",
    qty_good: 73,
    qty_reject: 2,
    checker_name: "Siti Rahayu",
    scanned_at: "2025-05-18T10:30:00Z",
  },
];

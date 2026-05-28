import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { masterSku, purchaseOrder, purchaseOrderItem, inboundLog } from "./schema";

async function seed() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client);

  console.log("🌱 Seeding database...");

  // 1. Seed Master SKUs
  console.log("  → Inserting master SKUs...");
  await db.insert(masterSku).values([
    {
      id: "sku-001",
      skuCode: "SKU-MILK-001",
      name: "Susu Bayi Formula S-26 Gold 400g",
      barcode: "8991234560011",
    },
    {
      id: "sku-002",
      skuCode: "SKU-MILK-002",
      name: "Susu Bayi Bebelac 3 Vanila 800g",
      barcode: "8991234560028",
    },
    {
      id: "sku-003",
      skuCode: "SKU-DIAPER-001",
      name: "Popok Bayi MamyPoko Pants M 34pcs",
      barcode: "8991234560035",
    },
    {
      id: "sku-004",
      skuCode: "SKU-WIPES-001",
      name: "Tisu Basah Cussons Baby 50 Lembar",
      barcode: "8991234560042",
    },
    {
      id: "sku-005",
      skuCode: "SKU-CEREAL-001",
      name: "Bubur Bayi Cerelac Beras Merah 120g",
      barcode: "8991234560059",
    },
  ]).onConflictDoNothing();

  // 2. Seed Purchase Orders
  console.log("  → Inserting purchase orders...");
  await db.insert(purchaseOrder).values([
    {
      id: "po-001",
      poNumber: "PO-2025-0042",
      supplierName: "PT. Nutricia Indonesia",
      status: "PENDING",
      createdAt: new Date("2025-05-20T08:00:00Z"),
    },
    {
      id: "po-002",
      poNumber: "PO-2025-0043",
      supplierName: "PT. Unicharm Indonesia",
      status: "PARTIAL",
      createdAt: new Date("2025-05-21T09:30:00Z"),
    },
    {
      id: "po-003",
      poNumber: "PO-2025-0038",
      supplierName: "PT. PZ Cussons Indonesia",
      status: "COMPLETED",
      createdAt: new Date("2025-05-15T07:00:00Z"),
    },
  ]).onConflictDoNothing();

  // 3. Seed PO Items
  console.log("  → Inserting PO items...");
  await db.insert(purchaseOrderItem).values([
    // PO-001 items (PENDING)
    { id: "poi-001", poId: "po-001", skuId: "sku-001", qtyOrder: 100, qtyReceived: 0 },
    { id: "poi-002", poId: "po-001", skuId: "sku-002", qtyOrder: 80, qtyReceived: 0 },
    { id: "poi-003", poId: "po-001", skuId: "sku-005", qtyOrder: 60, qtyReceived: 0 },
    // PO-002 items (PARTIAL)
    { id: "poi-004", poId: "po-002", skuId: "sku-003", qtyOrder: 200, qtyReceived: 120 },
    { id: "poi-005", poId: "po-002", skuId: "sku-004", qtyOrder: 150, qtyReceived: 0 },
    { id: "poi-006", poId: "po-002", skuId: "sku-001", qtyOrder: 50, qtyReceived: 50 },
    // PO-003 items (COMPLETED)
    { id: "poi-007", poId: "po-003", skuId: "sku-004", qtyOrder: 100, qtyReceived: 100 },
    { id: "poi-008", poId: "po-003", skuId: "sku-005", qtyOrder: 75, qtyReceived: 75 },
  ]).onConflictDoNothing();

  // 4. Seed Inbound Logs
  console.log("  → Inserting inbound logs...");
  await db.insert(inboundLog).values([
    {
      id: "log-001",
      poItemId: "poi-004",
      expiryDate: "2026-03-15",
      qtyGood: 60,
      qtyReject: 0,
      checkerName: "Ahmad Fauzi",
      scannedAt: new Date("2025-05-22T10:15:00Z"),
    },
    {
      id: "log-002",
      poItemId: "poi-004",
      expiryDate: "2026-06-20",
      qtyGood: 58,
      qtyReject: 2,
      checkerName: "Ahmad Fauzi",
      scannedAt: new Date("2025-05-22T11:30:00Z"),
    },
    {
      id: "log-003",
      poItemId: "poi-006",
      expiryDate: "2026-12-01",
      qtyGood: 48,
      qtyReject: 2,
      checkerName: "Budi Santoso",
      scannedAt: new Date("2025-05-22T14:00:00Z"),
    },
    {
      id: "log-004",
      poItemId: "poi-007",
      expiryDate: "2026-08-10",
      qtyGood: 100,
      qtyReject: 0,
      checkerName: "Siti Rahayu",
      scannedAt: new Date("2025-05-18T09:00:00Z"),
    },
    {
      id: "log-005",
      poItemId: "poi-008",
      expiryDate: "2026-07-22",
      qtyGood: 73,
      qtyReject: 2,
      checkerName: "Siti Rahayu",
      scannedAt: new Date("2025-05-18T10:30:00Z"),
    },
  ]).onConflictDoNothing();

  console.log("✅ Seed completed successfully!");
  await client.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});

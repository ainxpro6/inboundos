import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import path from "path";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { masterSku } from "./schema";

function parseCSV(filePath: string) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter((line) => line.trim() !== "");

  // Skip header
  const dataLines = lines.slice(1);

  const rows: { sku: string; name: string; barcode: string }[] = [];
  for (const line of dataLines) {
    // Split by comma — handle simple CSV (no quoted fields with commas)
    const parts = line.split(",");
    if (parts.length >= 3) {
      const sku = parts[0].trim();
      const name = parts.slice(1, -1).join(",").trim(); // name could contain commas
      const barcode = parts[parts.length - 1].trim();
      if (sku && barcode) {
        rows.push({ sku, name: name || "-", barcode });
      }
    }
  }

  return rows;
}

async function migrateSkus() {
  const client = postgres(process.env.DATABASE_URL!, { prepare: false });
  const db = drizzle(client);

  const csvPath = path.resolve(__dirname, "../../SKU.csv");
  console.log(`📂 Reading CSV from: ${csvPath}`);

  const allRows = parseCSV(csvPath);
  console.log(`📊 Total rows in CSV: ${allRows.length}`);

  // Deduplicate by SKU code (keep first occurrence)
  const seenSkus = new Set<string>();
  const seenBarcodes = new Set<string>();
  const uniqueRows: typeof allRows = [];
  let dupSkuCount = 0;
  let dupBarcodeCount = 0;

  for (const row of allRows) {
    if (seenSkus.has(row.sku)) {
      dupSkuCount++;
      continue;
    }
    if (seenBarcodes.has(row.barcode)) {
      dupBarcodeCount++;
      continue;
    }
    seenSkus.add(row.sku);
    seenBarcodes.add(row.barcode);
    uniqueRows.push(row);
  }

  console.log(`⚠️  Duplicate SKU codes skipped: ${dupSkuCount}`);
  console.log(`⚠️  Duplicate barcodes skipped: ${dupBarcodeCount}`);
  console.log(`✅ Unique rows to insert: ${uniqueRows.length}`);

  // Clear existing master_sku data
  console.log("\n🗑️  Clearing existing master_sku data...");
  await db.delete(masterSku);

  // Insert in batches of 500
  const BATCH_SIZE = 500;
  const totalBatches = Math.ceil(uniqueRows.length / BATCH_SIZE);

  console.log(`\n📥 Inserting ${uniqueRows.length} SKUs in ${totalBatches} batches...\n`);

  let inserted = 0;
  for (let i = 0; i < uniqueRows.length; i += BATCH_SIZE) {
    const batch = uniqueRows.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    const values = batch.map((row, idx) => ({
      id: `sku-${String(i + idx + 1).padStart(5, "0")}`,
      skuCode: row.sku,
      name: row.name,
      barcode: row.barcode,
    }));

    await db.insert(masterSku).values(values).onConflictDoNothing();
    inserted += batch.length;

    const pct = Math.round((inserted / uniqueRows.length) * 100);
    console.log(`  Batch ${batchNum}/${totalBatches} — ${inserted}/${uniqueRows.length} (${pct}%)`);
  }

  console.log(`\n✅ Migration completed! ${inserted} SKUs imported.`);
  await client.end();
  process.exit(0);
}

migrateSkus().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});

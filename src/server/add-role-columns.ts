import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

async function addRoleColumns() {
  console.log("🔧 Adding role columns to user table...");

  try {
    // Add role column (text, default 'checker')
    await sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'checker'`;
    console.log("  ✅ role column added");

    // Add banned column (boolean, default false)
    await sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banned" BOOLEAN DEFAULT false`;
    console.log("  ✅ banned column added");

    // Add ban_reason column (text, nullable)
    await sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "ban_reason" TEXT`;
    console.log("  ✅ ban_reason column added");

    // Add ban_expires column (integer, nullable)
    await sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "ban_expires" INTEGER`;
    console.log("  ✅ ban_expires column added");

    console.log("\n✅ All columns added successfully!");
  } catch (err) {
    console.error("❌ Error:", err);
  }

  await sql.end();
  process.exit(0);
}

addRoleColumns();

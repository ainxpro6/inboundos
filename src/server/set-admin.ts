import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

async function setAdmin() {
  // List users
  const users = await sql`SELECT id, name, email, role FROM "user"`;
  console.log("Current users:");
  users.forEach((u) => console.log(`  - ${u.name} (${u.email}) — role: ${u.role}`));

  if (users.length === 0) {
    console.log("\n❌ No users found. Register first then run this script.");
    await sql.end();
    process.exit(1);
  }

  // Set first user as admin
  const firstUser = users[0];
  await sql`UPDATE "user" SET role = 'admin' WHERE id = ${firstUser.id}`;
  console.log(`\n✅ Set ${firstUser.name} (${firstUser.email}) as ADMIN`);

  await sql.end();
  process.exit(0);
}

setAdmin();

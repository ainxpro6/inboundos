import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import postgres from "postgres";

async function run() {
  console.log("🌱 Creating test user example@gmail.com dynamically...");
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
  try {
    // Delete existing test user if any, to avoid conflicts
    await sql`DELETE FROM "user" WHERE email = 'example@gmail.com'`;
    
    // Dynamically import auth so that dotenv is loaded first
    const { auth } = await import("../lib/auth");
    
    // Register the user using better-auth signUpEmail
    const res = await auth.api.signUpEmail({
      body: {
        email: "example@gmail.com",
        password: "password123",
        name: "Test Admin User",
      },
    });
    console.log("✅ User created successfully in better-auth.");
    
    // Update the role to 'admin' directly in the database
    await sql`UPDATE "user" SET role = 'admin' WHERE email = 'example@gmail.com'`;
    console.log("✅ Updated role to 'admin' in database.");
  } catch (error) {
    console.error("❌ Error creating user:", error);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

run();

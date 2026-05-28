import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/server/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DIRECT_URL!,
  },
});

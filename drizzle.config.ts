import { config } from 'dotenv';
import { defineConfig } from "drizzle-kit";

config({ path: '.env' });

const ssl = process.env.SSL_MODE === 'require' ? 'require' : false;

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    ssl,
  },
});
import { config } from "dotenv";
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

config({ path: ".env" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const telegramPool = new Pool({
  connectionString: process.env.TELEGRAM_DATABASE_URL,
});

export const db = drizzle(pool);
export const telegram_db = drizzle(telegramPool);

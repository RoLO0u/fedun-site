import { integer, date, pgTable } from "drizzle-orm/pg-core";

export const lastUpdated = pgTable("app_last_updated", {
  id: integer("id").primaryKey(),
  date: date("last_updated").notNull(),
});
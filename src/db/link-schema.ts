import { pgTable, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const link = pgTable("link", {
  id: text("id").primaryKey(),
  url: text("url").notNull(),
  shortUrl: text("short_url").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  accessedAt: timestamp("accessed_at"),
  accessCount: integer("access_count").default(0).notNull(),
  collectStats: boolean("collect_stats").default(false).notNull(),
  author: text("author").notNull().references(() => user.id),
});
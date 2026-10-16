import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";

export const posts = pgTable("posts", {
  id: varchar("id", { length: 191 }).primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  publishedAt: timestamp("published_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdateFn(() => new Date()),
});
import { integer, pgTable, text } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  userId: text("userid").primaryKey(),
  packs: text("packs").array(),
  username: text("username"),
  name: text("name"),
  title: text("title"),
  emoji: text("emoji"),
  stickers: text("stickers").array(),
  emojis: text("emojis").array(),
  sticker: text("sticker"),
  image: text("image"),
  firstName: text("first_name"),
  email: text("email"),
});

export const packs = pgTable("packs", {
  packId: integer("packid").primaryKey(),
  title: text("title").notNull(),
  adminId: integer("adm").notNull(),
  members: integer("members").array(),
  status: text("status").notNull(),
  password: text("password"),
});
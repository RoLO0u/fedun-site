"use server";

import { db } from "@/db/drizzle";
import { eq, sql } from "drizzle-orm";
import { link } from "@/db/schema";
import { randomUUID } from "crypto";

export const generateLink = async (url: string, shortUrl: string, collectStats: boolean) => {
  const newLink = await db.insert(link).values({
    id: randomUUID(),
    url,
    shortUrl,
    collectStats
  }).returning();

  return newLink[0];
}

export const getLinkByShortUrl = async (shortUrl: string) => {
  const foundLink = await db.select().from(link).where(eq(link.shortUrl, shortUrl));
  return foundLink[0];
}

export const incrementAccessCount = async (shortUrl: string) => {
  const updatedLink = await db.update(link)
    .set({
      accessCount: sql`${link.accessCount} + 1`,
      accessedAt: new Date(),
    })
    .where(eq(link.shortUrl, shortUrl))
    .returning();

  return updatedLink[0];
}

export const deleteLinkByShortUrl = async (shortUrl: string) => {
  const deletedLink = await db.delete(link)
    .where(eq(link.shortUrl, shortUrl))
    .returning();

  return deletedLink[0];
}
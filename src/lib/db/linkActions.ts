"use server";

import { db } from "@/db/drizzle";
import { eq, sql, and } from "drizzle-orm";
import { link, user } from "@/db/schema";
import { randomUUID } from "crypto";

export const generateLink = async (
  url: string,
  shortUrl: string,
  collectStats: boolean,
  author: string
) => {
  const newLink = await db.insert(link).values({
    id: randomUUID(),
    url,
    shortUrl,
    collectStats,
    author,
  }).returning();

  const updatedUser = await db.update(user)
    .set({
      shortLinks: sql`array_append(${user.shortLinks}, ${shortUrl})`,
    })
    .where(eq(user.id, author))
    .returning();

  return { newLink: newLink[0], updatedUser: updatedUser[0] };
}

export const getLinkByShortUrl = async (shortUrl: string) => {
  const foundLink = await db.select().from(link).where(eq(link.shortUrl, shortUrl));
  return foundLink[0];
}

export const getLinkStats = async (shortUrl: string, userId: string) => {
  const foundLink = await db.select().from(link).where(and(eq(link.shortUrl, shortUrl), eq(link.author, userId)));
  return foundLink[0];
}

export const getLinksByUserId = async (userId: string) => {
  const links = await db.select().from(link).where(eq(link.author, userId));
  return links;
}

export const incrementAccessCount = async (shortUrl: string, country?: string) => {
  const updatedLink = await db.update(link)
    .set({
      accessCount: sql`${link.accessCount} + 1`,
      accessedAt: new Date(),
      countriesAccessed: country
        ? sql`jsonb_set(${link.countriesAccessed}::jsonb, ARRAY[${country}]::text[], COALESCE((${link.countriesAccessed} ->> ${country})::int + 1, 1)::text::jsonb, true)::json`
        : sql`${link.countriesAccessed}`,
    })
    .where(eq(link.shortUrl, shortUrl))
    .returning();

  return updatedLink[0];
}

export const deleteLinkByShortUrl = async (shortUrl: string, userId: string) => {
  const deletedLink = await db.delete(link)
    .where(and(eq(link.shortUrl, shortUrl), eq(link.author, userId)))
    .returning();

  return deletedLink[0];
}

export const changeAuthorOfLink = async (shortUrl: string, newAuthorId: string) => {
  const updatedLink = await db.update(link)
    .set({
      author: newAuthorId,
    })
    .where(eq(link.shortUrl, shortUrl))
    .returning();

  return updatedLink[0];
}

"use server";

import { db } from "@/db/drizzle";
import { posts } from "@/db/post-schema";
import { eq } from "drizzle-orm";

export const getPostById = async (postId: string) => {
  return (await db.select().from(posts).where(eq(posts.id, postId))).at(0);
};
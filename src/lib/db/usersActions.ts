"use server";

import { db } from "@/db/drizzle";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export const getAllUsers = async () => {
    return await db.select().from(user);
}

export const verifyEmail = async (userId: string, verify: boolean) => {
    await db.update(user).set({ emailVerified: verify }).where(eq(user.id, userId));
}

export const setUserBanned = async (userId: string, banned: boolean) => {
    await db
        .update(user)
        .set({ banned, banReason: banned ? "Banned by admin" : null, banExpires: null })
        .where(eq(user.id, userId));
}

export const deleteUser = async (userId: string) => {
    await db.delete(user).where(eq(user.id, userId));
}
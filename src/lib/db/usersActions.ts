"use server";

import { db } from "@/db/drizzle";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export const getAllUsers = async () => {
    return await db.select().from(user);
}

export const verifyEmail = async (userId: string, verify: boolean) => {
    console.log(`Verifying email for userId: ${userId} to ${verify}`);
    await db.update(user).set({ emailVerified: verify }).where(eq(user.id, userId));
}
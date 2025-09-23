"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/drizzle";
import { lastUpdated } from "@/db/schema";

export const getLastUpdated = async (id: number) => {
    return await db.select().from(lastUpdated).where(eq(lastUpdated.id, id));
}

export const getAllLastUpdated = async () => {
    return await db.select().from(lastUpdated);
}

export const updateLastUpdated = async (id: number, date: string) => {
    await db.update(lastUpdated).set({ date: date }).where(eq(lastUpdated.id, id));
    revalidatePath("/");
}
"use server";

import { db } from "@/db/drizzle";
import { user } from "@/db/schema";

export const getAllUsers = async () => {
    return await db.select().from(user);
}
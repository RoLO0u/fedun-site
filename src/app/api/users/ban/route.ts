import { NextResponse } from "next/server";
import { withAuth } from "@/lib/authenticate";
import { setUserBanned } from "@/lib/db/usersActions";

export const POST = withAuth(async (req) => {
    const { userId, banned } = await req.json();

    if (!userId || typeof banned !== "boolean") {
        return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    await setUserBanned(userId, banned);

    return NextResponse.json({ success: true, banned });
}, { requireAdmin: true });

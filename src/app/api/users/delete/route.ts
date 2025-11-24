import { NextResponse } from "next/server";
import { withAuth } from "@/lib/authenticate";
import { deleteUser } from "@/lib/db/usersActions";

export const POST = withAuth(async (req) => {
    const { userId } = await req.json();

    if (!userId) {
        return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    await deleteUser(userId);

    return NextResponse.json({ success: true });
}, { requireAdmin: true });

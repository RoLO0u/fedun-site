import { getAllUsers } from "@/lib/db/usersActions";
import { withAuth } from "@/lib/authenticate";
import { NextResponse } from "next/server";

export const GET = withAuth(async (_req, _session) => {
    const lastUpdated = await getAllUsers();
    return NextResponse.json(lastUpdated);
}, { requireAdmin: true });
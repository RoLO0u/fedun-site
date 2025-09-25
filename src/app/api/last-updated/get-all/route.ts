import { getAllLastUpdated } from "@/lib/db/lastUpdatedActions";
import { withAuth } from "@/lib/authenticate";
import { NextResponse } from "next/server";

export const GET = withAuth(async (_req, _session) => {
    const lastUpdated = await getAllLastUpdated();
    return NextResponse.json(lastUpdated);
}, { requireAdmin: true });
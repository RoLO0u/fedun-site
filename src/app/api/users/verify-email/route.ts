import { verifyEmail } from "@/lib/db/usersActions";
import { withAuth } from "@/lib/authenticate";
import { NextResponse } from "next/server";

export const POST = withAuth(async (_req, _session) => {
    await verifyEmail(
      _req.nextUrl.searchParams.get("userId")!,
      _req.nextUrl.searchParams.get("verify") === "true"
    );
    return NextResponse.json({ success: true });
}, { requireAdmin: true });
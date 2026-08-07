import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export const withAuth = (
  handler: (req: NextRequest, session: any) => Promise<NextResponse>,
  { requireAdmin = false, requireVerifiedEmail = false } = {}
) => {
  return async function (req: NextRequest) {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (requireAdmin && session.user.role !== "admin") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    if (requireVerifiedEmail && session.user.emailVerified !== true) {
      return new NextResponse("Email verification required", { status: 403 });
    }

    return handler(req, session);
  };
}
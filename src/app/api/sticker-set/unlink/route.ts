import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from "@/lib/authenticate";
import { unlinkUser } from "@/lib/db/stickerSetActions";

export const GET = withAuth(
  async (_req: NextRequest, session) => {
    const userEmail = session.user.email;
    await unlinkUser(userEmail);
    return NextResponse.json({ message: "User unlinked successfully" });
  }
);
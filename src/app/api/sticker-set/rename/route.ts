import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/authenticate";
import { renameStickerSet } from "@/lib/db/stickerSetActions";
import { stickerSetActionErrorResponse } from "../actionError";

export const POST = withAuth(async (request: NextRequest, session) => {
  const body: unknown = await request.json().catch(() => null);
  if (
    !body ||
    typeof body !== "object" ||
    !("setName" in body) ||
    !("title" in body) ||
    typeof body.setName !== "string" ||
    typeof body.title !== "string" ||
    !body.setName
  ) {
    return NextResponse.json(
      { error: "Sticker set name and a valid title are required." },
      { status: 400 },
    );
  }

  try {
    const success = await renameStickerSet(
      session.user.email,
      body.setName,
      body.title,
    );
    return NextResponse.json({ success });
  } catch (error) {
    return stickerSetActionErrorResponse(error);
  }
});

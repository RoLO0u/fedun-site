import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/authenticate";
import {
  deleteStickerFromSet,
} from "@/lib/db/stickerSetActions";
import { stickerSetActionErrorResponse } from "../actionError";

export const POST = withAuth(async (request: NextRequest, session) => {
  const body: unknown = await request.json().catch(() => null);
  if (
    !body ||
    typeof body !== "object" ||
    !("setName" in body) ||
    !("stickerId" in body) ||
    typeof body.setName !== "string" ||
    typeof body.stickerId !== "string" ||
    !body.setName ||
    !body.stickerId
  ) {
    return NextResponse.json(
      { error: "Sticker set and sticker are required." },
      { status: 400 },
    );
  }

  try {
    const success = await deleteStickerFromSet(
      session.user.email,
      body.setName,
      body.stickerId,
    );
    return NextResponse.json({ success });
  } catch (error) {
    return stickerSetActionErrorResponse(error);
  }
});

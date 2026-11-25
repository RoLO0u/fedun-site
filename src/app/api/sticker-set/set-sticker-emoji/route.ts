import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/authenticate";
import { setStickerEmojiList } from "@/lib/db/stickerSetActions";
import { stickerSetActionErrorResponse } from "../actionError";

export const POST = withAuth(async (request: NextRequest, session) => {
  const body: unknown = await request.json().catch(() => null);
  if (
    !body ||
    typeof body !== "object" ||
    !("setName" in body) ||
    !("stickerId" in body) ||
    !("emojiList" in body) ||
    typeof body.setName !== "string" ||
    typeof body.stickerId !== "string" ||
    !Array.isArray(body.emojiList) ||
    body.emojiList.some((emoji) => typeof emoji !== "string") ||
    !body.setName ||
    !body.stickerId
  ) {
    return NextResponse.json(
      { error: "Sticker set, sticker, and a valid emoji list are required." },
      { status: 400 },
    );
  }

  try {
    const success = await setStickerEmojiList(
      session.user.email,
      body.setName,
      body.stickerId,
      body.emojiList,
    );
    return NextResponse.json({ success });
  } catch (error) {
    return stickerSetActionErrorResponse(error);
  }
});

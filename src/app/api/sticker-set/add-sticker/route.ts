import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/authenticate";
import { addStickerToSet } from "@/lib/db/stickerSetActions";
import { stickerSetActionErrorResponse } from "../actionError";

const MAX_REQUEST_SIZE = 512 * 1024 + 64 * 1024;

export const POST = withAuth(async (request: NextRequest, session) => {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_SIZE) {
    return NextResponse.json(
      { error: "The upload request is too large." },
      { status: 413 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
  }

  const setName = formData.get("setName");
  const emojiListValue = formData.get("emojiList");
  const file = formData.get("sticker");
  if (
    typeof setName !== "string" ||
    typeof emojiListValue !== "string" ||
    !(file instanceof File)
  ) {
    return NextResponse.json(
      { error: "Sticker set, emoji list, and file are required." },
      { status: 400 },
    );
  }

  let emojiList: unknown;
  try {
    emojiList = JSON.parse(emojiListValue);
  } catch {
    return NextResponse.json({ error: "Invalid emoji list." }, { status: 400 });
  }

  if (
    !Array.isArray(emojiList) ||
    emojiList.some((emoji) => typeof emoji !== "string")
  ) {
    return NextResponse.json({ error: "Invalid emoji list." }, { status: 400 });
  }

  try {
    const success = await addStickerToSet(
      session.user.email,
      setName,
      file,
      emojiList,
    );
    return NextResponse.json({ success });
  } catch (error) {
    return stickerSetActionErrorResponse(error);
  }
});

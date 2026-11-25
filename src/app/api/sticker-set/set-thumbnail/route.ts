import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/authenticate";
import {
  setStickerSetThumbnail,
  setStickerSetThumbnailFromSticker,
} from "@/lib/db/stickerSetActions";
import { stickerSetActionErrorResponse } from "../actionError";

const MAX_REQUEST_SIZE = 256 * 1024;

export const POST = withAuth(async (request: NextRequest, session) => {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_SIZE) {
    return NextResponse.json(
      { error: "The thumbnail upload request is too large." },
      { status: 413 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid thumbnail upload request." }, { status: 400 });
  }

  const setName = formData.get("setName");
  const stickerId = formData.get("stickerId");
  const thumbnail = formData.get("thumbnail");
  if (typeof setName !== "string" || !setName) {
    return NextResponse.json(
      { error: "Sticker set is required." },
      { status: 400 },
    );
  }

  if (typeof stickerId === "string" && stickerId && !thumbnail) {
    try {
      const success = await setStickerSetThumbnailFromSticker(
        session.user.email,
        setName,
        stickerId,
      );
      return NextResponse.json({ success });
    } catch (error) {
      return stickerSetActionErrorResponse(error);
    }
  }

  if (!(thumbnail instanceof File) || stickerId) {
    return NextResponse.json(
      { error: "Provide either a thumbnail file or a sticker from this set." },
      { status: 400 },
    );
  }

  try {
    const success = await setStickerSetThumbnail(
      session.user.email,
      setName,
      thumbnail,
    );
    return NextResponse.json({ success });
  } catch (error) {
    return stickerSetActionErrorResponse(error);
  }
});

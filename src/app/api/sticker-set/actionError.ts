import { NextResponse } from "next/server";
import { StickerSetActionError } from "@/lib/stickerSetActionError";

export const stickerSetActionErrorResponse = (error: unknown) => {
  if (error instanceof StickerSetActionError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error("Sticker set action failed:", error);
  return NextResponse.json(
    { error: "The sticker set action failed unexpectedly." },
    { status: 500 },
  );
};

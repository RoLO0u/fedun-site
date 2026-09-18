import { getAllStickerSets } from "@/lib/db/stickerSetActions";
import { withAuth } from "@/lib/authenticate";
import { NextResponse } from "next/server";

export const GET = withAuth(async (_req, session) => {
  const userEmail = session.user.email;
  const data = await getAllStickerSets(userEmail);
  return NextResponse.json(data);
});
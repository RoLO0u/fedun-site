"use server";

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from "@/lib/authenticate";
import { setStickerSetPosition } from "@/lib/db/stickerSetActions";
import { stickerSetActionErrorResponse } from "../actionError";

export const POST = withAuth(
  async (request: NextRequest, session) => {
    const body: unknown = await request.json().catch(() => null);
    if (
      !body ||
      typeof body !== "object" ||
      !("setName" in body) ||
      !("stickerId" in body) ||
      !("position" in body) ||
      typeof body.setName !== "string" ||
      typeof body.stickerId !== "string" ||
      typeof body.position !== "number" ||
      !body.setName ||
      !body.stickerId ||
      !Number.isInteger(body.position) ||
      body.position < 0
    ) {
      return new NextResponse('Sticker set, sticker ID, and valid position are required', { status: 400 });
    }

    try {
      const result = await setStickerSetPosition(
        session.user.email,
        body.setName,
        body.stickerId,
        body.position,
      );

      return NextResponse.json({ success: result });
    } catch (error) {
      return stickerSetActionErrorResponse(error);
    }
  },
);
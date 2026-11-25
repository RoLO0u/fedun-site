"use server";

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from "@/lib/authenticate";
import { getStickerSet } from "@/lib/db/stickerSetActions";
import { stickerSetActionErrorResponse } from "../actionError";

export const GET = withAuth(
  async (request: NextRequest, session) => {
    const { searchParams } = new URL(request.url);
    const setName = searchParams.get('setName');

    if (!setName) {
      return new NextResponse('Missing sticker set name', { status: 400 });
    }

    try {
      return await getStickerSet(session.user.email, setName);
    } catch (error) {
      return stickerSetActionErrorResponse(error);
    }
  },
);
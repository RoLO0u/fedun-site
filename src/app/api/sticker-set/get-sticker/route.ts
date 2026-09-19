"use server";

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from "@/lib/authenticate";
import { getStickerFileUrl } from "@/lib/db/stickerSetActions";

export const GET = withAuth(
  async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('file-id');

  if (!fileId) {
    return new NextResponse('Missing file id', { status: 400 });
  }

  const sticker = await getStickerFileUrl(fileId);

  return typeof sticker === 'string' ? new NextResponse(sticker) : sticker;
});
"use server";

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from "@/lib/authenticate";
import { setStickerSetPosition } from "@/lib/db/stickerSetActions";

export const GET = withAuth(
  async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const stickerId = searchParams.get('sticker-id');
  const position = parseInt(searchParams.get('position') || '0');

  if (!stickerId) {
    return new NextResponse('Missing file id', { status: 400 });
  }

  const result = await setStickerSetPosition(stickerId, position);

  return typeof result === 'boolean' ? NextResponse.json({ success: result }) : NextResponse.json({ error: 'Failed to set sticker position' }, { status: 500 });
});
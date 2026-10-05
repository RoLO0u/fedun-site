"use server";

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from "@/lib/authenticate";
import { getStickerSet } from "@/lib/db/stickerSetActions";

export const GET = withAuth(
  async (request: NextRequest
) => {
  const { searchParams } = new URL(request.url);
  const setName = searchParams.get('setName');

  if (!setName) {
    return new NextResponse('Missing file path', { status: 400 });
  }

  return getStickerSet(setName);
});
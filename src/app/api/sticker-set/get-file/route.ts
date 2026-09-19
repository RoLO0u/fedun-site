"use server";

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from "@/lib/authenticate";
import { getFile } from "@/lib/db/stickerSetActions";

export const GET = withAuth(
  async (request: NextRequest
) => {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('path');

  if (!filePath) {
    return new NextResponse('Missing file path', { status: 400 });
  }

  return getFile(filePath);
});
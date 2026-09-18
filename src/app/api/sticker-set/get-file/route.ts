"use server";

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from "@/lib/authenticate";

export const GET = withAuth(
  async (request: NextRequest
) => {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('path');

  if (!filePath) {
    return new NextResponse('Missing file path', { status: 400 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

  try {
    const response = await fetch(telegramUrl);

    if (!response.ok) {
      return new NextResponse('Failed to fetch file from Telegram', { status: response.status });
    }

    // Get the image binary data
    const blob = await response.blob();
    const contentType = response.headers.get('content-type') || 'image/webp';

    // Stream it back to the client with caching enabled
    return new NextResponse(blob, {
      headers: {
        'Content-Type': contentType,
        // Cache in browser & CDN for 30 days so Telegram isn't repeatedly hit
        'Cache-Control': 'public, max-age=2592000, immutable',
      },
    });
  } catch {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
});
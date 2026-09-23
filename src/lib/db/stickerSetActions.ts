"use server";

import { db, telegram_db } from "@/db/drizzle";
import { eq } from "drizzle-orm";
import { users } from "@/db/telegram-schema";
import { user as webUser } from "@/db/schema";
import { StickerSet } from "@/types/telegram";
import { NextResponse } from "next/server";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SET_WATERMARK = process.env.TELEGRAM_SET_WATERMARK;

const requestFile = async (telegramUrl: string) => {
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
}

const requestStickerSet = async (id: string) => {
  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/getStickerSet?name=${id}${SET_WATERMARK}`,
    { next: { revalidate: 86400 } }
  );

  const data = await res.json();
  if (!data.ok) throw new Error(data.description || 'Failed to fetch sticker set');
  
  return data.result as StickerSet;
}

const getTelegramFilePath = async (fileId: string) => {
  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`,
    { cache: "no-store" }
  );

  const data = await res.json();
  if (!data.ok) throw new Error(data.description || 'Failed to fetch file path');

  return data.result.file_path as string;
}

export const getStickerFileUrl = async (fileId: string) => {
  const filePath = await getTelegramFilePath(fileId);
  return `/api/sticker-set/get-file?path=${encodeURIComponent(filePath)}`;
}

export const getAllStickerSets = async (userEmail: string) => {
  const stickerSetsId = (await telegram_db.select().from(users).where(eq(users.email, userEmail)))
    .at(0)?.packs || [];

  const StickerSets = Promise.all(
    stickerSetsId.map((stickerSetId) => requestStickerSet(stickerSetId))
  );

  const firstStickers = Promise.all(
    (await StickerSets).map(async (stickerSet) => {
      return await getStickerFileUrl(stickerSet.stickers[0].file_id)
      }
    )
  );

  const thumbnails = Promise.all(
    (await StickerSets).map(async (stickerSet) => {
      if (stickerSet.thumbnail?.file_id) {
        return await getStickerFileUrl(stickerSet.thumbnail.file_id);
      }
      return null;
    })
  );

  return {
    stickerSets: await StickerSets,
    firstStickers: await firstStickers,
    thumbnails: await thumbnails,
  };
}

export const getFile = async (filePath: string) => {
  return requestFile(`https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`);
};

export const setStickerSetPosition = async (stickerId: string, position: number) => {
  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/setStickerPositionInSet?sticker=${stickerId}&position=${position}`,
    { next: { revalidate: 86400 } }
  );

  const data = await res.json();
  if (!data.ok) throw new Error(data.description || 'Failed to set sticker position');
  
  return data.result as boolean;
};

export const unlinkUser = async (userEmail: string) => {
  await telegram_db.update(users)
    .set({ email: null })
    .where(eq(users.email, userEmail));
  await db.update(webUser)
    .set({ telegram: null })
    .where(eq(webUser.email, userEmail));
};
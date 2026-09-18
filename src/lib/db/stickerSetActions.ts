"use server";

import { db, telegram_db } from "@/db/drizzle";
import { eq } from "drizzle-orm";
import { users } from "@/db/telegram-schema";
import { user as webUser } from "@/db/schema";
import { StickerSet } from "@/types/telegram";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SET_WATERMARK = process.env.TELEGRAM_SET_WATERMARK;

export const getStickerSetById = async (id: string) => {
  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/getStickerSet?name=${id}`,
    { next: { revalidate: 86400 } }
  );

  const data = await res.json();
  if (!data.ok) throw new Error(data.description || 'Failed to fetch sticker set');

  return data.result as StickerSet;
};

const requestStickerSet = async (id: string) => {
  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/getStickerSet?name=${id}${SET_WATERMARK}`,
    { next: { revalidate: 86400 } }
  );

  const data = await res.json();
  if (!data.ok) throw new Error(data.description || 'Failed to fetch sticker set');
  
  return data.result as StickerSet;
}

const getStickerFileUrl = async (fileId: string) => {
  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`,
    { next: { revalidate: 86400 } }
  );

  const data = await res.json();
  if (!data.ok) throw new Error(data.description || 'Failed to fetch file path');

  return `/api/sticker-set/get-file?path=${encodeURIComponent(data.result.file_path)}`;
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

export const unlinkUser = async (userEmail: string) => {
  await telegram_db.update(users)
    .set({ email: null })
    .where(eq(users.email, userEmail));
  await db.update(webUser)
    .set({ telegram: null })
    .where(eq(webUser.email, userEmail));
};
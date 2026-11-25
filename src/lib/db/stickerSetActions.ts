"use server";

import { db, telegram_db } from "@/db/drizzle";
import { eq } from "drizzle-orm";
import { users } from "@/db/telegram-schema";
import { user as webUser } from "@/db/schema";
import { StickerSet } from "@/types/telegram";
import { StickerSetActionError } from "@/lib/stickerSetActionError";
import { NextResponse } from "next/server";
import { gunzipSync } from "node:zlib";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SET_WATERMARK = process.env.TELEGRAM_SET_WATERMARK;

const getBotApiUrl = (method: string) => {
  if (!BOT_TOKEN) {
    throw new StickerSetActionError("Telegram bot is not configured.", 500);
  }
  return `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
};

const getOwnedStickerSet = async (userEmail: string, setName: string) => {
  const owner = (await telegram_db
    .select({ userId: users.userId, packs: users.packs })
    .from(users)
    .where(eq(users.email, userEmail))
  ).at(0);

  const ownsSet = owner?.packs?.some(
    (packName) =>
      packName === setName ||
      Boolean(SET_WATERMARK && `${packName}${SET_WATERMARK}` === setName),
  );
  if (!owner || !ownsSet) {
    throw new StickerSetActionError("Sticker set not found.", 404);
  }

  const userId = Number(owner.userId);
  if (!Number.isSafeInteger(userId)) {
    throw new StickerSetActionError("Sticker set owner ID is invalid.", 500);
  }

  return { userId, stickerSet: await requestStickerSet(setName, true) };
};

const getOwnedSticker = async (
  userEmail: string,
  setName: string,
  stickerId: string,
) => {
  const ownedSet = await getOwnedStickerSet(userEmail, setName);
  const sticker = ownedSet.stickerSet.stickers.find(
    (item) => item.file_id === stickerId,
  );

  if (!sticker) {
    throw new StickerSetActionError("Sticker not found in this set.", 404);
  }

  return { ...ownedSet, sticker };
};

const callTelegram = async (method: string, body: unknown) => {
  const response = await fetch(getBotApiUrl(method), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => null);

  if (
    !response.ok ||
    !data ||
    typeof data !== "object" ||
    !("ok" in data) ||
    data.ok !== true
  ) {
    const description =
      data && typeof data === "object" && "description" in data &&
      typeof data.description === "string"
        ? data.description
        : `Telegram rejected ${method}.`;
    throw new StickerSetActionError(
      description,
      502,
    );
  }

  if (!("result" in data) || data.result !== true) {
    throw new StickerSetActionError(`Telegram did not confirm ${method}.`, 502);
  }
  return true;
};

const assertEmojiList = (emojiList: string[]) => {
  if (
    emojiList.length < 1 ||
    emojiList.length > 20 ||
    emojiList.some((emoji) => !emoji.trim())
  ) {
    throw new StickerSetActionError(
      "Provide between 1 and 20 non-empty emoji.",
      400,
    );
  }
};

type StickerFormat = "static" | "animated" | "video";

const parsePngDimensions = (data: Buffer) => {
  if (
    data.length < 24 ||
    !data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
    data.toString("ascii", 12, 16) !== "IHDR"
  ) {
    throw new StickerSetActionError("The PNG file is invalid.", 400);
  }
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
};

const parseWebpDimensions = (data: Buffer) => {
  if (data.toString("ascii", 0, 4) !== "RIFF" || data.toString("ascii", 8, 12) !== "WEBP") {
    throw new StickerSetActionError("The WEBP file is invalid.", 400);
  }

  let offset = 12;
  while (offset + 8 <= data.length) {
    const chunkType = data.toString("ascii", offset, offset + 4);
    const chunkSize = data.readUInt32LE(offset + 4);
    const chunk = offset + 8;

    if (chunk + chunkSize > data.length) break;

    if (chunkType === "VP8X" && chunkSize >= 10) {
      if (data[chunk] & 0x02) {
        throw new StickerSetActionError("Animated WEBP files are not supported.", 400);
      }
      return {
        width: data.readUIntLE(chunk + 4, 3) + 1,
        height: data.readUIntLE(chunk + 7, 3) + 1,
      };
    }

    if (chunkType === "VP8L" && chunkSize >= 5 && data[chunk] === 0x2f) {
      return {
        width: 1 + data[chunk + 1] + ((data[chunk + 2] & 0x3f) << 8),
        height: 1 + (data[chunk + 2] >> 6) + (data[chunk + 3] << 2) + ((data[chunk + 4] & 0x0f) << 10),
      };
    }

    if (
      chunkType === "VP8 " &&
      chunkSize >= 10 &&
      data[chunk + 3] === 0x9d &&
      data[chunk + 4] === 0x01 &&
      data[chunk + 5] === 0x2a
    ) {
      return {
        width: data.readUInt16LE(chunk + 6) & 0x3fff,
        height: data.readUInt16LE(chunk + 8) & 0x3fff,
      };
    }

    offset = chunk + 8 + chunkSize + (chunkSize % 2);
  }

  throw new StickerSetActionError("The WEBP file is invalid.", 400);
};

const validateDimensions = (
  width: number,
  height: number,
  stickerType: string,
) => {
  const isEmojiSet = stickerType === "custom_emoji";
  if (isEmojiSet) {
    if (width !== 100 || height !== 100) {
      throw new StickerSetActionError(
        "Custom emoji stickers must be 100×100 pixels.",
        400,
      );
    }
    return;
  }

  if (
    width > 512 ||
    height > 512 ||
    (width !== 512 && height !== 512)
  ) {
    throw new StickerSetActionError(
      "Sticker dimensions must be at most 512×512 pixels, with one side exactly 512 pixels.",
      400,
    );
  }
};

const validateStickerFile = (
  fileName: string,
  data: Buffer,
  stickerType: string,
): StickerFormat => {
  const extension = fileName.toLowerCase().split(".").pop();

  if (extension === "png" || extension === "webp") {
    if (data.length > 512 * 1024) {
      throw new StickerSetActionError("Static stickers must not exceed 512 KB.", 413);
    }
    const dimensions = extension === "png"
      ? parsePngDimensions(data)
      : parseWebpDimensions(data);
    validateDimensions(dimensions.width, dimensions.height, stickerType);
    return "static";
  }

  if (extension === "tgs") {
    if (data.length > 64 * 1024) {
      throw new StickerSetActionError("Animated stickers must not exceed 64 KB.", 413);
    }
    let animation: { w?: number; h?: number; ip?: number; op?: number; fr?: number };
    try {
      const json = gunzipSync(data, { maxOutputLength: 5 * 1024 * 1024 }).toString("utf8");
      animation = JSON.parse(json);
    } catch {
      throw new StickerSetActionError("The TGS animation is invalid.", 400);
    }
    if (
      !animation ||
      typeof animation.w !== "number" ||
      typeof animation.h !== "number" ||
      typeof animation.ip !== "number" ||
      typeof animation.op !== "number" ||
      typeof animation.fr !== "number" ||
      animation.fr < 30 ||
      animation.fr > 60 ||
      animation.op <= animation.ip ||
      (animation.op - animation.ip) / animation.fr > 3
    ) {
      throw new StickerSetActionError("The TGS animation metadata is invalid.", 400);
    }
    validateDimensions(animation.w, animation.h, stickerType);
    if (
      stickerType !== "custom_emoji" &&
      (animation.w !== 512 || animation.h !== 512)
    ) {
      throw new StickerSetActionError(
        "TGS stickers must use a 512×512 canvas.",
        400,
      );
    }
    return "animated";
  }

  if (extension === "webm") {
    if (data.length > 256 * 1024) {
      throw new StickerSetActionError("Video stickers must not exceed 256 KB.", 413);
    }
    if (
      data.length < 4 ||
      !data.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))
    ) {
      throw new StickerSetActionError("The WEBM file is invalid.", 400);
    }
    return "video";
  }

  throw new StickerSetActionError(
    "Use a PNG, WEBP, TGS, or WEBM sticker file.",
    400,
  );
};

const requestFile = async (telegramUrl: string, contentType: string) => {
  try {
    const response = await fetch(telegramUrl);

    if (!response.ok) {
      return new NextResponse('Failed to fetch file from Telegram', { status: response.status });
    }

    // Get the image binary data
    const blob = await response.blob();
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

const requestStickerSet = async (id: string, watermarked: boolean = false) => {
  const res = await fetch(
    `${getBotApiUrl("getStickerSet")}?name=${encodeURIComponent(`${id}${watermarked ? "" : SET_WATERMARK || ""}`)}`,
    { cache: "no-store" }
  );

  const data: unknown = await res.json().catch(() => null);
  if (
    !res.ok ||
    !data ||
    typeof data !== "object" ||
    !("ok" in data) ||
    data.ok !== true ||
    !("result" in data)
  ) {
    const description =
      data && typeof data === "object" && "description" in data &&
      typeof data.description === "string"
        ? data.description
        : "Failed to fetch sticker set.";
    throw new StickerSetActionError(description, 502);
  }
  
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
  return `/api/sticker-set/get-file?path=${encodeURIComponent(filePath)}&v=2`;
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
  const extension = filePath.split(".").pop()?.toLowerCase();
  const contentType =
    extension === "webm"
      ? "video/webm"
      : extension === "tgs"
        ? "application/x-tgsticker"
        : extension === "webp"
          ? "image/webp"
          : extension === "png"
            ? "image/png"
            : extension === "jpg" || extension === "jpeg"
              ? "image/jpeg"
              : "application/octet-stream";
  return requestFile(
    `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`,
    contentType,
  );
};

export const setStickerSetPosition = async (
  userEmail: string,
  setName: string,
  stickerId: string,
  position: number,
) => {
  if (!Number.isInteger(position) || position < 0) {
    throw new StickerSetActionError("Sticker position must be a non-negative integer.", 400);
  }
  await getOwnedSticker(userEmail, setName, stickerId);
  return callTelegram("setStickerPositionInSet", {
    sticker: stickerId,
    position,
  });
};

export const addStickerToSet = async (
  userEmail: string,
  setName: string,
  file: File,
  emojiList: string[],
) => {
  assertEmojiList(emojiList);
  const { userId, stickerSet } = await getOwnedStickerSet(userEmail, setName);

  if (stickerSet.stickers.length >= (stickerSet.sticker_type === "custom_emoji" ? 200 : 120)) {
    throw new StickerSetActionError("This sticker set has reached Telegram's sticker limit.", 400);
  }

  const extension = file.name.toLowerCase().split(".").pop();
  const maxFileSize = extension === "png" || extension === "webp"
    ? 512 * 1024
    : extension === "tgs"
      ? 64 * 1024
      : extension === "webm"
        ? 256 * 1024
        : undefined;
  if (!maxFileSize) {
    throw new StickerSetActionError(
      "Use a PNG, WEBP, TGS, or WEBM sticker file.",
      400,
    );
  }
  if (file.size > maxFileSize) {
    throw new StickerSetActionError("The sticker file exceeds Telegram's size limit.", 413);
  }

  const fileData = Buffer.from(await file.arrayBuffer());
  const format = validateStickerFile(file.name, fileData, stickerSet.sticker_type);
  const stickerData = new FormData();
  stickerData.set("user_id", String(userId));
  stickerData.set("name", setName);
  stickerData.set(
    "sticker",
    JSON.stringify({
      sticker: "attach://sticker_file",
      format,
      emoji_list: emojiList,
    }),
  );
  stickerData.set(
    "sticker_file",
    new Blob([fileData], { type: file.type || "application/octet-stream" }),
    file.name,
  );

  const response = await fetch(getBotApiUrl("addStickerToSet"), {
    method: "POST",
    body: stickerData,
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => null);

  if (
    !response.ok ||
    !data ||
    typeof data !== "object" ||
    !("ok" in data) ||
    data.ok !== true
  ) {
    const description =
      data && typeof data === "object" && "description" in data &&
      typeof data.description === "string"
        ? data.description
        : "Telegram rejected the sticker upload.";
    throw new StickerSetActionError(
      description,
      502,
    );
  }

  if (!("result" in data) || data.result !== true) {
    throw new StickerSetActionError("Telegram did not confirm the sticker upload.", 502);
  }
  return true;
};

export const setStickerSetThumbnail = async (
  userEmail: string,
  setName: string,
  file: File,
) => {
  const { userId, stickerSet } = await getOwnedStickerSet(userEmail, setName);
  const firstSticker = stickerSet.stickers[0];
  if (!firstSticker) {
    throw new StickerSetActionError("This sticker set has no stickers.", 400);
  }

  const format: StickerFormat = firstSticker.is_video
    ? "video"
    : firstSticker.is_animated
      ? "animated"
      : "static";
  const extension = file.name.toLowerCase().split(".").pop();
  const expectedExtensions =
    format === "static" ? ["png", "webp"] : format === "animated" ? ["tgs"] : ["webm"];
  const maxFileSize = format === "static" ? 128 * 1024 : 32 * 1024;
  if (!extension || !expectedExtensions.includes(extension)) {
    throw new StickerSetActionError(
      `Use a ${expectedExtensions.join(" or ").toUpperCase()} thumbnail for this sticker set.`,
      400,
    );
  }
  if (file.size > maxFileSize) {
    throw new StickerSetActionError(
      `The thumbnail must not exceed ${Math.round(maxFileSize / 1024)} KB.`,
      413,
    );
  }

  const fileData = Buffer.from(await file.arrayBuffer());
  if (format === "static") {
    const dimensions =
      extension === "png" ? parsePngDimensions(fileData) : parseWebpDimensions(fileData);
    if (dimensions.width !== 100 || dimensions.height !== 100) {
      throw new StickerSetActionError(
        "Thumbnail images must be exactly 100×100 pixels.",
        400,
      );
    }
  } else if (
    format === "animated" &&
    (fileData.length < 2 || fileData[0] !== 0x1f || fileData[1] !== 0x8b)
  ) {
    throw new StickerSetActionError("The TGS thumbnail is invalid.", 400);
  } else if (
    format === "video" &&
    (fileData.length < 4 ||
      !fileData.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])))
  ) {
    throw new StickerSetActionError("The WEBM thumbnail is invalid.", 400);
  }

  const thumbnailData = new FormData();
  thumbnailData.set("user_id", String(userId));
  thumbnailData.set("name", setName);
  thumbnailData.set("format", format);
  thumbnailData.set("thumbnail", "attach://thumbnail_file");
  thumbnailData.set(
    "thumbnail_file",
    new Blob(
      [fileData],
      {
        type:
          extension === "tgs"
            ? "application/x-tgsticker"
            : extension === "webm"
              ? "video/webm"
              : extension === "png"
                ? "image/png"
                : "image/webp",
      },
    ),
    file.name,
  );

  const response = await fetch(getBotApiUrl("setStickerSetThumbnail"), {
    method: "POST",
    body: thumbnailData,
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => null);
  if (
    !response.ok ||
    !data ||
    typeof data !== "object" ||
    !("ok" in data) ||
    data.ok !== true
  ) {
    const description =
      data && typeof data === "object" && "description" in data &&
      typeof data.description === "string"
        ? data.description
        : "Telegram rejected the thumbnail.";
    throw new StickerSetActionError(description, 502);
  }
  if (!("result" in data) || data.result !== true) {
    throw new StickerSetActionError("Telegram did not confirm the thumbnail update.", 502);
  }
  return true;
};

export const setStickerSetThumbnailFromSticker = async (
  userEmail: string,
  setName: string,
  stickerId: string,
) => {
  const { userId, sticker } = await getOwnedSticker(userEmail, setName, stickerId);
  const format: StickerFormat = sticker.is_video
    ? "video"
    : sticker.is_animated
      ? "animated"
      : "static";
  if (format === "static") {
    throw new StickerSetActionError(
      "Static stickers must be resized before they can be used as thumbnails.",
      400,
    );
  }
  if (sticker.file_size !== undefined && sticker.file_size > 32 * 1024) {
    throw new StickerSetActionError(
      `This sticker exceeds Telegram's 32 KB ${format === "video" ? "WEBM" : "TGS"} thumbnail limit.`,
      400,
    );
  }

  return callTelegram("setStickerSetThumbnail", {
    user_id: userId,
    name: setName,
    format,
    thumbnail: sticker.file_id,
  });
};

export const renameStickerSet = async (
  userEmail: string,
  setName: string,
  title: string,
) => {
  const normalizedTitle = title.trim();
  const titleLength = [...normalizedTitle].length;
  if (titleLength < 1 || titleLength > 64) {
    throw new StickerSetActionError(
      "Sticker set titles must be between 1 and 64 characters.",
      400,
    );
  }

  await getOwnedStickerSet(userEmail, setName);
  return callTelegram("setStickerSetTitle", {
    name: setName,
    title: normalizedTitle,
  });
};

export const deleteStickerFromSet = async (
  userEmail: string,
  setName: string,
  stickerId: string,
) => {
  await getOwnedSticker(userEmail, setName, stickerId);
  return callTelegram("deleteStickerFromSet", { sticker: stickerId });
};

export const setStickerEmojiList = async (
  userEmail: string,
  setName: string,
  stickerId: string,
  emojiList: string[],
) => {
  assertEmojiList(emojiList);
  const { stickerSet } = await getOwnedSticker(userEmail, setName, stickerId);
  if (stickerSet.sticker_type === "mask") {
    throw new StickerSetActionError("Emoji lists are not supported for mask sticker sets.", 400);
  }
  return callTelegram("setStickerEmojiList", {
    sticker: stickerId,
    emoji_list: emojiList,
  });
};

export const getStickerSet = async (userEmail: string, setName: string) => {
  const { stickerSet } = await getOwnedStickerSet(userEmail, setName);
  return NextResponse.json(stickerSet);
};

export const unlinkUser = async (userEmail: string) => {
  await telegram_db.update(users)
    .set({ email: null })
    .where(eq(users.email, userEmail));
  await db.update(webUser)
    .set({ telegram: null })
    .where(eq(webUser.email, userEmail));
};
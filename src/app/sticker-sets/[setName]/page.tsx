"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import type { StickerSet, Sticker } from "@/types/telegram";
import { StickerSetSortable } from "@/components/stickerSet";

const stickerSetPage = () => {
  const params = useParams();
  const setName = params?.setName as string;

  const [stickerSet, setStickerSet] = useState<StickerSet | null>(null);
  const [stickerItems, setStickerItems] = useState<Array<{ sticker: Sticker, url: string }>>([]);

  useEffect(() => {
    const fetchStickerSet = async () => {
      try {
        const response = await fetch(`/api/sticker-set/get-set?setName=${encodeURIComponent(setName)}`);
        if (!response.ok) {
          throw new Error(`Error fetching sticker set: ${response.statusText}`);
        }
        const data = await response.json();
        setStickerSet(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchStickerSet();
  }, [setName]);

  useEffect(() => {
    if (!stickerSet) return;
    const fetchStickerUrls = async () => {
      const items = await Promise.all(
        stickerSet.stickers.map(async (sticker) => {
          const response = await fetch(`/api/sticker-set/get-sticker?file-id=${sticker.file_id}`);
          if (!response.ok) {
            console.error(`Failed to fetch sticker file: ${response.statusText}`);
            return { sticker, url: '' };
          }
          return { sticker, url: await response.text() };
        })
      );
      setStickerItems(items);
    };
    fetchStickerUrls();
  }, [stickerSet]);

  if (!stickerSet) {
    return (
      <div className="flex flex-col items-center mt-10 grow py-2">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center grow mt-10 gap-2 py-2">
      <h1 className="text-2xl font-bold mb-6">{stickerSet.title}</h1>
      <StickerSetSortable
        stickerSet={stickerSet}
        stickerItems={stickerItems}
        setStickerItems={setStickerItems}
      />
    </div>
  );
};

export default stickerSetPage;
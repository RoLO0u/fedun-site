"use client";

import { 
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "./ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "./ui/button";
import { StickerSet, Sticker } from "@/types/telegram";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { Loader2Icon } from "lucide-react";

const VideoSticker = ({
  sticker,
  index,
  stickerSetTitle,
  stickerUrl,
  className,
}: {
  sticker: Sticker,
  index: number,
  stickerSetTitle: string,
  stickerUrl: string,
  className: string,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [sourceUrl, setSourceUrl] = useState(stickerUrl);
  const [retryCount, setRetryCount] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSourceUrl(stickerUrl);
    setRetryCount(0);
    setFailed(false);
  }, [stickerUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        video.play().catch(() => undefined);
      } else {
        video.pause();
      }
    });

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const handleError = async () => {
    if (retryCount > 0) {
      setFailed(true);
      return;
    }

    try {
      const response = await fetch(
        `/api/sticker-set/get-sticker?file-id=${sticker.file_id}`,
        { cache: "no-store" }
      );
      if (!response.ok) throw new Error("Unable to refresh sticker URL");

      setSourceUrl(await response.text());
      setRetryCount(1);
    } catch {
      setFailed(true);
    }
  };

  if (failed) {
    return (
      <div className={`${className} flex items-center justify-center text-center text-xs text-muted-foreground`}>
        Sticker unavailable
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      width={50}
      height={50}
      src={`${sourceUrl}${sourceUrl.includes("?") ? "&" : "?"}attempt=${retryCount}`}
      loop
      muted
      playsInline
      preload="metadata"
      onError={handleError}
      aria-label={`${stickerSetTitle} sticker ${index}`}
      className={className}
    />
  );
};

export const RenderSticker = ({
  sticker,
  index,
  stickerSetTitle,
  stickerUrl,
  className,
}: {
  sticker: Sticker,
  index: number,
  stickerSetTitle: string,
  stickerUrl: string,
  className: string,
}) => {
  if (sticker.is_video) {
    return <VideoSticker
      sticker={sticker}
      index={index}
      stickerSetTitle={stickerSetTitle}
      stickerUrl={stickerUrl}
      className={className}
    />;
  }
  return (
    <Image
      width={50}
      height={50}
      src={stickerUrl}
      unoptimized
      alt={`${stickerSetTitle} sticker ${index}`}
      className={className}
    />
  )
};

export const StickerSetDialog = ({
  stickerSet,
  thumbnail,
  open,
}: {
  stickerSet: StickerSet,
  thumbnail: string | null,
  open: boolean,
}) => {
  const [stickerUrls, setStickerUrls] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;

    const fetchStickerUrls = async () => {
      const urls = await Promise.all(
        stickerSet.stickers.map(async (sticker) => {
          const response = await fetch(`/api/sticker-set/get-sticker?file-id=${sticker.file_id}`);
          if (!response.ok) {
            console.error(`Failed to fetch sticker file: ${response.statusText}`);
            return '';
          }
          return await response.text();
        })
      );
      setStickerUrls(urls);
    };
    fetchStickerUrls();
  }, [open, stickerSet.stickers]);
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex flex-row content-center justify-center text-lg font-semibold">
          {stickerSet.title}
          { thumbnail &&
            <Image
              width={25}
              height={25}
              src={thumbnail}
              unoptimized
              alt={`${stickerSet.title} thumbnail`}
            />
          }
        </DialogTitle>
      </DialogHeader>
      <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4 flex flex-wrap justify-center items-center gap-2">
        {stickerSet.stickers.map((sticker, index) => (
          <div key={index}>
            {stickerUrls[index] ?
              <RenderSticker
                sticker={sticker}
                index={index + 1}
                stickerSetTitle={stickerSet.title}
                stickerUrl={stickerUrls[index]}
                className="w-26 aspect-square object-contain"
              />
              :
              <Loader2Icon className="animate-spin w-25 h-25" aria-label={`Loading sticker ${index + 1}`} />
            }
          </div>
        ))}
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button>Close</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
}
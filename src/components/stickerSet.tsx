"use client";

import { 
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "./ui/dialog";
import { Button } from "./ui/button";
import { StickerSet, Sticker } from "@/types/telegram";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { Loader2Icon } from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const MAX_VIDEO_RETRIES = 3;

const AnimatedSticker = ({
  sticker,
  index,
  stickerSetTitle,
  stickerUrl,
  thumbnailUrl,
  className,
}: {
  sticker: Sticker,
  index: number,
  stickerSetTitle: string,
  stickerUrl: string,
  thumbnailUrl?: string,
  className: string,
}) => {
  const [fallbackThumbnailUrl, setFallbackThumbnailUrl] = useState(thumbnailUrl);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const [lottieJson, setLottieJson] = useState<string | null>(null);

  useEffect(() => {
    const loadAndDecompressTgs = async () => {
      try {
        const response = await fetch(stickerUrl);
        if (!response.body) return;

        // .tgs files are just GZipped Lottie JSON.
        // We unpack it on the fly using the browser's native DecompressionStream
        const decompressionStream = new DecompressionStream('gzip');
        const decompressed = response.body.pipeThrough(decompressionStream);
        
        // Convert the unpacked stream into a JSON string
        const jsonText = await new Response(decompressed).text();
        setLottieJson(jsonText);
      } catch (error) {
        console.error("Failed to load or unpack TGS file:", error);
      }
    }

    loadAndDecompressTgs();
  }, [stickerUrl]);

  if (failed || !lottieJson) {
    if (fallbackThumbnailUrl && !thumbnailFailed) {
      return (
        <Image
          width={50}
          height={50}
          src={fallbackThumbnailUrl}
          unoptimized
          alt={`${stickerSetTitle} sticker ${index}`}
          className={className}
          onError={() => setThumbnailFailed(true)}
        />
      );
    }
    return (
      <div className={`${className} flex items-center justify-center text-center text-xs text-muted-foreground`}>
        Sticker unavailable
      </div>
    );
  }

  return (
    <div className={`${className} relative`} aria-busy={loading}>
      <DotLottieReact
        data={lottieJson}
        autoplay
        loop
        style={{ width: '100%', height: '100%' }}
        onLoad={() => setLoading(false)}
        onError={() => setFailed(true)}
      />
      {!lottieJson && (
        <Loader2Icon
          className="absolute inset-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 animate-spin"
          aria-label={`Loading sticker ${index}`}
        />
      )}
    </div>
  );
};

const VideoSticker = ({
  sticker,
  index,
  stickerSetTitle,
  stickerUrl,
  thumbnailUrl,
  className,
}: {
  sticker: Sticker,
  index: number,
  stickerSetTitle: string,
  stickerUrl: string,
  thumbnailUrl?: string,
  className: string,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [sourceUrl, setSourceUrl] = useState(stickerUrl);
  const [fallbackThumbnailUrl, setFallbackThumbnailUrl] = useState(thumbnailUrl);
  const [retryCount, setRetryCount] = useState(0);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);

  useEffect(() => {
    setSourceUrl(stickerUrl);
    setFallbackThumbnailUrl(thumbnailUrl);
    setRetryCount(0);
    setFailed(false);
    setLoading(true);
    setThumbnailFailed(false);
  }, [stickerUrl, thumbnailUrl]);

  useEffect(() => {
    videoRef.current?.load();
  }, [sourceUrl]);

  useEffect(() => {
    if (thumbnailUrl || !sticker.thumbnail?.file_id) return;

    let cancelled = false;
    fetch(`/api/sticker-set/get-sticker?file-id=${sticker.thumbnail.file_id}`)
      .then(async (response) => {
        if (response.ok && !cancelled) {
          setFallbackThumbnailUrl(await response.text());
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [sticker.thumbnail?.file_id, thumbnailUrl]);

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

  const handleError = () => {
    setLoading(true);
    if (retryCount < MAX_VIDEO_RETRIES) {
      setRetryCount((count) => count + 1);
      return;
    }

    setFailed(true);
  };

  if (failed) {
    if (fallbackThumbnailUrl && !thumbnailFailed) {
      return (
        <Image
          width={50}
          height={50}
          src={fallbackThumbnailUrl}
          unoptimized
          alt={`${stickerSetTitle} sticker ${index}`}
          className={className}
          onError={() => setThumbnailFailed(true)}
        />
      );
    }
    return (
      <div className={`${className} flex items-center justify-center text-center text-xs text-muted-foreground`}>
        Sticker unavailable
      </div>
    );
  }

  return (
    <div className={`${className} relative`} aria-busy={loading}>
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
        onLoadStart={() => setLoading(true)}
        onCanPlay={() => setLoading(false)}
        aria-label={`${stickerSetTitle} sticker ${index}`}
        className="h-full w-full object-contain"
      />
      {loading && (
        <Loader2Icon
          className="absolute inset-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 animate-spin"
          aria-label={`Loading sticker ${index}`}
        />
      )}
    </div>
  );
};

export const RenderSticker = ({
  sticker,
  index,
  stickerSetTitle,
  stickerUrl,
  thumbnailUrl,
  className,
}: {
  sticker: Sticker,
  index: number,
  stickerSetTitle: string,
  stickerUrl: string,
  thumbnailUrl?: string,
  className: string,
}) => {
  if (sticker.is_video) {
    return <VideoSticker
      sticker={sticker}
      index={index}
      stickerSetTitle={stickerSetTitle}
      stickerUrl={stickerUrl}
      thumbnailUrl={thumbnailUrl}
      className={className}
    />;
  }
  if (sticker.is_animated) {
    return <AnimatedSticker
      sticker={sticker}
      index={index}
      stickerSetTitle={stickerSetTitle}
      stickerUrl={stickerUrl}
      thumbnailUrl={thumbnailUrl}
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
        <DialogTitle className="flex flex-row content-center justify-center text-lg gap-1 font-semibold">
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
              <div className="w-26 h-26 flex justify-center items-center">
                <Loader2Icon className="animate-spin w-8 h-8" aria-label={`Loading sticker ${index + 1}`} />
              </div>
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
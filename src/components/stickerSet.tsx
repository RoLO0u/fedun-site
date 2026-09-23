"use client";

import { 
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "./ui/dialog";
import { Button } from "./ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "./ui/popover";
import { StickerSet, Sticker } from "@/types/telegram";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { Loader2Icon, MoveIcon } from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const MAX_VIDEO_RETRIES = 3;

const AnimatedSticker = ({
  index,
  stickerSetTitle,
  stickerUrl,
  thumbnailUrl,
  className,
}: {
  index: number,
  stickerSetTitle: string,
  stickerUrl: string,
  thumbnailUrl?: string,
  className: string,
}) => {
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
    if (thumbnailUrl && !thumbnailFailed) {
      return (
        <Image
          width={50}
          height={50}
          src={thumbnailUrl}
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

const SortableSticker = ({
  id,
  sticker,
  index,
  stickerSetTitle,
  stickerUrl,
}: {
  id: string,
  sticker: Sticker,
  index: number,
  stickerSetTitle: string,
  stickerUrl: string,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      {...attributes}
      {...listeners}
      className="touch-none cursor-grab active:cursor-grabbing"
    >
      <RenderSticker
        sticker={sticker}
        index={index}
        stickerSetTitle={stickerSetTitle}
        stickerUrl={stickerUrl}
        className="pointer-events-none aspect-square w-26 object-contain"
      />
    </div>
  );
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
  const [stickerItems, setStickerItems] = useState<Array<{ sticker: Sticker, url: string }>>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updateStickerPositions = async (oldPosition: number, newPosition: number) => {
    const sticker = stickerItems[oldPosition].sticker;
    try {
      const response = await fetch(`/api/sticker-set/set-position?sticker-id=${sticker.file_id}&position=${newPosition}`);
      if (!response.ok) {
        console.error(`Failed to set position for sticker ${sticker.file_id}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error setting position for sticker ${sticker.file_id}:`, error);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over?.id) {
      await updateStickerPositions(
        stickerItems.findIndex((item) => item.sticker.file_id === active.id),
        stickerItems.findIndex((item) => item.sticker.file_id === over.id)
      );
      setStickerItems((items) => {
        const oldIndex = items.findIndex((item) => item.sticker.file_id === active.id);
        const newIndex = items.findIndex((item) => item.sticker.file_id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  useEffect(() => {
    if (!open) return;

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
  }, [open, stickerSet.stickers]);

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex flex-row content-center justify-center items-center text-lg gap-1 font-semibold">
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
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={stickerItems.map(({ sticker }) => sticker.file_id)} strategy={rectSortingStrategy}>
          <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4 flex flex-wrap justify-center items-center gap-2">
            {stickerItems.map(({ sticker, url }, index) => (
              url ?
                <SortableSticker
                  key={sticker.file_id}
                  id={sticker.file_id}
                  sticker={sticker}
                  index={index + 1}
                  stickerSetTitle={stickerSet.title}
                  stickerUrl={url}
                />
                :
                <div key={sticker.file_id} className="flex h-26 w-26 items-center justify-center">
                  <Loader2Icon className="h-8 w-8 animate-spin" aria-label={`Loading sticker ${index + 1}`} />
                </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <DialogFooter className="flex flex-row justify-center items-center gap-2">
        <Popover>
          <PopoverTrigger className="hover:cursor-help">
            <MoveIcon className="h-5 w-5" aria-label="Drag to reorder stickers" />
          </PopoverTrigger>
          <PopoverContent>
            Drag and drop the stickers to reorder them. The new order will be saved automatically.
          </PopoverContent>
        </Popover>
        <DialogClose asChild>
          <Button>Close</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
}
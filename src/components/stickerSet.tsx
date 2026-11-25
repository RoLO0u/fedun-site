"use client";

import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "./ui/popover";
import { Skeleton } from "./ui/skeleton";
import { StickerSet, Sticker } from "@/types/telegram";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import {
  CheckIcon,
  Loader2Icon,
  DownloadIcon,
  MoreHorizontalIcon,
  MoveIcon,
  PencilIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { StickerEmojiInput, parseStickerEmojiList } from "./stickerEmojiInput";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
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
import Link from "next/link";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "./ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const MAX_VIDEO_RETRIES = 3;

const AnimatedSticker = ({
  index,
  stickerSetTitle,
  stickerUrl,
  thumbnailUrl,
  className,
  onThumbnailSourceReady,
}: {
  index: number,
  stickerSetTitle: string,
  stickerUrl: string,
  thumbnailUrl?: string,
  className: string,
  onThumbnailSourceReady?: (source: HTMLCanvasElement | HTMLImageElement | null) => void,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const [lottieJson, setLottieJson] = useState<string | null>(null);

  useEffect(() => {
    const loadAndDecompressTgs = async () => {
      try {
        const response = await fetch(stickerUrl);
        if (!response.ok) {
          throw new Error(`Could not load the sticker (${response.status}).`);
        }

        const compressed = await response.arrayBuffer();
        const bytes = new Uint8Array(compressed);
        const isGzip = bytes[0] === 0x1f && bytes[1] === 0x8b;
        const jsonText = isGzip
          ? await new Response(
              new Blob([compressed]).stream().pipeThrough(
                new DecompressionStream("gzip"),
              ),
            ).text()
          : new TextDecoder().decode(compressed);
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
          onLoad={(event) => onThumbnailSourceReady?.(event.currentTarget)}
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
    <div ref={containerRef} className={`${className} relative`} aria-busy={loading}>
      <DotLottieReact
        data={lottieJson}
        autoplay
        loop
        style={{ width: '100%', height: '100%' }}
        onLoad={() => {
          setLoading(false);
          onThumbnailSourceReady?.(
            containerRef.current?.querySelector("canvas") ?? null,
          );
        }}
        onError={() => {
          setFailed(true);
          onThumbnailSourceReady?.(null);
        }}
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
  onThumbnailSourceReady,
}: {
  sticker: Sticker,
  index: number,
  stickerSetTitle: string,
  stickerUrl: string,
  thumbnailUrl?: string,
  className: string,
  onThumbnailSourceReady?: (source: HTMLVideoElement | HTMLImageElement | null) => void,
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
    onThumbnailSourceReady?.(null);
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
          onLoad={(event) => onThumbnailSourceReady?.(event.currentTarget)}
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
        onCanPlay={(event) => {
          setLoading(false);
          onThumbnailSourceReady?.(event.currentTarget);
        }}
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
  onThumbnailSourceReady,
}: {
  sticker: Sticker,
  index: number,
  stickerSetTitle: string,
  stickerUrl: string,
  thumbnailUrl?: string,
  className: string,
  onThumbnailSourceReady?: (
    source: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement | null,
  ) => void,
}) => {
  if (sticker.is_video) {
    return <VideoSticker
      sticker={sticker}
      index={index}
      stickerSetTitle={stickerSetTitle}
      stickerUrl={stickerUrl}
      thumbnailUrl={thumbnailUrl}
      className={className}
      onThumbnailSourceReady={onThumbnailSourceReady}
    />;
  }
  if (sticker.is_animated) {
    return <AnimatedSticker
      index={index}
      stickerSetTitle={stickerSetTitle}
      stickerUrl={stickerUrl}
      thumbnailUrl={thumbnailUrl}
      className={className}
      onThumbnailSourceReady={onThumbnailSourceReady}
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
  onDeleteSticker,
  selectionMode,
  isSelected,
  onStartSelection,
  onSelectionChange,
  onClearSelection,
  onSetStickerEmojiList,
}: {
  id: string,
  sticker: Sticker,
  index: number,
  stickerSetTitle: string,
  stickerUrl: string,
  onDeleteSticker?: (sticker: Sticker) => Promise<boolean>,
  selectionMode: boolean,
  isSelected: boolean,
  onStartSelection: (stickerId: string) => void,
  onSelectionChange: (stickerId: string, selected: boolean) => void,
  onClearSelection: () => void,
  onSetStickerEmojiList?: (sticker: Sticker, emojiList: string[]) => Promise<boolean>,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id, disabled: selectionMode });
  const initialEmojiList = sticker.emoji || "😀";
  const [emojiListText, setEmojiListText] = useState(initialEmojiList);
  const [emojiSaveStatus, setEmojiSaveStatus] = useState<"saved" | "saving" | "error" | "invalid">("saved");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [emojiDialogOpen, setEmojiDialogOpen] = useState(false);
  const lastSavedEmojiList = useRef(initialEmojiList);
  const hasActions = Boolean(onDeleteSticker || onSetStickerEmojiList);
  const fileExtension = sticker.is_video ? "webm" : sticker.is_animated ? "tgs" : "webp";
  const downloadFileName = `sticker-${index}.${fileExtension}`;

  useEffect(() => {
    if (!onSetStickerEmojiList) return;
    if (emojiListText === lastSavedEmojiList.current) {
      setEmojiSaveStatus("saved");
      return;
    }

    const emojiList = parseStickerEmojiList(emojiListText);
    if (emojiList.length < 1 || emojiList.length > 20) {
      setEmojiSaveStatus("invalid");
      return;
    }

    setEmojiSaveStatus("saving");
    const timeout = window.setTimeout(async () => {
      const saved = await onSetStickerEmojiList(sticker, emojiList);
      if (saved) {
        lastSavedEmojiList.current = emojiListText;
        setEmojiSaveStatus("saved");
      } else {
        setEmojiSaveStatus("error");
      }
    }, 600);

    return () => window.clearTimeout(timeout);
  }, [emojiListText, onSetStickerEmojiList, sticker]);

  const deleteSticker = async () => {
    if (!onDeleteSticker) return;
    setIsDeleting(true);
    try {
      const deleted = await onDeleteSticker(sticker);
      if (deleted) setDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const stickerPreview = (
    <div
      {...attributes}
      {...listeners}
      aria-label={
        selectionMode
          ? `Select sticker ${index} from ${stickerSetTitle}`
          : `Sticker ${index} from ${stickerSetTitle}, drag to reorder`
      }
      aria-pressed={selectionMode ? isSelected : undefined}
      className={selectionMode ? "cursor-pointer" : "touch-none cursor-grab active:cursor-grabbing"}
      onClick={() => {
        if (selectionMode) onSelectionChange(sticker.file_id, !isSelected);
      }}
      onKeyDownCapture={(event) => {
        if (selectionMode && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          event.stopPropagation();
          onSelectionChange(sticker.file_id, !isSelected);
        }
      }}
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

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={hasActions
        ? `relative flex w-32 flex-col items-center gap-1 rounded-md border p-1 ${isSelected ? "border-primary bg-primary/5" : ""}`
        : ""}
    >
      {selectionMode && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelectionChange(sticker.file_id, checked === true)}
          aria-label={`Select sticker ${index}`}
          className="absolute left-2 top-2 z-10 bg-background shadow-sm"
        />
      )}
      {hasActions ? (
        <ContextMenu>
          <ContextMenuTrigger asChild>{stickerPreview}</ContextMenuTrigger>
          <ContextMenuContent>
            {selectionMode ? (
              <ContextMenuItem onSelect={onClearSelection}>
                <XIcon />
                Clear selection
              </ContextMenuItem>
            ) : (
              <ContextMenuItem onSelect={() => onStartSelection(sticker.file_id)}>
                <CheckIcon />
                Select multiple
              </ContextMenuItem>
            )}
            <ContextMenuItem asChild>
              <a href={stickerUrl} download={downloadFileName}>
                <DownloadIcon />
                Download sticker
              </a>
            </ContextMenuItem>
            {onSetStickerEmojiList && (
              <ContextMenuItem onSelect={() => setEmojiDialogOpen(true)}>
                <PencilIcon />
                Edit emoji
              </ContextMenuItem>
            )}
            {onDeleteSticker && (
              <ContextMenuItem
                variant="destructive"
                onSelect={() => setDeleteDialogOpen(true)}
              >
                <Trash2Icon />
                Delete sticker
              </ContextMenuItem>
            )}
          </ContextMenuContent>
        </ContextMenu>
      ) : (
        stickerPreview
      )}
      {hasActions && (
        <div className="absolute right-0 top-0 md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="size-8 shadow-sm"
                aria-label={`Options for sticker ${index}`}
              >
                <MoreHorizontalIcon aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {selectionMode ? (
                <DropdownMenuItem onSelect={onClearSelection}>
                  <XIcon />
                  Clear selection
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onSelect={() => onStartSelection(sticker.file_id)}>
                  <CheckIcon />
                  Select multiple
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <a href={stickerUrl} download={downloadFileName}>
                  <DownloadIcon />
                  Download sticker
                </a>
              </DropdownMenuItem>
              {onSetStickerEmojiList && (
                <DropdownMenuItem onSelect={() => setEmojiDialogOpen(true)}>
                  <PencilIcon />
                  Edit emoji
                </DropdownMenuItem>
              )}
              {onDeleteSticker && (
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setDeleteDialogOpen(true)}
                >
                  <Trash2Icon />
                  Delete sticker
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      {onSetStickerEmojiList && (
        <Dialog open={emojiDialogOpen} onOpenChange={setEmojiDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit sticker emoji</DialogTitle>
              <DialogDescription>
                Type or choose emoji. Changes are saved automatically.
              </DialogDescription>
            </DialogHeader>
            <StickerEmojiInput
              value={emojiListText}
              onChange={setEmojiListText}
              label={`Emoji list for sticker ${index}`}
            />
            <p className="min-h-4 text-xs text-muted-foreground" aria-live="polite">
              {emojiSaveStatus === "saving"
                ? "Saving…"
                : emojiSaveStatus === "error"
                  ? "Could not save emoji."
                  : emojiSaveStatus === "invalid"
                    ? "Enter 1–20 emoji."
                    : "Emoji saved"}
            </p>
            <DialogFooter>
              <Button type="button" onClick={() => setEmojiDialogOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {onDeleteSticker && (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this sticker?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes the sticker from “{stickerSetTitle}”. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <Button
                type="button"
                variant="destructive"
                disabled={isDeleting}
                onClick={() => void deleteSticker()}
              >
                {isDeleting ? "Deleting…" : "Delete sticker"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export const StickerSetSortable = ({
  stickerSet,
  stickerItems,
  setStickerItems,
  onDeleteSticker,
  onDeleteStickers,
  onSetStickerEmojiList,
}: {
  stickerSet: StickerSet,
  stickerItems: Array<{ sticker: Sticker, url: string }>,
  setStickerItems: React.Dispatch<React.SetStateAction<Array<{ sticker: Sticker, url: string }>>>,
  onDeleteSticker?: (sticker: Sticker) => Promise<boolean>,
  onDeleteStickers?: (stickers: Sticker[]) => Promise<boolean>,
  onSetStickerEmojiList?: (sticker: Sticker, emojiList: string[]) => Promise<boolean>,
}) => {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedStickerIds, setSelectedStickerIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const selectedStickers = stickerItems
    .map(({ sticker }) => sticker)
    .filter((sticker) => selectedStickerIds.has(sticker.file_id));
  const allStickersSelected =
    stickerItems.length > 0 && selectedStickers.length === stickerItems.length;

  const clearSelection = () => {
    setSelectionMode(false);
    setSelectedStickerIds(new Set());
  };

  const toggleSelectAll = () => {
    if (allStickersSelected) {
      clearSelection();
      return;
    }

    setSelectedStickerIds(new Set(stickerItems.map(({ sticker }) => sticker.file_id)));
  };

  const toggleStickerSelection = (stickerId: string, selected: boolean) => {
    const nextSelection = new Set(selectedStickerIds);
    if (selected) {
      nextSelection.add(stickerId);
    } else {
      nextSelection.delete(stickerId);
    }

    setSelectedStickerIds(nextSelection);
    if (nextSelection.size === 0) setSelectionMode(false);
  };

  const startSelectionWithSticker = (stickerId: string) => {
    setSelectionMode(true);
    setSelectedStickerIds(new Set([stickerId]));
  };

  const deleteSelectedStickers = async () => {
    if (!onDeleteStickers || selectedStickers.length === 0) return;

    setIsBulkDeleting(true);
    try {
      const allDeleted = await onDeleteStickers(selectedStickers);
      setBulkDeleteOpen(false);
      if (allDeleted) clearSelection();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete selected stickers.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const updateStickerPositions = async (oldPosition: number, newPosition: number) => {
    const sticker = stickerItems[oldPosition].sticker;
    try {
      const response = await fetch("/api/sticker-set/set-position", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setName: stickerSet.name,
          stickerId: sticker.file_id,
          position: newPosition,
        }),
      });
      if (response.status !== 200) {
        console.error(`Failed to set position for sticker ${sticker.file_id}: ${response.statusText}`);
        return false;
      }
      return true;
    } catch (error) {
      console.error(`Error setting position for sticker ${sticker.file_id}:`, error);
      return false;
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over?.id) {
      const oldIndex = stickerItems.findIndex((item) => item.sticker.file_id === active.id);
      const newIndex = stickerItems.findIndex((item) => item.sticker.file_id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      setStickerItems((items) => {
        return arrayMove(items, oldIndex, newIndex);
      });
      if (await updateStickerPositions(oldIndex, newIndex)) {
        toast.success("Sticker order was successfully changed.");
        return;
      }
      toast.error("Failed to update sticker order. You can use built-in Telegram features to reorder stickers.");
    }
  };

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {onDeleteStickers && stickerItems.length > 0 && (
          <div className="mb-3 flex w-full flex-wrap items-center justify-between gap-2">
            {selectionMode ? (
              <>
                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" size="sm" onClick={toggleSelectAll}>
                    {allStickersSelected ? "Deselect all" : "Select all"}
                  </Button>
                  <span className="text-sm text-muted-foreground" aria-live="polite">
                    {selectedStickers.length} selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={clearSelection}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={selectedStickers.length === 0 || isBulkDeleting}
                    onClick={() => setBulkDeleteOpen(true)}
                  >
                    <Trash2Icon aria-hidden="true" />
                    Delete selected
                  </Button>
                </div>
              </>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectionMode(true)}
              >
                Select multiple
              </Button>
            )}
          </div>
        )}
        <SortableContext items={stickerItems.map(({ sticker }) => sticker.file_id)} strategy={rectSortingStrategy}>
          <div className="-mx-4 px-4 flex flex-wrap justify-center items-start gap-2">
            {stickerItems.length ? stickerItems.map(({ sticker, url }, index) => (
              url ?
                <SortableSticker
                  key={sticker.file_id}
                  id={sticker.file_id}
                  sticker={sticker}
                  index={index + 1}
                  stickerSetTitle={stickerSet.title}
                  stickerUrl={url}
                  onDeleteSticker={onDeleteSticker}
                  selectionMode={selectionMode}
                  isSelected={selectedStickerIds.has(sticker.file_id)}
                  onStartSelection={startSelectionWithSticker}
                  onSelectionChange={toggleStickerSelection}
                  onClearSelection={clearSelection}
                  onSetStickerEmojiList={
                    stickerSet.sticker_type === "mask"
                      ? undefined
                      : onSetStickerEmojiList
                  }
                />
                :
                <div key={sticker.file_id} className="flex h-26 w-26 items-center justify-center">
                  <Loader2Icon className="h-8 w-8 animate-spin" aria-label={`Loading sticker ${index + 1}`} />
                </div>
            )) :
              Array.from({ length: 16 }).map((_, i) => (
                <Skeleton key={i} className="h-26 w-26" />
              ))
            }
          </div>
        </SortableContext>
      </DndContext>
      {onDeleteStickers && (
        <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete {selectedStickers.length}{" "}
                {selectedStickers.length === 1 ? "sticker" : "stickers"}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This removes the selected stickers from “{stickerSet.title}”. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isBulkDeleting}>Cancel</AlertDialogCancel>
              <Button
                type="button"
                variant="destructive"
                disabled={selectedStickers.length === 0 || isBulkDeleting}
                onClick={() => void deleteSelectedStickers()}
              >
                {isBulkDeleting ? "Deleting…" : "Delete selected"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
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
      <StickerSetSortable
        stickerSet={stickerSet}
        stickerItems={stickerItems}
        setStickerItems={setStickerItems}
      />
      <DialogFooter className="flex flex-row justify-center items-center gap-2">
        <Popover>
          <PopoverTrigger className="flex flex-row gap-1 items-center underline decoration-dashed decoration-1">
            Reorder
            <MoveIcon className="h-4 w-4" aria-label="Drag to reorder stickers" />
          </PopoverTrigger>
          <PopoverContent>
            Drag and drop the stickers to reorder them. The new order will be saved automatically.
          </PopoverContent>
        </Popover>
        <Button asChild variant="outline">
          <Link href={`/sticker-sets/${stickerSet.name}`}>Edit</Link>
        </Button>
        <DialogClose asChild>
          <Button>Close</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
}
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import type { Sticker, StickerSet } from "@/types/telegram";
import { RenderSticker, StickerSetSortable } from "@/components/stickerSet";
import { Button } from "@/components/ui/button";
import { StickerEmojiInput, parseStickerEmojiList } from "@/components/stickerEmojiInput";
import {
  StickerUpload,
  createStickerThumbnailFile,
} from "@/components/stickerUpload";
import { convertImageToTgs } from "@/lib/imageToTgs";
import {
  convertImageToWebm,
  convertStickerVideoToWebm,
} from "@/lib/imageToWebm";
import { toast } from "sonner";
import {
  ImagePlusIcon,
  Loader2Icon,
  MouseRightIcon,
  MoveIcon,
  SmartphoneIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStickerSetsLayout } from "@/components/stickerSetsLayout";

const validateStickerFile = async (file: File, stickerType: string) => {
  const extension = file.name.toLowerCase().split(".").pop();
  const maxSizeByExtension: Record<string, number> = {
    png: 512 * 1024,
    webp: 512 * 1024,
    tgs: 64 * 1024,
    webm: 256 * 1024,
  };
  const maxSize = extension ? maxSizeByExtension[extension] : undefined;
  if (!maxSize) {
    throw new Error("Choose a PNG, WEBP, TGS, or WEBM sticker file.");
  }

  const validateDimensions = (width: number, height: number) => {
    if (stickerType === "custom_emoji") {
      if (width !== 100 || height !== 100) {
        throw new Error("Custom emoji stickers must be 100×100 pixels.");
      }
    } else if (width > 512 || height > 512 || (width !== 512 && height !== 512)) {
      throw new Error(
        "Sticker dimensions must be at most 512×512 pixels, with one side exactly 512 pixels.",
      );
    }
  };

  if (extension === "webm") {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = objectUrl;
    try {
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error("Could not read WEBM video metadata."));
      });
      validateDimensions(video.videoWidth, video.videoHeight);
      if (!Number.isFinite(video.duration) || video.duration > 3) {
        throw new Error("Video stickers must be no longer than 3 seconds. Trim the video before upload.");
      }
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  if (file.size > maxSize) {
    throw new Error(`This file exceeds Telegram's ${Math.round(maxSize / 1024)} KB limit.`);
  }

  if (extension === "png" || extension === "webp") {
    const bitmap = await createImageBitmap(file);
    try {
      validateDimensions(bitmap.width, bitmap.height);
    } finally {
      bitmap.close();
    }
  }
};

const getThumbnailActionErrorMessage = (error: unknown) => {
  if (!(error instanceof Error)) {
    if (typeof error === "string" && error.trim()) return error;
    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string"
    ) {
      return error.message;
    }
    return "Could not update the thumbnail. See the browser console for details.";
  }
  if (error.message.includes("STICKER_THUMB_VIDEO_BIG")) {
    return "This video sticker exceeds Telegram's 32 KB thumbnail limit. Choose a smaller sticker or upload a compatible WEBM.";
  }
  if (error.message.includes("STICKER_THUMB_ANIMATED_BIG")) {
    return "This animated sticker exceeds Telegram's 32 KB thumbnail limit. Choose a smaller sticker or upload a compatible TGS.";
  }
  if (error.message.includes("STICKER_THUMB_WEBM_DIMENSIONS")) {
    return "Telegram requires WEBM sticker-set thumbnails to be exactly 100×100 pixels. Upload a 100×100 WEBM thumbnail.";
  }
  return error.message;
};

const createStickerFrameFile = async (
  source: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement,
  size: number,
) => {
  const sourceWidth =
    source instanceof HTMLVideoElement
      ? source.videoWidth
      : source instanceof HTMLImageElement
        ? source.naturalWidth
        : source.width;
  const sourceHeight =
    source instanceof HTMLVideoElement
      ? source.videoHeight
      : source instanceof HTMLImageElement
        ? source.naturalHeight
        : source.height;
  if (
    !sourceWidth ||
    !sourceHeight ||
    (source instanceof HTMLImageElement && !source.complete) ||
    (source instanceof HTMLVideoElement && source.readyState < HTMLMediaElement.HAVE_CURRENT_DATA)
  ) {
    throw new Error("Wait for the sticker preview to load, then try again.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) {
    throw new Error("Could not prepare the sticker thumbnail.");
  }

  const scale = Math.min(size / sourceWidth, size / sourceHeight);
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;
  context.drawImage(
    source,
    (size - width) / 2,
    (size - height) / 2,
    width,
    height,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error("Could not capture the sticker preview."));
    }, "image/png");
  });
  return new File([blob], "sticker-frame.png", { type: "image/png" });
};

const StickerSetPage = () => {
  const { setName } = useParams<{ setName: string }>();
  const [stickerSet, setStickerSet] = useState<StickerSet | null>(null);
  const [stickerItems, setStickerItems] = useState<Array<{ sticker: Sticker; url: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [stickerFile, setStickerFile] = useState<File | null>(null);
  const [newStickerEmojis, setNewStickerEmojis] = useState("😀");
  const {
    data: stickerSetsData,
    isAddStickerDialogOpen,
    setIsAddStickerDialogOpen,
    refreshStickerSets,
  } = useStickerSetsLayout();
  const [isThumbnailDialogOpen, setIsThumbnailDialogOpen] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isSavingThumbnail, setIsSavingThumbnail] = useState(false);
  const [thumbnailPreparationStatus, setThumbnailPreparationStatus] = useState<
    "preparing" | "server" | "uploading" | null
  >(null);
  const thumbnailSources = useRef(
    new Map<string, HTMLCanvasElement | HTMLImageElement | HTMLVideoElement>(),
  );

  const loadStickerSet = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/sticker-set/get-set?setName=${encodeURIComponent(setName)}`,
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Failed to load sticker set (${response.status}).`);
      }
      setStickerSet(data);
      setError(null);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Failed to load sticker set.";
      setError(message);
      console.error(loadError);
    }
  }, [setName]);

  useEffect(() => {
    void loadStickerSet();
  }, [loadStickerSet]);

  useEffect(() => {
    if (!stickerSet) return;

    const fetchStickerUrls = async () => {
      const items = await Promise.all(
        stickerSet.stickers.map(async (sticker) => {
          const response = await fetch(
            `/api/sticker-set/get-sticker?file-id=${encodeURIComponent(sticker.file_id)}`,
          );
          if (!response.ok) {
            console.error(`Failed to fetch sticker file: ${response.statusText}`);
            return { sticker, url: "" };
          }
          return { sticker, url: await response.text() };
        }),
      );
      setStickerItems(items);
    };

    void fetchStickerUrls();
  }, [stickerSet]);

  const postJsonAction = async (
    url: string,
    body: Record<string, unknown>,
    successMessage?: string,
    reloadAfterAction = true,
  ): Promise<boolean> => {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || `Request failed (${response.status}).`);
      }
      if (successMessage) toast.success(successMessage);
      if (reloadAfterAction) await loadStickerSet();
      return true;
    } catch (actionError) {
      toast.error(actionError instanceof Error ? actionError.message : "Sticker set update failed.");
      return false;
    }
  };

  const handleAddSticker = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stickerSet || !stickerFile) {
      toast.error("Choose a sticker file first.");
      return;
    }

    const emojiList = parseStickerEmojiList(newStickerEmojis);
    if (emojiList.length < 1 || emojiList.length > 20) {
      toast.error("Enter between 1 and 20 emoji, separated by commas or spaces.");
      return;
    }

    setIsAdding(true);
    try {
      await validateStickerFile(stickerFile, stickerSet.sticker_type);
      const formData = new FormData();
      formData.set("setName", setName);
      formData.set("emojiList", JSON.stringify(emojiList));
      formData.set("sticker", stickerFile);
      const response = await fetch("/api/sticker-set/add-sticker", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || `Upload failed (${response.status}).`);
      }

      toast.success("Sticker added to the set.");
      setStickerFile(null);
      setNewStickerEmojis("😀");
      setIsAddStickerDialogOpen(false);
      await loadStickerSet();
    } catch (addError) {
      toast.error(addError instanceof Error ? addError.message : "Could not add sticker.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteStickers = async (stickers: Sticker[]) => {
    let deletedCount = 0;
    for (const sticker of stickers) {
      const deleted = await postJsonAction(
        "/api/sticker-set/delete-sticker",
        { setName, stickerId: sticker.file_id },
        undefined,
        false,
      );
      if (deleted) deletedCount += 1;
    }

    await loadStickerSet();
    if (deletedCount > 0) {
      toast.success(`${deletedCount} sticker${deletedCount === 1 ? "" : "s"} deleted.`);
    }
    return deletedCount === stickers.length;
  };

  if (error) {
    return (
      <div className="flex grow flex-col items-center justify-center py-10">
        <h1 className="text-2xl font-bold">Could not load sticker set</h1>
        <p className="mt-2 text-center text-muted-foreground">{error}</p>
        <Button className="mt-4" variant="outline" onClick={() => void loadStickerSet()}>
          Try again
        </Button>
      </div>
    );
  }

  if (!stickerSet) {
    return (
      <div className="flex grow flex-col items-center justify-center py-10">
        <h1 className="text-2xl font-bold">Loading sticker set…</h1>
      </div>
    );
  }

  const stickerLimit = stickerSet.sticker_type === "custom_emoji" ? 200 : 120;
  const stickerLimitReached = stickerSet.stickers.length >= stickerLimit;
  const thumbnailIndex =
    stickerSetsData?.stickerSets.findIndex((set) => set.name === stickerSet.name) ?? -1;
  const thumbnail =
    thumbnailIndex >= 0 ? stickerSetsData?.thumbnails[thumbnailIndex] : null;
  const displayTitle =
    thumbnailIndex >= 0
      ? stickerSetsData?.stickerSets[thumbnailIndex]?.title ?? stickerSet.title
      : stickerSet.title;
  const firstSticker = stickerSet.stickers[0];
  const thumbnailFormat = firstSticker?.is_video
    ? "video"
    : firstSticker?.is_animated
      ? "animated"
      : "static";
  const allowedThumbnailExtensions =
    thumbnailFormat === "static"
      ? ["png", "jpg", "jpeg", "webp"]
      : thumbnailFormat === "animated"
      ? ["tgs", "png", "jpg", "jpeg", "webp"]
      : ["webm", "png", "jpg", "jpeg", "webp"];

  const saveThumbnail = async (thumbnail: File | { stickerId: string }) => {
    const formData = new FormData();
    formData.set("setName", setName);
    if (thumbnail instanceof File) {
      formData.set("thumbnail", thumbnail);
    } else {
      formData.set("stickerId", thumbnail.stickerId);
    }

    const response = await fetch("/api/sticker-set/set-thumbnail", {
      method: "POST",
      body: formData,
    });
    const result: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        result &&
        typeof result === "object" &&
        "error" in result &&
        typeof result.error === "string"
          ? result.error
          : `Thumbnail update failed (${response.status}).`;
      throw new Error(message);
    }

    toast.success("Sticker set thumbnail updated.");
    setThumbnailFile(null);
    setIsThumbnailDialogOpen(false);
    await loadStickerSet();
    try {
      await refreshStickerSets();
    } catch (refreshError) {
      console.error("Could not refresh sticker set thumbnails:", refreshError);
      toast.error("Thumbnail updated, but the sidebar could not refresh. Reload the page.");
    }
  };

  const handleThumbnailUpload = async () => {
    if (!thumbnailFile) return;
    setIsSavingThumbnail(true);
    try {
      await saveThumbnail(thumbnailFile);
    } catch (thumbnailError) {
      toast.error(getThumbnailActionErrorMessage(thumbnailError));
    } finally {
      setIsSavingThumbnail(false);
    }
  };

  const handleUseExistingSticker = async (url: string, sticker: Sticker) => {
    setIsSavingThumbnail(true);
    try {
      if (thumbnailFormat !== "static") {
        const canUseStickerDirectly =
          sticker.width === 100 &&
          sticker.height === 100 &&
          sticker.file_size !== undefined &&
          sticker.file_size <= 32 * 1024;
        if (!canUseStickerDirectly) {
          setThumbnailPreparationStatus("preparing");
          if (thumbnailFormat === "video" && sticker.is_video) {
            const file = await convertStickerVideoToWebm(url, (status) => {
              setThumbnailPreparationStatus(status);
            });
            setThumbnailPreparationStatus("uploading");
            await saveThumbnail(file);
            return;
          }

          const source = thumbnailSources.current.get(sticker.file_id);
          if (!source) {
            throw new Error("Wait for the sticker preview to load, then try again.");
          }
          const size = 100;
          const frame = await createStickerFrameFile(source, size);
          const file =
            thumbnailFormat === "animated"
              ? await convertImageToTgs(frame, size)
              : await convertImageToWebm(frame, size, (status) => {
                  setThumbnailPreparationStatus(status);
                });
          setThumbnailPreparationStatus("uploading");
          await saveThumbnail(file);
          return;
        }
        await saveThumbnail({ stickerId: sticker.file_id });
        return;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Could not load this sticker (${response.status}).`);
      }
      const source = await response.blob();
      const file = await createStickerThumbnailFile(
        new File([source], "sticker.png", { type: source.type }),
      );
      await saveThumbnail(file);
    } catch (thumbnailError) {
      toast.error(getThumbnailActionErrorMessage(thumbnailError));
    } finally {
      setThumbnailPreparationStatus(null);
      setIsSavingThumbnail(false);
    }
  };

  return (
    <div className="flex grow flex-col items-center gap-4 py-8">
      <div className="flex flex-wrap items-center justify-center gap-3">
        {thumbnail && firstSticker && (
          <RenderSticker
            sticker={firstSticker}
            index={1}
            stickerSetTitle={displayTitle}
            stickerUrl={thumbnail}
            className="size-10 rounded-md object-cover"
          />
        )}
        <h1 className="text-2xl font-bold">{displayTitle}</h1>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsThumbnailDialogOpen(true)}
        >
          <ImagePlusIcon aria-hidden="true" />
          {thumbnail ? "Change thumbnail" : "Add thumbnail"}
        </Button>
      </div>

      <Dialog
        open={isThumbnailDialogOpen}
        onOpenChange={(open) => {
          setIsThumbnailDialogOpen(open);
          if (!open) {
            setThumbnailFile(null);
            thumbnailSources.current.clear();
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Set pack thumbnail</DialogTitle>
            <DialogDescription>
              Upload a custom thumbnail or choose one of this pack&apos;s stickers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <StickerUpload
              stickerType="custom_emoji"
              file={thumbnailFile}
              onFileChange={setThumbnailFile}
              allowedExtensions={allowedThumbnailExtensions}
              maxStaticFileSize={128 * 1024}
              maxNonImageFileSize={32 * 1024}
              fileLabel="thumbnail"
              transformImage={
                thumbnailFormat === "animated"
                  ? (file) => convertImageToTgs(file, 100)
                  : thumbnailFormat === "video"
                    ? (file) => convertImageToWebm(file, 100)
                    : undefined
              }
              processingLabel={
                thumbnailFormat === "animated"
                  ? "Tracing image and creating a TGS thumbnail…"
                  : thumbnailFormat === "video"
                    ? "Encoding image as a WEBM thumbnail…"
                    : undefined
              }
            />
            <p className="text-xs text-muted-foreground">
              {thumbnailFormat === "static"
                ? "Static images are resized to 100×100 WEBP and compressed to Telegram's 128 KB limit."
                : thumbnailFormat === "animated"
                  ? "PNG, JPG, and WEBP are traced into a still 100×100 TGS thumbnail (some detail may be simplified). TGS files must be at most 32 KB."
                  : "PNG, JPG, and WEBP are encoded as a 1-second 100×100 VP9 WEBM thumbnail. WEBM files must be at most 32 KB and match this pack's format."}
            </p>
            {thumbnailFile && (
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate">{thumbnailFile.name}</span>
                <Button
                  type="button"
                  disabled={isSavingThumbnail}
                  onClick={() => void handleThumbnailUpload()}
                >
                  {isSavingThumbnail && <Loader2Icon className="animate-spin" aria-hidden="true" />}
                  Upload thumbnail
                </Button>
              </div>
            )}
          </div>
          <div className="space-y-2 border-t pt-4">
            <h3 className="text-sm font-medium">Or choose an existing sticker</h3>
            {thumbnailPreparationStatus && (
              <p className="flex items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
                <Loader2Icon className="size-3 animate-spin" aria-hidden="true" />
                {thumbnailPreparationStatus === "server"
                  ? "Encoding the VP9 thumbnail on the server…"
                  : thumbnailPreparationStatus === "uploading"
                    ? "Uploading the thumbnail…"
                    : "Preparing the sticker frame…"}
              </p>
            )}
            {stickerItems.length ? (
              <div className="grid max-h-52 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-6">
                {stickerItems.map(({ sticker, url }, index) => {
                  const needsConversion =
                    thumbnailFormat !== "static" &&
                    (sticker.width !== 100 ||
                      sticker.height !== 100 ||
                      sticker.file_size === undefined ||
                      sticker.file_size > 32 * 1024);
                  return (
                    <Button
                      key={sticker.file_id}
                      type="button"
                      variant="outline"
                      aria-label={
                        needsConversion
                          ? `Prepare sticker ${index + 1} as the pack thumbnail`
                          : `Use sticker ${index + 1} as the pack thumbnail`
                      }
                      title={
                        needsConversion
                          ? "Convert this sticker to a compatible thumbnail"
                          : `Use sticker ${index + 1} as the pack thumbnail`
                      }
                      disabled={!url || isSavingThumbnail}
                      onClick={() => void handleUseExistingSticker(url, sticker)}
                      className="relative size-16 p-1"
                    >
                      {url ? (
                        <RenderSticker
                          sticker={sticker}
                          index={index + 1}
                          stickerSetTitle={displayTitle}
                          stickerUrl={url}
                          className="size-14 object-contain"
                          onThumbnailSourceReady={(source) => {
                            if (source) thumbnailSources.current.set(sticker.file_id, source);
                            else thumbnailSources.current.delete(sticker.file_id);
                          }}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">Unavailable</span>
                      )}
                      {needsConversion && (
                        <span className="absolute inset-x-0 bottom-0 bg-background/90 px-1 text-[9px] text-muted-foreground">
                          Will convert
                        </span>
                      )}
                    </Button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {stickerSet.stickers.length ? "Loading stickers…" : "This pack has no stickers."}
              </p>
            )}
            {thumbnailFormat !== "static" && (
              <p className="text-xs text-muted-foreground">
                Telegram requires animated and video thumbnails to be 100×100 pixels and at most 32 KB. Existing stickers are resized as needed.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddStickerDialogOpen} onOpenChange={setIsAddStickerDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add sticker</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSticker} className="flex flex-col gap-3">
            <StickerUpload
              stickerType={stickerSet.sticker_type}
              file={stickerFile}
              onFileChange={setStickerFile}
            />
            <StickerEmojiInput
              value={newStickerEmojis}
              onChange={setNewStickerEmojis}
              label="Emoji list for new sticker"
              required
            />
            <p className="text-xs text-muted-foreground">
              PNG, JPG, and WEBP images are resized and compressed to Telegram&apos;s 512 KB limit,
              then converted to WEBP automatically.
              {stickerSet.sticker_type === "custom_emoji"
                ? " Custom emoji images are fitted to 100×100 px."
                : " Regular and mask images are fitted with one side at 512 px."}
              {stickerSet.sticker_type === "custom_emoji"
                ? " Custom emoji TGS/WEBM must be 100×100 px."
                : " TGS must be 512×512 px; WEBM must have one side at 512 px."}
              {" "}TGS must be at most 64 KB, 30–60 FPS, and 3 seconds or shorter. WEBM must be at
              most 256 KB, use VP9, have no audio, and be 3 seconds or shorter. Long videos need
              to be trimmed before upload.
            </p>
            <p className="text-xs text-muted-foreground">
              {stickerSet.stickers.length} of {stickerLimit} stickers in this set.
            </p>
            <Button type="submit" disabled={isAdding || stickerLimitReached}>
              {stickerLimitReached ? "Sticker limit reached" : isAdding ? "Adding…" : "Add sticker"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <StickerSetSortable
        stickerSet={stickerSet}
        stickerItems={stickerItems}
        setStickerItems={setStickerItems}
        onDeleteSticker={(sticker) =>
          postJsonAction("/api/sticker-set/delete-sticker", {
            setName,
            stickerId: sticker.file_id,
          }, "Sticker deleted.")
        }
        onDeleteStickers={handleDeleteStickers}
        onSetStickerEmojiList={(sticker, emojiList) =>
          postJsonAction("/api/sticker-set/set-sticker-emoji", {
            setName,
            stickerId: sticker.file_id,
            emojiList,
          }, undefined, false)
        }
      />
      <div className="mt-auto grid w-full gap-x-6 gap-y-3 rounded-lg border bg-muted/30 px-5 py-4 text-sm sm:grid-cols-3">
        <div className="flex min-w-0 items-center gap-3">
          <MoveIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <p>Drag stickers to change their order.</p>
        </div>
        <div className="flex min-w-0 items-center gap-3">
          <MouseRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <p>
            Right-click a sticker to{" "}
            {stickerSet.sticker_type !== "mask" ? "edit its emoji or delete it" : "delete it"}.
            {stickerSet.sticker_type !== "mask" && " Emoji changes save automatically."}
          </p>
        </div>
        <div className="flex min-w-0 items-center gap-3">
          <SmartphoneIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <p>On touch screens, tap the sticker&apos;s options button.</p>
        </div>
      </div>
    </div>
  );
};

export default StickerSetPage;

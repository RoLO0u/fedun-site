"use client";

import { useCallback, useState } from "react";
import { type Accept, type FileRejection, useDropzone } from "react-dropzone";
import { CheckCircle2Icon, LoaderCircleIcon, UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATIC_STICKER_LIMIT = 512 * 1024;
const MAX_SOURCE_IMAGE_SIZE = 25 * 1024 * 1024;

const formatFileSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const createWebpBlob = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob || blob.type !== "image/webp") {
          reject(new Error("Your browser cannot convert images to WEBP."));
          return;
        }
        resolve(blob);
      },
      "image/webp",
      quality,
    );
  });

const createPngBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Could not prepare the image for Telegram."));
        return;
      }
      resolve(blob);
    }, "image/png");
  });

const optimizeStickerImage = async (
  file: File,
  stickerType: string,
  maxFileSize: number,
) => {
  if (file.size > MAX_SOURCE_IMAGE_SIZE) {
    throw new Error("Choose an image smaller than 25 MB.");
  }

  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    const isCustomEmoji = stickerType === "custom_emoji";
    if (isCustomEmoji) {
      canvas.width = 100;
      canvas.height = 100;
    } else {
      const scale = 512 / Math.max(bitmap.width, bitmap.height);
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
    }

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) {
      throw new Error("Could not prepare the image for Telegram.");
    }

    if (isCustomEmoji) {
      const scale = Math.min(100 / bitmap.width, 100 / bitmap.height);
      const width = Math.round(bitmap.width * scale);
      const height = Math.round(bitmap.height * scale);
      context.drawImage(
        bitmap,
        (100 - width) / 2,
        (100 - height) / 2,
        width,
        height,
      );
    } else {
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    }

    for (const quality of [0.92, 0.82, 0.72, 0.62, 0.52, 0.42, 0.32, 0.22, 0.12]) {
      let blob: Blob;
      let extension: "png" | "webp";
      try {
        blob = await createWebpBlob(canvas, quality);
        extension = "webp";
      } catch {
        blob = await createPngBlob(canvas);
        extension = "png";
        if (blob.size > maxFileSize) {
          throw new Error(
            `Your browser cannot create WEBP images, and the PNG image exceeds Telegram's ${Math.round(maxFileSize / 1024)} KB limit. Try a simpler image or another browser.`,
          );
        }
      }

      if (blob.size <= maxFileSize) {
        const baseName = file.name.replace(/\.[^.]+$/, "");
        const type = extension === "webp" ? "image/webp" : "image/png";
        return new File([blob], `${baseName}.${extension}`, {
          type,
          lastModified: Date.now(),
        });
      }
    }

    throw new Error(
      `This image could not be compressed to Telegram's ${Math.round(maxFileSize / 1024)} KB limit.`,
    );
  } finally {
    bitmap.close();
  }
};

export const createStickerThumbnailFile = (file: File) =>
  optimizeStickerImage(file, "custom_emoji", 128 * 1024);

const showDropzoneError = (
  rejections: FileRejection[],
  allowedExtensions: string[],
  fileLabel: string,
) => {
  if (rejections.length > 1) {
    toast.error(`Choose one ${fileLabel} file at a time.`);
    return;
  }
  toast.error(
    `Use a ${allowedExtensions.map((extension) => extension.toUpperCase()).join(", ")} ${fileLabel} file.`,
  );
};

export const StickerUpload = ({
  stickerType,
  file,
  onFileChange,
  allowedExtensions = ["png", "jpg", "jpeg", "webp", "tgs", "webm"],
  maxStaticFileSize = STATIC_STICKER_LIMIT,
  maxNonImageFileSize,
  fileLabel = "sticker",
  transformImage,
  processingLabel = "Resizing and compressing image…",
}: {
  stickerType: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  allowedExtensions?: string[];
  maxStaticFileSize?: number;
  maxNonImageFileSize?: number;
  fileLabel?: string;
  transformImage?: (file: File) => Promise<File>;
  processingLabel?: string;
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalSize, setOriginalSize] = useState<number | null>(null);

  const accept: Accept = {};
  const mimeTypesByExtension: Record<string, string[]> = {
    png: ["image/png"],
    jpg: ["image/jpeg"],
    jpeg: ["image/jpeg"],
    webp: ["image/webp"],
    tgs: ["application/gzip", "application/x-gzip", "application/x-tgsticker", "application/octet-stream"],
    webm: ["video/webm", "application/octet-stream"],
  };
  for (const extension of allowedExtensions) {
    for (const mimeType of mimeTypesByExtension[extension] ?? []) {
      accept[mimeType] = [...(accept[mimeType] ?? []), `.${extension}`];
    }
  }

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejections: FileRejection[]) => {
      if (rejections.length) {
        showDropzoneError(rejections, allowedExtensions, fileLabel);
        return;
      }

      const selectedFile = acceptedFiles[0];
      if (!selectedFile) return;

      onFileChange(null);
      setOriginalSize(null);
      const extension = selectedFile.name.toLowerCase().split(".").pop();
      if (!extension || !allowedExtensions.includes(extension)) {
        toast.error(
          `Use a ${allowedExtensions.map((value) => value.toUpperCase()).join(", ")} ${fileLabel} file.`,
        );
        return;
      }

      if (["png", "jpg", "jpeg", "webp"].includes(extension || "")) {
        setIsProcessing(true);
        try {
          const optimizedFile = transformImage
            ? await transformImage(selectedFile)
            : await optimizeStickerImage(
                selectedFile,
                stickerType,
                maxStaticFileSize,
              );
          onFileChange(optimizedFile);
          setOriginalSize(selectedFile.size);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Could not prepare this image.");
        } finally {
          setIsProcessing(false);
        }
        return;
      }

      if (maxNonImageFileSize && selectedFile.size > maxNonImageFileSize) {
        toast.error(
          `This ${fileLabel} exceeds the ${Math.round(maxNonImageFileSize / 1024)} KB limit.`,
        );
        return;
      }

      onFileChange(selectedFile);
    },
    [
      allowedExtensions,
      fileLabel,
      maxNonImageFileSize,
      maxStaticFileSize,
      onFileChange,
      stickerType,
      transformImage,
    ],
  );

  const { getInputProps, getRootProps, isDragActive } = useDropzone({
    accept,
    multiple: false,
    maxFiles: 1,
    maxSize: MAX_SOURCE_IMAGE_SIZE,
    onDrop,
  });

  return (
    <div
      {...getRootProps({
        "aria-label": `Choose or drop a ${fileLabel} file`,
      })}
      className={cn(
        "flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-5 text-center transition-colors",
        isDragActive
          ? "border-primary bg-primary/5 text-foreground"
          : "border-muted-foreground/30 text-muted-foreground hover:border-primary/60 hover:text-foreground",
      )}
    >
      <input {...getInputProps()} />
      {isProcessing ? (
        <LoaderCircleIcon className="size-6 animate-spin" aria-hidden="true" />
      ) : file ? (
        <CheckCircle2Icon className="size-6 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
      ) : (
        <UploadIcon className="size-6" aria-hidden="true" />
      )}
      {isProcessing ? (
        <span>{processingLabel}</span>
      ) : file ? (
        <span className="break-all">
          <span className="font-medium text-foreground">File selected</span>
          <span className="mt-1 block">{file.name} · {formatFileSize(file.size)}</span>
          {originalSize !== null && (
            <span className="mt-1 block text-xs text-muted-foreground">
              Prepared automatically: {formatFileSize(originalSize)} → {formatFileSize(file.size)}
            </span>
          )}
          <span className="mt-1 block text-xs">Click or drop another file to replace it</span>
        </span>
      ) : (
        <span>
          {isDragActive
            ? `Drop the ${fileLabel} here`
            : `Drag and drop, or click to choose a ${fileLabel}`}
        </span>
      )}
    </div>
  );
};

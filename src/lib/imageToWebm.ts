const MAX_SOURCE_SIZE = 25 * 1024 * 1024;
const MAX_VIDEO_SOURCE_SIZE = 256 * 1024;
const MAX_WEBM_SIZE = 32 * 1024;
const RECORDING_BITRATES = [160_000, 100_000, 60_000, 35_000];
const WEBM_SIGNATURE = [0x1a, 0x45, 0xdf, 0xa3];

type WebmEncoderStatus = "server";

const postToServer = async (formData: FormData, maxSize: number) => {
  const response = await fetch("/api/sticker-set/encode-thumbnail", {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    const result: unknown = await response.json().catch(() => null);
    const message =
      result &&
      typeof result === "object" &&
      "error" in result &&
      typeof result.error === "string"
        ? result.error
        : `Thumbnail encoding failed (${response.status}).`;
    throw new Error(message);
  }

  const blob = await response.blob();
  if (blob.size > maxSize) {
    throw new Error("The encoded WEBM exceeds Telegram's 32 KB thumbnail limit.");
  }
  const signature = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
  if (
    blob.type !== "video/webm" ||
    !signature.every((byte, index) => byte === [0x1a, 0x45, 0xdf, 0xa3][index])
  ) {
    throw new Error("The server returned an invalid WEBM thumbnail.");
  }
  return new File([blob], "thumbnail.webm", {
    type: "video/webm",
    lastModified: Date.now(),
  });
};

const recordCanvas = (canvas: HTMLCanvasElement, bitrate: number) =>
  new Promise<Blob>((resolve, reject) => {
    const stream = canvas.captureStream(30);
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9",
        videoBitsPerSecond: bitrate,
      });
    } catch (error) {
      stream.getTracks().forEach((track) => track.stop());
      reject(error instanceof Error ? error : new Error("Could not start VP9 encoding."));
      return;
    }

    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    recorder.onerror = () => {
      stream.getTracks().forEach((track) => track.stop());
      reject(new Error("Could not encode this image as WEBM."));
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      const file = new Blob(chunks, { type: "video/webm" });
      if (!file.size) {
        reject(new Error("The browser produced an empty WEBM thumbnail."));
        return;
      }
      resolve(file);
    };

    recorder.start(100);
    window.setTimeout(() => {
      if (recorder.state === "recording") recorder.stop();
    }, 1000);
  });

const encodeWithServer = async (
  file: File,
  canvasSize: number,
  maxSize: number,
  onStatus?: (status: WebmEncoderStatus) => void,
) => {
  onStatus?.("server");
  const formData = new FormData();
  formData.set("frame", file);
  formData.set("canvasSize", String(canvasSize));
  return postToServer(formData, maxSize);
};

export const convertStickerVideoToWebm = async (
  url: string,
  onStatus?: (status: WebmEncoderStatus) => void,
) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load this sticker video (${response.status}).`);
  }

  const blob = await response.blob();
  if (blob.size > MAX_VIDEO_SOURCE_SIZE) {
    throw new Error("This sticker video exceeds Telegram's 256 KB sticker limit.");
  }

  const signature = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
  if (!WEBM_SIGNATURE.every((byte, index) => signature[index] === byte)) {
    throw new Error("The sticker source is not a valid WEBM video.");
  }

  const formData = new FormData();
  formData.set(
    "sticker",
    new File([blob], "sticker.webm", { type: "video/webm" }),
  );
  onStatus?.("server");
  return postToServer(formData, MAX_WEBM_SIZE);
};

export const convertImageToWebm = async (
  file: File,
  canvasSize: number,
  onStatus?: (status: WebmEncoderStatus) => void,
) => {
  if (file.size > MAX_SOURCE_SIZE) {
    throw new Error("Choose an image smaller than 25 MB.");
  }

  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) {
      throw new Error("Could not prepare the image for WEBM conversion.");
    }

    const scale = Math.min(canvasSize / bitmap.width, canvasSize / bitmap.height);
    const width = bitmap.width * scale;
    const height = bitmap.height * scale;
    context.drawImage(
      bitmap,
      (canvasSize - width) / 2,
      (canvasSize - height) / 2,
      width,
      height,
    );

    if (
      typeof MediaRecorder !== "undefined" &&
      MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ) {
      try {
        for (const bitrate of RECORDING_BITRATES) {
          const blob = await recordCanvas(canvas, bitrate);
          if (blob.size <= MAX_WEBM_SIZE) {
            const baseName = file.name.replace(/\.[^.]+$/, "");
            return new File([blob], `${baseName}.webm`, {
              type: "video/webm",
              lastModified: Date.now(),
            });
          }
        }
      } catch {
        // Use the server encoder if native VP9 recording fails.
      }
    }

    return await encodeWithServer(
      new File(
        [await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Could not prepare the image for VP9 encoding."));
          }, "image/png");
        })],
        "thumbnail.png",
        { type: "image/png" },
      ),
      canvasSize,
      MAX_WEBM_SIZE,
      onStatus,
    );
  } finally {
    bitmap.close();
  }
};

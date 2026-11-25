import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ffmpegPath from "ffmpeg-static";
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/authenticate";

const MAX_REQUEST_SIZE = 2 * 1024 * 1024 + 64 * 1024;
const MAX_FRAME_SIZE = 2 * 1024 * 1024;
const MAX_VIDEO_SIZE = 256 * 1024;
const MAX_WEBM_SIZE = 32 * 1024;
const MAX_OUTPUT_SIZE = 64 * 1024;
const BITRATES = [32_000, 24_000, 16_000, 8_000];
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const WEBM_SIGNATURE = Buffer.from([0x1a, 0x45, 0xdf, 0xa3]);

export const runtime = "nodejs";

const runFfmpeg = (args: string[]) =>
  new Promise<void>((resolve, reject) => {
    if (!ffmpegPath) {
      reject(new Error("FFmpeg is not available on this server."));
      return;
    }

    const child = spawn(ffmpegPath, args, {
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, 15_000);

    child.stderr.on("data", (chunk: Buffer | string) => {
      stderr = `${stderr}${chunk}`.slice(-2000);
    });
    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once("close", (code, signal) => {
      clearTimeout(timeout);
      if (timedOut) {
        reject(new Error("VP9 thumbnail encoding exceeded the 15 second time limit."));
      } else if (code !== 0) {
        reject(new Error(stderr.trim() || `FFmpeg exited with ${signal ?? code}.`));
      } else {
        resolve();
      }
    });
  });

const encodeFile = async (
  file: Buffer,
  fileName: string,
  createArgs: (inputPath: string, outputPath: string, bitrate: number) => string[],
) => {
  const directory = await mkdtemp(join(tmpdir(), "fedun-thumbnail-"));
  try {
    const inputPath = join(directory, fileName);
    const outputPath = join(directory, "thumbnail.webm");
    await writeFile(inputPath, file);

    for (const bitrate of BITRATES) {
      await runFfmpeg(createArgs(inputPath, outputPath, bitrate));

      const output = await readFile(outputPath);
      if (output.byteLength <= MAX_WEBM_SIZE) return output;
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }

  throw new Error("Could not encode this thumbnail under Telegram's 32 KB WEBM limit.");
};

const encodeFrame = (frame: Buffer) =>
  encodeFile(frame, "frame.png", (inputPath, outputPath, bitrate) => [
    "-hide_banner",
    "-loglevel", "error",
    "-y",
    "-loop", "1",
    "-framerate", "30",
    "-i", inputPath,
    "-t", "1",
    "-an",
    "-c:v", "libvpx-vp9",
    "-deadline", "realtime",
    "-cpu-used", "8",
    "-row-mt", "1",
    "-b:v", String(bitrate),
    "-pix_fmt", "yuva420p",
    "-auto-alt-ref", "0",
    "-fs", String(MAX_OUTPUT_SIZE),
    outputPath,
  ]);

const encodeStickerVideo = (video: Buffer) =>
  encodeFile(video, "sticker.webm", (inputPath, outputPath, bitrate) => [
    "-hide_banner",
    "-loglevel", "error",
    "-y",
    "-i", inputPath,
    "-t", "1",
    "-an",
    "-vf", "fps=30,scale=100:100:force_original_aspect_ratio=decrease,pad=100:100:(ow-iw)/2:(oh-ih)/2:color=black@0,format=yuva420p",
    "-c:v", "libvpx-vp9",
    "-deadline", "realtime",
    "-cpu-used", "8",
    "-row-mt", "1",
    "-b:v", String(bitrate),
    "-pix_fmt", "yuva420p",
    "-auto-alt-ref", "0",
    "-fs", String(MAX_OUTPUT_SIZE),
    outputPath,
  ]);

export const POST = withAuth(async (request: NextRequest) => {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_SIZE) {
    return NextResponse.json({ error: "The thumbnail encoding request is too large." }, { status: 413 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid thumbnail encoding request." }, { status: 400 });
  }

  const frameFile = formData.get("frame");
  const stickerFile = formData.get("sticker");
  let encode: () => Promise<Buffer>;
  if (frameFile instanceof File) {
    const canvasSize = Number(formData.get("canvasSize"));
    if (
      frameFile.type !== "image/png" ||
      frameFile.size > MAX_FRAME_SIZE ||
      canvasSize !== 100
    ) {
      return NextResponse.json({ error: "Provide a valid PNG thumbnail frame." }, { status: 400 });
    }

    const frame = Buffer.from(await frameFile.arrayBuffer());
    if (
      frame.length < 24 ||
      !frame.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE) ||
      frame.readUInt32BE(16) !== canvasSize ||
      frame.readUInt32BE(20) !== canvasSize
    ) {
      return NextResponse.json(
        { error: "The thumbnail frame must be a square PNG of the requested size." },
        { status: 400 },
      );
    }
    encode = () => encodeFrame(frame);
  } else if (stickerFile instanceof File) {
    if (
      stickerFile.type !== "video/webm" ||
      stickerFile.size > MAX_VIDEO_SIZE ||
      stickerFile.size < WEBM_SIGNATURE.length
    ) {
      return NextResponse.json({ error: "Provide a valid WEBM sticker video." }, { status: 400 });
    }
    const stickerVideo = Buffer.from(await stickerFile.arrayBuffer());
    if (!stickerVideo.subarray(0, WEBM_SIGNATURE.length).equals(WEBM_SIGNATURE)) {
      return NextResponse.json({ error: "The sticker source is not a valid WEBM video." }, { status: 400 });
    }
    encode = () => encodeStickerVideo(stickerVideo);
  } else {
    return NextResponse.json({ error: "Provide a PNG frame or WEBM sticker video." }, { status: 400 });
  }

  try {
    const webm = await encode();
    return new NextResponse(new Uint8Array(webm), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "video/webm",
      },
    });
  } catch (error) {
    console.warn("Could not encode sticker thumbnail:", error);
    return NextResponse.json(
      {
        error: error instanceof Error
          ? error.message
          : "Could not encode the WEBM thumbnail.",
      },
      { status: 500 },
    );
  }
});

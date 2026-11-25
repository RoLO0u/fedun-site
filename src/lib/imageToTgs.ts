type Color = { r: number; g: number; b: number; count: number };
type Rectangle = { color: number; x: number; y: number; width: number; height: number };

const MAX_SOURCE_SIZE = 25 * 1024 * 1024;
const MAX_TGS_SIZE = 32 * 1024;
const COLOR_COUNTS = [16, 12, 8, 6, 4];
const GRID_SIZES = [128, 96, 64, 48, 32];

const getColorRange = (colors: Color[]) => {
  const ranges = ["r", "g", "b"].map((channel) => {
    const values = colors.map((color) => color[channel as keyof Color] as number);
    return Math.max(...values) - Math.min(...values);
  });
  return ranges;
};

const splitColorBox = (colors: Color[]) => {
  const ranges = getColorRange(colors);
  const channel = ranges.indexOf(Math.max(...ranges));
  const channelName = (["r", "g", "b"] as const)[channel];
  const sorted = [...colors].sort((a, b) => a[channelName] - b[channelName]);
  const total = sorted.reduce((sum, color) => sum + color.count, 0);
  let weight = 0;
  let splitIndex = 1;
  for (let index = 0; index < sorted.length - 1; index += 1) {
    weight += sorted[index].count;
    splitIndex = index + 1;
    if (weight >= total / 2) break;
  }
  return [sorted.slice(0, splitIndex), sorted.slice(splitIndex)];
};

const createPalette = (imageData: ImageData, maxColors: number) => {
  const histogram = new Map<number, Color>();
  const { data } = imageData;

  for (let offset = 0; offset < data.length; offset += 4) {
    if (data[offset + 3] < 64) continue;

    const r = data[offset] >> 3;
    const g = data[offset + 1] >> 3;
    const b = data[offset + 2] >> 3;
    const key = (r << 10) | (g << 5) | b;
    const color = histogram.get(key);
    if (color) {
      color.count += 1;
    } else {
      histogram.set(key, {
        r: Math.min(255, r * 8 + 4),
        g: Math.min(255, g * 8 + 4),
        b: Math.min(255, b * 8 + 4),
        count: 1,
      });
    }
  }

  const colors = [...histogram.values()];
  if (!colors.length) {
    throw new Error("The image is fully transparent.");
  }

  const boxes = [colors];
  while (boxes.length < maxColors) {
    let splitAt = -1;
    let highestScore = 0;
    for (let index = 0; index < boxes.length; index += 1) {
      const box = boxes[index];
      if (box.length < 2) continue;
      const range = Math.max(...getColorRange(box));
      const weight = box.reduce((sum, color) => sum + color.count, 0);
      const score = range * weight;
      if (score > highestScore) {
        highestScore = score;
        splitAt = index;
      }
    }
    if (splitAt < 0) break;
    boxes.splice(splitAt, 1, ...splitColorBox(boxes[splitAt]));
  }

  return boxes.map((box) => {
    const weight = box.reduce((sum, color) => sum + color.count, 0);
    return box.reduce(
      (paletteColor, color) => ({
        r: paletteColor.r + color.r * color.count / weight,
        g: paletteColor.g + color.g * color.count / weight,
        b: paletteColor.b + color.b * color.count / weight,
      }),
      { r: 0, g: 0, b: 0 },
    );
  });
};

const createRectangles = (
  imageData: ImageData,
  palette: ReturnType<typeof createPalette>,
) => {
  const { data, width, height } = imageData;
  const colorAt = new Int16Array(width * height);

  for (let pixel = 0; pixel < colorAt.length; pixel += 1) {
    const offset = pixel * 4;
    if (data[offset + 3] < 64) {
      colorAt[pixel] = -1;
      continue;
    }

    let closestColor = 0;
    let closestDistance = Number.POSITIVE_INFINITY;
    for (let index = 0; index < palette.length; index += 1) {
      const color = palette[index];
      const red = data[offset] - color.r;
      const green = data[offset + 1] - color.g;
      const blue = data[offset + 2] - color.b;
      const distance = red * red + green * green + blue * blue;
      if (distance < closestDistance) {
        closestColor = index;
        closestDistance = distance;
      }
    }
    colorAt[pixel] = closestColor;
  }

  const rectangles: Rectangle[] = [];
  let active = new Map<string, Rectangle>();

  for (let y = 0; y < height; y += 1) {
    const next = new Map<string, Rectangle>();
    let x = 0;
    while (x < width) {
      const color = colorAt[y * width + x];
      if (color < 0) {
        x += 1;
        continue;
      }

      const start = x;
      x += 1;
      while (x < width && colorAt[y * width + x] === color) x += 1;
      const runWidth = x - start;
      const key = `${color}:${start}:${runWidth}`;
      const existing = active.get(key);
      if (existing && existing.y + existing.height === y) {
        existing.height += 1;
        next.set(key, existing);
      } else {
        next.set(key, {
          color,
          x: start,
          y,
          width: runWidth,
          height: 1,
        });
      }
    }

    for (const [key, rectangle] of active) {
      if (!next.has(key)) rectangles.push(rectangle);
    }
    active = next;
  }
  rectangles.push(...active.values());
  return rectangles;
};

const createLottie = (
  rectangles: Rectangle[],
  palette: ReturnType<typeof createPalette>,
  gridSize: number,
  canvasSize: number,
) => {
  const scale = canvasSize / gridSize;
  const groups = palette.flatMap((color, colorIndex) => {
    const colorRectangles = rectangles.filter((rectangle) => rectangle.color === colorIndex);
    if (!colorRectangles.length) return [];

    return [{
      ty: "gr",
      nm: `Color ${colorIndex + 1}`,
      it: [
        ...colorRectangles.map((rectangle) => ({
          ty: "rc",
          d: 1,
          s: { a: 0, k: [rectangle.width * scale, rectangle.height * scale] },
          p: {
            a: 0,
            k: [
              (rectangle.x + rectangle.width / 2) * scale - canvasSize / 2,
              (rectangle.y + rectangle.height / 2) * scale - canvasSize / 2,
            ],
          },
          r: { a: 0, k: 0 },
        })),
        {
          ty: "fl",
          c: { a: 0, k: [color.r / 255, color.g / 255, color.b / 255, 1] },
          o: { a: 0, k: 100 },
          r: 1,
          bm: 0,
        },
        {
          ty: "tr",
          a: { a: 0, k: [0, 0] },
          o: { a: 0, k: 100 },
          p: { a: 0, k: [0, 0] },
          r: { a: 0, k: 0 },
          s: { a: 0, k: [100, 100] },
          sk: { a: 0, k: 0 },
          sa: { a: 0, k: 0 },
        },
      ],
    }];
  });

  return {
    v: "5.7.4",
    fr: 30,
    ip: 0,
    op: 90,
    w: canvasSize,
    h: canvasSize,
    nm: "Raster thumbnail",
    ddd: 0,
    assets: [],
    layers: [{
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Vectorized image",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [canvasSize / 2, canvasSize / 2, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: groups,
      ip: 0,
      op: 90,
      st: 0,
      bm: 0,
    }],
    markers: [],
  };
};

export const convertImageToTgs = async (file: File, canvasSize: number) => {
  if (file.size > MAX_SOURCE_SIZE) {
    throw new Error("Choose an image smaller than 25 MB.");
  }
  if (!("CompressionStream" in globalThis)) {
    throw new Error("This browser does not support creating TGS thumbnails.");
  }

  const bitmap = await createImageBitmap(file);
  try {
    for (const gridSize of GRID_SIZES) {
      const canvas = document.createElement("canvas");
      canvas.width = gridSize;
      canvas.height = gridSize;
      const context = canvas.getContext("2d", { alpha: true });
      if (!context) {
        throw new Error("Could not prepare the image for TGS conversion.");
      }

      const scale = Math.min(gridSize / bitmap.width, gridSize / bitmap.height);
      const width = bitmap.width * scale;
      const height = bitmap.height * scale;
      context.drawImage(bitmap, (gridSize - width) / 2, (gridSize - height) / 2, width, height);
      const imageData = context.getImageData(0, 0, gridSize, gridSize);

      for (const colorCount of COLOR_COUNTS) {
        const palette = createPalette(imageData, colorCount);
        const rectangles = createRectangles(imageData, palette);
        if (rectangles.length > 5000) continue;

        const lottie = createLottie(rectangles, palette, gridSize, canvasSize);
        const stream = new Blob([JSON.stringify(lottie)])
          .stream()
          .pipeThrough(new CompressionStream("gzip"));
        const compressed = await new Response(stream).arrayBuffer();
        if (compressed.byteLength <= MAX_TGS_SIZE) {
          const baseName = file.name.replace(/\.[^.]+$/, "");
          return new File([compressed], `${baseName}.tgs`, {
            type: "application/gzip",
            lastModified: Date.now(),
          });
        }
      }
    }
  } finally {
    bitmap.close();
  }

  throw new Error(
    "This image is too detailed to convert into a Telegram-compatible TGS thumbnail. Try a simpler image.",
  );
};

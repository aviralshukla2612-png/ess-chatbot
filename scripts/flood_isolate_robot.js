import fs from "fs";
import { PNG } from "pngjs";

const inputPath = "frontend/public/black_robo_clean.png";
const outputPathTransparent = "frontend/public/black_robo_isolated.png";

const data = fs.readFileSync(inputPath);
const png = PNG.sync.read(data);
const width = png.width;
const height = png.height;

// Mask of visited/outer background pixels
const isOuterBg = new Uint8Array(width * height);
const queue = [];

// Helper to check if a pixel is black/dark background
function isDark(x, y) {
  const idx = (width * y + x) << 2;
  const r = png.data[idx];
  const g = png.data[idx + 1];
  const b = png.data[idx + 2];
  return Math.max(r, g, b) <= 12; // threshold for background black
}

// Seed all perimeter pixels that are dark
for (let x = 0; x < width; x++) {
  if (isDark(x, 0)) { isOuterBg[x] = 1; queue.push([x, 0]); }
  if (isDark(x, height - 1)) { isOuterBg[width * (height - 1) + x] = 1; queue.push([x, height - 1]); }
}
for (let y = 0; y < height; y++) {
  if (isDark(0, y)) { isOuterBg[width * y] = 1; queue.push([0, y]); }
  if (isDark(width - 1, y)) { isOuterBg[width * y + width - 1] = 1; queue.push([width - 1, y]); }
}

// Also seed the negative space between arms and body if connected
// (The arms have gaps at x ~ 370 and x ~ 650 down around y ~ 350-500)
// Since the gaps between arms and waist open down to the bottom or through perimeter, flood-fill naturally flows through!

let head = 0;
while (head < queue.length) {
  const [cx, cy] = queue[head++];

  const neighbors = [
    [cx + 1, cy],
    [cx - 1, cy],
    [cx, cy + 1],
    [cx, cy - 1]
  ];

  for (const [nx, ny] of neighbors) {
    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
      const nIdx = width * ny + nx;
      if (!isOuterBg[nIdx] && isDark(nx, ny)) {
        isOuterBg[nIdx] = 1;
        queue.push([nx, ny]);
      }
    }
  }
}

// Now create the transparent isolated PNG
const outPng = new PNG({ width, height });

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (width * y + x) << 2;
    const pixelIndex = width * y + x;

    outPng.data[idx] = png.data[idx];
    outPng.data[idx + 1] = png.data[idx + 1];
    outPng.data[idx + 2] = png.data[idx + 2];

    if (isOuterBg[pixelIndex]) {
      // Outer background is completely transparent
      outPng.data[idx + 3] = 0;
    } else {
      outPng.data[idx + 3] = 255;
    }
  }
}

fs.writeFileSync(outputPathTransparent, PNG.sync.write(outPng));
console.log(`Saved outer-isolated version to ${outputPathTransparent}`);

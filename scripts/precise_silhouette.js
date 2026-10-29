import fs from "fs";
import { PNG } from "pngjs";

const data = fs.readFileSync("frontend/public/black_robo_clean.png");
const png = PNG.sync.read(data);
const width = png.width;
const height = png.height;

// Find outer silhouette edges per row
const leftEdge = new Int32Array(height).fill(-1);
const rightEdge = new Int32Array(height).fill(-1);

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width / 2; x++) {
    const idx = (width * y + x) << 2;
    if (Math.max(png.data[idx], png.data[idx+1], png.data[idx+2]) > 20) {
      leftEdge[y] = x;
      break;
    }
  }
  for (let x = width - 1; x >= width / 2; x--) {
    const idx = (width * y + x) << 2;
    if (Math.max(png.data[idx], png.data[idx+1], png.data[idx+2]) > 20) {
      rightEdge[y] = x;
      break;
    }
  }
}

// Transparent PNG
const outPng = new PNG({ width, height });

// Start with all outer silhouette pixels marked transparent
const isTransparent = new Uint8Array(width * height);
for (let y = 0; y < height; y++) {
  const minX = leftEdge[y] > 0 ? leftEdge[y] : -1;
  const maxX = rightEdge[y] > 0 ? rightEdge[y] : -1;

  for (let x = 0; x < width; x++) {
    if (minX === -1 || x < minX || x > maxX) {
      isTransparent[width * y + x] = 1;
    }
  }
}

// Also flood fill armpit negative space
// Seeds: Left armpit (385, 460), Right armpit (635, 460)
function floodArmpit(seedX, seedY, minBoundX, maxBoundX) {
  const q = [[seedX, seedY]];
  const visited = new Uint8Array(width * height);

  while (q.length > 0) {
    const [cx, cy] = q.pop();
    if (cx < minBoundX || cx > maxBoundX || cy < 340 || cy >= height) continue;
    const pIdx = width * cy + cx;
    if (visited[pIdx]) continue;
    visited[pIdx] = 1;

    const idx = pIdx << 2;
    const lum = Math.max(png.data[idx], png.data[idx+1], png.data[idx+2]);
    if (lum <= 18) {
      isTransparent[pIdx] = 1;
      q.push([cx + 1, cy]);
      q.push([cx - 1, cy]);
      q.push([cx, cy + 1]);
      q.push([cx, cy - 1]);
    }
  }
}

floodArmpit(385, 460, 360, 420);
floodArmpit(635, 460, 600, 660);

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (width * y + x) << 2;
    const pIdx = width * y + x;

    outPng.data[idx] = png.data[idx];
    outPng.data[idx + 1] = png.data[idx + 1];
    outPng.data[idx + 2] = png.data[idx + 2];
    outPng.data[idx + 3] = isTransparent[pIdx] ? 0 : 255;
  }
}

fs.writeFileSync("frontend/public/black_robo_cutout.png", PNG.sync.write(outPng));
console.log("Saved refined cutout to frontend/public/black_robo_cutout.png");

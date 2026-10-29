import fs from "fs";
import { PNG } from "pngjs";

const inputPath = "frontend/public/black_robo.png";
const outputPathClean = "frontend/public/black_robo_clean.png";
const outputPathTransparent = "frontend/public/black_robo_transparent.png";

const data = fs.readFileSync(inputPath);
const png = PNG.sync.read(data);

console.log(`Original size: ${png.width} x ${png.height}`);

// 1. Remove bottom-right sparkle icon
// The sparkle is roughly between x=880..960 and y=480..560
for (let y = 470; y < png.height; y++) {
  for (let x = 860; x < png.width; x++) {
    const idx = (png.width * y + x) << 2;
    png.data[idx] = 0;     // R
    png.data[idx + 1] = 0; // G
    png.data[idx + 2] = 0; // B
    png.data[idx + 3] = 255;
  }
}

fs.writeFileSync(outputPathClean, PNG.sync.write(png));
console.log(`Saved clean version to ${outputPathClean}`);

// 2. Create transparent version
// Any pixel that is pure or near-pure black becomes transparent, with smooth transition for rim light
const transPng = new PNG({ width: png.width, height: png.height });

for (let y = 0; y < png.height; y++) {
  for (let x = 0; x < png.width; x++) {
    const idx = (png.width * y + x) << 2;
    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];
    const maxVal = Math.max(r, g, b);

    transPng.data[idx] = r;
    transPng.data[idx + 1] = g;
    transPng.data[idx + 2] = b;

    if (maxVal <= 4) {
      // Pure background
      transPng.data[idx + 3] = 0;
    } else if (maxVal < 18) {
      // Soft feather edge
      const alpha = Math.round(((maxVal - 4) / 14) * 255);
      transPng.data[idx + 3] = alpha;
    } else {
      transPng.data[idx + 3] = 255;
    }
  }
}

fs.writeFileSync(outputPathTransparent, PNG.sync.write(transPng));
console.log(`Saved transparent version to ${outputPathTransparent}`);

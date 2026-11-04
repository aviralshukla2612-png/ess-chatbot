const sharp = require('../node_modules/sharp');
const fs = require('fs');
const path = require('path');

async function buildFavicons() {
  console.log('Generating Emperor Nexus favicons...');

  const rootDir = path.resolve(__dirname, '..', '..');
  const frontendPublic = path.join(rootDir, 'frontend', 'public');
  const frontendApp = path.join(rootDir, 'frontend', 'app');
  const cinematicPublic = path.join(rootDir, 'cinematic-experience', 'public');

  // 1. Load original logo
  const srcImg = path.join(frontendPublic, 'emperor_nexus_sales_ai_assistant.png');
  const { data, info } = await sharp(srcImg).raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  // 2. Clean up faint corner smudges in the lower-left dark zone
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < 650; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];
      if (r < 25 && g < 25 && b < 80 && a < 200) {
        data[idx + 3] = 0;
      }
    }
  }

  // 3. Extract robot icon precisely and create 512x512 transparent master
  const masterBuf = await sharp(data, { raw: { width, height, channels: 4 } })
    .extract({ left: 35, top: 20, width: 590, height: 480 })
    .resize(456, 456, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .extend({
      top: 28,
      bottom: 28,
      left: 28,
      right: 28,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  console.log('Master 512x512 generated:', masterBuf.length, 'bytes');
  fs.writeFileSync(path.join(frontendPublic, 'icon-512.png'), masterBuf);
  fs.writeFileSync(path.join(cinematicPublic, 'icon-512.png'), masterBuf);

  // 4. Generate resolutions: 16, 32, 48, 96, 192
  const sizes = [16, 32, 48, 96, 192];
  const pngBuffers = { 512: masterBuf };
  for (const s of sizes) {
    const buf = await sharp(masterBuf).resize(s, s).png().toBuffer();
    pngBuffers[s] = buf;
    fs.writeFileSync(path.join(frontendPublic, `icon-${s}.png`), buf);

    if (s === 32) {
      fs.writeFileSync(path.join(frontendPublic, 'icon.png'), buf);
      fs.writeFileSync(path.join(frontendApp, 'icon.png'), buf);
      fs.writeFileSync(path.join(cinematicPublic, 'icon-32.png'), buf);
      fs.writeFileSync(path.join(cinematicPublic, 'icon.png'), buf);
    }
    if (s === 192) {
      fs.writeFileSync(path.join(cinematicPublic, 'icon-192.png'), buf);
    }
  }

  // 5. Generate WEBP versions to replace legacy e-logoicon.webp and icon.webp
  const webpBuf = await sharp(masterBuf).resize(192, 192).webp({ quality: 95 }).toBuffer();
  fs.writeFileSync(path.join(frontendPublic, 'icon.webp'), webpBuf);
  fs.writeFileSync(path.join(frontendPublic, 'e-logoicon.webp'), webpBuf);
  fs.writeFileSync(path.join(frontendApp, 'icon.webp'), webpBuf);
  fs.writeFileSync(path.join(cinematicPublic, 'e-logoicon.webp'), webpBuf);
  console.log('Updated webp icons');

  // 6. Build multi-resolution ICO (16, 32, 48)
  const icoSizes = [16, 32, 48];
  const icoPngs = [pngBuffers[16], pngBuffers[32], pngBuffers[48]];
  const headerLen = 6 + icoSizes.length * 16;
  let offset = headerLen;
  const entries = [];

  for (let i = 0; i < icoSizes.length; i++) {
    const sz = icoSizes[i];
    const buf = icoPngs[i];
    entries.push({
      width: sz,
      height: sz,
      colors: 0,
      reserved: 0,
      planes: 1,
      bpp: 32,
      size: buf.length,
      offset: offset,
    });
    offset += buf.length;
  }

  const icoBuf = Buffer.alloc(offset);
  icoBuf.writeUInt16LE(0, 0); // reserved
  icoBuf.writeUInt16LE(1, 2); // 1 = icon
  icoBuf.writeUInt16LE(icoSizes.length, 4); // count

  let entryPos = 6;
  for (const entry of entries) {
    icoBuf.writeUInt8(entry.width, entryPos);
    icoBuf.writeUInt8(entry.height, entryPos + 1);
    icoBuf.writeUInt8(entry.colors, entryPos + 2);
    icoBuf.writeUInt8(entry.reserved, entryPos + 3);
    icoBuf.writeUInt16LE(entry.planes, entryPos + 4);
    icoBuf.writeUInt16LE(entry.bpp, entryPos + 6);
    icoBuf.writeUInt32LE(entry.size, entryPos + 8);
    icoBuf.writeUInt32LE(entry.offset, entryPos + 12);
    entryPos += 16;
  }

  for (let i = 0; i < icoSizes.length; i++) {
    icoPngs[i].copy(icoBuf, entries[i].offset);
  }

  fs.writeFileSync(path.join(frontendPublic, 'favicon.ico'), icoBuf);
  fs.writeFileSync(path.join(frontendApp, 'favicon.ico'), icoBuf);
  fs.writeFileSync(path.join(cinematicPublic, 'favicon.ico'), icoBuf);
  console.log('Saved multi-size favicon.ico');

  // 7. Generate Apple Touch Icon (180x180 with sleek dark luxury background)
  const appleRobot = await sharp(masterBuf).resize(140, 140).png().toBuffer();
  const appleSvgBg = Buffer.from(
    `<svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="180" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#0e0c1f"/>
          <stop offset="50%" stop-color="#070611"/>
          <stop offset="100%" stop-color="#0c061a"/>
        </linearGradient>
        <linearGradient id="border" x1="0" y1="0" x2="180" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.4"/>
        </linearGradient>
      </defs>
      <rect width="180" height="180" rx="40" fill="url(#bg)"/>
      <rect x="1" y="1" width="178" height="178" rx="39" fill="none" stroke="url(#border)" stroke-width="2"/>
    </svg>`
  );

  const appleTouchIconBuf = await sharp(appleSvgBg)
    .composite([{ input: appleRobot, top: 20, left: 20 }])
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(frontendPublic, 'apple-touch-icon.png'), appleTouchIconBuf);
  fs.writeFileSync(path.join(frontendApp, 'apple-icon.png'), appleTouchIconBuf);
  fs.writeFileSync(path.join(cinematicPublic, 'apple-touch-icon.png'), appleTouchIconBuf);
  console.log('Saved apple-touch-icon.png');

  // 8. Generate vector + high-res SVG favicon
  const masterBase64 = masterBuf.toString('base64');
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <image href="data:image/png;base64,${masterBase64}" x="0" y="0" width="512" height="512" />
</svg>
`;

  fs.writeFileSync(path.join(frontendPublic, 'favicon.svg'), svgContent, 'utf8');
  fs.writeFileSync(path.join(frontendApp, 'icon.svg'), svgContent, 'utf8');
  fs.writeFileSync(path.join(cinematicPublic, 'favicon.svg'), svgContent, 'utf8');
  console.log('Saved favicon.svg in frontend and cinematic-experience');

  console.log('All favicon assets successfully generated!');
}

buildFavicons().catch((err) => {
  console.error(err);
  process.exit(1);
});

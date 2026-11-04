const sharp = require('../node_modules/sharp');
const fs = require('fs');
const path = require('path');

async function updateAllLogos() {
  console.log('Processing new logo.jpg and updating all logo assets...');

  const rootDir = path.resolve(__dirname, '..', '..');
  const frontendPublic = path.join(rootDir, 'frontend', 'public');
  const frontendApp = path.join(rootDir, 'frontend', 'app');
  const cinematicPublic = path.join(rootDir, 'cinematic-experience', 'public');

  const srcJpg = path.join(frontendPublic, 'logo.jpg');
  if (!fs.existsSync(srcJpg)) {
    throw new Error('logo.jpg not found in frontend/public');
  }

  // 1. Copy original logo.jpg to cinematic-experience/public
  fs.copyFileSync(srcJpg, path.join(cinematicPublic, 'logo.jpg'));
  console.log('Copied logo.jpg to cinematic-experience/public');

  // 2. Generate high-quality transparent PNG logo
  const { data, info } = await sharp(srcJpg).raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const outRgba = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 3;
      const dstIdx = (y * width + x) * 4;
      const r = data[srcIdx];
      const g = data[srcIdx + 1];
      const b = data[srcIdx + 2];

      // Measure distance from light background (#f7f7f7 = 247, 247, 247)
      const diff = Math.max(Math.abs(r - 247), Math.abs(g - 247), Math.abs(b - 247));

      if (diff < 8) {
        outRgba[dstIdx] = 0;
        outRgba[dstIdx + 1] = 0;
        outRgba[dstIdx + 2] = 0;
        outRgba[dstIdx + 3] = 0;
      } else if (diff < 26) {
        const alpha = Math.round(((diff - 8) / 18) * 255);
        outRgba[dstIdx] = r;
        outRgba[dstIdx + 1] = g;
        outRgba[dstIdx + 2] = b;
        outRgba[dstIdx + 3] = alpha;
      } else {
        outRgba[dstIdx] = r;
        outRgba[dstIdx + 1] = g;
        outRgba[dstIdx + 2] = b;
        outRgba[dstIdx + 3] = 255;
      }
    }
  }

  const transparentLogoBuf = await sharp(outRgba, { raw: { width, height, channels: 4 } })
    .png({ quality: 100 })
    .toBuffer();

  // Save logo.png in both public dirs
  fs.writeFileSync(path.join(frontendPublic, 'logo.png'), transparentLogoBuf);
  fs.writeFileSync(path.join(cinematicPublic, 'logo.png'), transparentLogoBuf);
  console.log('Generated logo.png with transparent background');

  // 3. Overwrite legacy logo file names so ANY cached / existing reference gets the new logo
  const legacyNames = [
    'emperor_nexus_sales_ai_assistant.png',
    'emperor_nexus_sales_ai_assistant_original.png',
    'emperor_nexus_sales_ai_assistant_cropped.png',
    'emperor_nexus_sales_ai_assistant_v2.png',
  ];

  for (const name of legacyNames) {
    fs.writeFileSync(path.join(frontendPublic, name), transparentLogoBuf);
    fs.writeFileSync(path.join(cinematicPublic, name), transparentLogoBuf);
  }
  console.log('Overwrote all legacy logo files with the new logo');

  // 4. Crop the new robot mascot to generate updated favicons and icons
  // Robot emblem in logo.png: x: 19..329 (w: 310), y: 12..282 (h: 270)
  const masterRobotBuf = await sharp(outRgba, { raw: { width, height, channels: 4 } })
    .extract({ left: 15, top: 10, width: 320, height: 275 })
    .resize(440, 440, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .extend({
      top: 36,
      bottom: 36,
      left: 36,
      right: 36,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(frontendPublic, 'icon-512.png'), masterRobotBuf);
  fs.writeFileSync(path.join(cinematicPublic, 'icon-512.png'), masterRobotBuf);

  // 5. Generate resolution suite: 16, 32, 48, 96, 192
  const sizes = [16, 32, 48, 96, 192];
  const pngBuffers = { 512: masterRobotBuf };
  for (const s of sizes) {
    const buf = await sharp(masterRobotBuf).resize(s, s).png().toBuffer();
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

  // 6. Generate WebP icons
  const webpBuf = await sharp(masterRobotBuf).resize(192, 192).webp({ quality: 95 }).toBuffer();
  fs.writeFileSync(path.join(frontendPublic, 'icon.webp'), webpBuf);
  fs.writeFileSync(path.join(frontendPublic, 'e-logoicon.webp'), webpBuf);
  fs.writeFileSync(path.join(frontendApp, 'icon.webp'), webpBuf);
  fs.writeFileSync(path.join(cinematicPublic, 'e-logoicon.webp'), webpBuf);

  // 7. Generate multi-resolution ICO (16, 32, 48)
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

  // 8. Generate Apple Touch Icon (180x180)
  const appleRobot = await sharp(masterRobotBuf).resize(140, 140).png().toBuffer();
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

  // 9. Generate SVG favicon
  const masterBase64 = masterRobotBuf.toString('base64');
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

  // Clean up temporary file
  if (fs.existsSync(path.join(frontendPublic, 'logo-transparent.png'))) {
    fs.unlinkSync(path.join(frontendPublic, 'logo-transparent.png'));
  }

  console.log('All logo and favicon assets updated successfully!');
}

updateAllLogos().catch((err) => {
  console.error(err);
  process.exit(1);
});

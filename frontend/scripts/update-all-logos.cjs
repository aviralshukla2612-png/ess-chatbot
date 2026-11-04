const sharp = require('../node_modules/sharp');
const fs = require('fs');
const path = require('path');

async function updateAllLogos() {
  console.log('Generating pixel-perfect solid-white Emperor Nexus logo and favicon suite...');

  const rootDir = path.resolve(__dirname, '..', '..');
  const frontendPublic = path.join(rootDir, 'frontend', 'public');
  const frontendApp = path.join(rootDir, 'frontend', 'app');
  const cinematicPublic = path.join(rootDir, 'cinematic-experience', 'public');

  const srcMaster = path.join(frontendPublic, 'original_master_logo.png');
  if (!fs.existsSync(srcMaster)) {
    throw new Error('original_master_logo.png not found');
  }

  // 1. Load original 1820x520 master
  const { data, info } = await sharp(srcMaster).raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const outRgba = Buffer.from(data);

  // 2. TEXT & SEPARATOR ZONE (x >= 660):
  // Clear any background haze outside valid text/line bounds
  for (let y = 0; y < height; y++) {
    for (let x = 660; x < width; x++) {
      const idx = (y * width + x) * 4;
      const isSeparator = (x >= 668 && x <= 682 && y >= 45 && y <= 455);
      const isEmperor = (x >= 750 && x <= 1230 && y >= 50 && y <= 115);
      const isNexus = (x >= 750 && x <= 1795 && y >= 150 && y <= 330);
      const isSales = (x >= 750 && x <= 1630 && y >= 355 && y <= 420);

      if (!isSeparator && !isEmperor && !isNexus && !isSales) {
        outRgba[idx] = 0;
        outRgba[idx + 1] = 0;
        outRgba[idx + 2] = 0;
        outRgba[idx + 3] = 0;
      }
    }
  }

  // Inside text zones:
  // Render EMPEROR, N, E, U, S, SALES AI ASSISTANT, and Separator in SOLID BRILLIANT WHITE (#FFFFFF)
  // Preserve anti-aliased edge smoothing.
  // Preserve vibrant diagonal gradient cross on the X in NEXUS.
  for (let y = 0; y < height; y++) {
    for (let x = 660; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (outRgba[idx + 3] === 0) continue;

      const isX = (x >= 1155 && x <= 1375 && y >= 150 && y <= 330);

      if (isX) {
        // NEXUS X: Vibrant cyan/purple gradient
        if (outRgba[idx + 3] < 30) {
          outRgba[idx + 3] = 0;
        }
      } else {
        const r = outRgba[idx];
        const g = outRgba[idx + 1];
        const b = outRgba[idx + 2];
        const a = outRgba[idx + 3];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        if (lum < 40 || a < 25) {
          outRgba[idx] = 0;
          outRgba[idx + 1] = 0;
          outRgba[idx + 2] = 0;
          outRgba[idx + 3] = 0;
        } else {
          outRgba[idx] = 255;
          outRgba[idx + 1] = 255;
          outRgba[idx + 2] = 255;
          outRgba[idx + 3] = Math.min(255, Math.round((a / 255) * 1.15 * 255));
        }
      }
    }
  }

  // 3. MASCOT ZONE (x < 660):
  // Preserve the glowing cyan/purple cyber headset, mic, black visor, and smiling white eyes (^ ^).
  // Clear any outer background shadow haze (lum < 35 outside the visor).
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < 660; x++) {
      const idx = (y * width + x) * 4;
      const r = outRgba[idx];
      const g = outRgba[idx + 1];
      const b = outRgba[idx + 2];
      const a = outRgba[idx + 3];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      const isInsideVisor = (x >= 200 && x <= 440 && y >= 235 && y <= 395);
      if (!isInsideVisor && lum < 35) {
        outRgba[idx] = 0;
        outRgba[idx + 1] = 0;
        outRgba[idx + 2] = 0;
        outRgba[idx + 3] = 0;
      }
    }
  }

  // 4. Generate master clean logo PNG (1820 x 520)
  const masterLogoBuf = await sharp(outRgba, { raw: { width, height, channels: 4 } })
    .png({ quality: 100 })
    .toBuffer();

  // Save logo.png in both public directories
  fs.writeFileSync(path.join(frontendPublic, 'logo.png'), masterLogoBuf);
  fs.writeFileSync(path.join(cinematicPublic, 'logo.png'), masterLogoBuf);
  console.log('Saved solid-white logo.png in frontend and cinematic-experience');

  // Overwrite legacy filenames so all references display the new solid-white logo
  const legacyNames = [
    'emperor_nexus_sales_ai_assistant.png',
    'emperor_nexus_sales_ai_assistant_original.png',
    'emperor_nexus_sales_ai_assistant_cropped.png',
    'emperor_nexus_sales_ai_assistant_v2.png',
  ];

  for (const name of legacyNames) {
    fs.writeFileSync(path.join(frontendPublic, name), masterLogoBuf);
    fs.writeFileSync(path.join(cinematicPublic, name), masterLogoBuf);
  }
  console.log('Updated all legacy logo paths');

  // 5. Crop the robot mascot from this refined asset to update all favicons
  // Mascot bounds in master: left=35, top=35, width=600, height=470
  const masterRobotBuf = await sharp(outRgba, { raw: { width, height, channels: 4 } })
    .extract({ left: 35, top: 35, width: 600, height: 470 })
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

  // Resolution suite: 16, 32, 48, 96, 192
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

  // WebP icons
  const webpBuf = await sharp(masterRobotBuf).resize(192, 192).webp({ quality: 95 }).toBuffer();
  fs.writeFileSync(path.join(frontendPublic, 'icon.webp'), webpBuf);
  fs.writeFileSync(path.join(frontendPublic, 'e-logoicon.webp'), webpBuf);
  fs.writeFileSync(path.join(frontendApp, 'icon.webp'), webpBuf);
  fs.writeFileSync(path.join(cinematicPublic, 'e-logoicon.webp'), webpBuf);

  // Multi-resolution ICO (16, 32, 48)
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

  // Apple Touch Icon (180x180)
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

  // SVG favicon
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

  // Clean up any temporary files
  const tempFiles = [
    'test_emperor_nexus_sales_ai_assistant.png',
    'test_emperor_nexus_sales_ai_assistant_cropped.png',
    'test_emperor_nexus_sales_ai_assistant_original.png',
    'test_emperor_nexus_sales_ai_assistant_v2.png',
    'test_clean_master.png',
    'old_logo.png'
  ];
  for (const f of tempFiles) {
    const p = path.join(frontendPublic, f);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }

  console.log('All Emperor Nexus logos, favicons, and icons regenerated successfully!');
}

updateAllLogos().catch((err) => {
  console.error(err);
  process.exit(1);
});

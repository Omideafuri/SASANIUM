import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const MANIFEST_PATH = path.join(ROOT, 'src', 'generated', 'frames.manifest.json');
const WEBP_ROOT = path.join(ROOT, 'public', 'frames-web');

const DESKTOP_WIDTH = 1600;
const MOBILE_WIDTH = 800;
const QUALITY_DESKTOP = 82;
const QUALITY_MOBILE = 78;
const CONCURRENCY = 8;

async function runPool(items, worker, concurrency) {
  let idx = 0;
  async function next() {
    while (idx < items.length) {
      const current = items[idx++];
      await worker(current);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, next));
}

async function main() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error('Manifest not found. Run `npm run manifest` first.');
  }
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const frames = manifest.frames;

  const desktopDir = path.join(WEBP_ROOT, 'desktop');
  const mobileDir = path.join(WEBP_ROOT, 'mobile');
  const mobileHalfDir = path.join(WEBP_ROOT, 'mobile-half');

  fs.mkdirSync(desktopDir, { recursive: true });
  fs.mkdirSync(mobileDir, { recursive: true });
  fs.mkdirSync(mobileHalfDir, { recursive: true });

  let done = 0;
  const total = frames.length;
  console.log(`[optimize:frames] Converting ${total} frames to WebP (desktop ${DESKTOP_WIDTH}px, mobile ${MOBILE_WIDTH}px, mobile-half)...`);

  await runPool(
    frames,
    async (frame) => {
      const srcPath = path.join(ROOT, 'public', frame.jpg);
      const outName = `${String(frame.index).padStart(4, '0')}.webp`;
      const desktopOut = path.join(desktopDir, outName);
      const mobileOut = path.join(mobileDir, outName);

      await sharp(srcPath)
        .resize({ width: DESKTOP_WIDTH, withoutEnlargement: true })
        .webp({ quality: QUALITY_DESKTOP, effort: 4 })
        .toFile(desktopOut);

      await sharp(srcPath)
        .resize({ width: MOBILE_WIDTH, withoutEnlargement: true })
        .webp({ quality: QUALITY_MOBILE, effort: 4 })
        .toFile(mobileOut);

      if (frame.index % 2 === 0 || frame.index === total - 1) {
        const mobileHalfOut = path.join(mobileHalfDir, outName);
        fs.copyFileSync(mobileOut, mobileHalfOut);
      }

      done++;
      if (done % 100 === 0 || done === total) {
        console.log(`  Progress: ${done}/${total}`);
      }
    },
    CONCURRENCY
  );

  // Re-run manifest builder so webp flags are updated
  console.log('[optimize:frames] Done! Re-run `npm run manifest` to enable WebP flags in frames.manifest.json.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

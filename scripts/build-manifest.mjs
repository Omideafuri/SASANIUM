import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const FRAMES_ROOT = path.join(ROOT, 'public', 'frames');
const WEBP_ROOT = path.join(ROOT, 'public', 'frames-web');
const OUT_PATH = path.join(ROOT, 'src', 'generated', 'frames.manifest.json');

/**
 * Natural sort for filenames like ezgif-frame-001.jpg ... ezgif-frame-210.jpg
 */
function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Compute mean absolute pixel difference (0..255) on a downscaled 64x36 thumbnail
 * to reliably detect visually identical boundary frames even after JPEG re-encoding.
 */
async function framesVisuallyMatch(fileA, fileB, threshold = 5.5) {
  const [bufA, bufB] = await Promise.all([
    sharp(fileA).resize(64, 36).removeAlpha().raw().toBuffer(),
    sharp(fileB).resize(64, 36).removeAlpha().raw().toBuffer(),
  ]);
  if (bufA.length !== bufB.length) return false;
  let sum = 0;
  for (let i = 0; i < bufA.length; i++) {
    sum += Math.abs(bufA[i] - bufB[i]);
  }
  const mad = sum / bufA.length;
  return { match: mad < threshold, mad: Number(mad.toFixed(2)) };
}

async function main() {
  if (!fs.existsSync(FRAMES_ROOT)) {
    throw new Error(`Frames directory not found: ${FRAMES_ROOT}`);
  }

  const clipDirs = fs
    .readdirSync(FRAMES_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort(naturalSort);

  if (clipDirs.length === 0) {
    throw new Error(`No clip directories found in ${FRAMES_ROOT}`);
  }

  const clips = [];
  const frames = [];
  let sourceWidth = 0;
  let sourceHeight = 0;
  let prevLastFile = null;

  for (let cIdx = 0; cIdx < clipDirs.length; cIdx++) {
    const clipName = clipDirs[cIdx];
    const clipPath = path.join(FRAMES_ROOT, clipName);
    const files = fs
      .readdirSync(clipPath)
      .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
      .sort(naturalSort);

    if (files.length === 0) continue;

    if (sourceWidth === 0) {
      const meta = await sharp(path.join(clipPath, files[0])).metadata();
      sourceWidth = meta.width || 1920;
      sourceHeight = meta.height || 1080;
    }

    let droppedFirst = false;
    let joinMad = null;
    if (prevLastFile) {
      const firstFile = path.join(clipPath, files[0]);
      const cmp = await framesVisuallyMatch(prevLastFile, firstFile);
      joinMad = cmp.mad;
      if (cmp.match) {
        droppedFirst = true;
      }
    }

    const startGlobalIndex = frames.length;
    const startIdx = droppedFirst ? 1 : 0;

    for (let i = startIdx; i < files.length; i++) {
      const filename = files[i];
      frames.push({
        index: frames.length,
        clip: clipName,
        file: filename,
        jpg: `/frames/${clipName}/${filename}`,
      });
    }

    const endGlobalIndex = frames.length - 1;
    prevLastFile = path.join(clipPath, files[files.length - 1]);

    clips.push({
      id: clipName,
      rawCount: files.length,
      usedCount: files.length - startIdx,
      droppedFirst,
      joinMad,
      startFrame: startGlobalIndex,
      endFrame: endGlobalIndex,
    });
  }

  const hasWebpDesktop = fs.existsSync(path.join(WEBP_ROOT, 'desktop'));
  const hasWebpMobile = fs.existsSync(path.join(WEBP_ROOT, 'mobile'));
  const hasWebpMobileHalf = fs.existsSync(path.join(WEBP_ROOT, 'mobile-half'));

  const manifest = {
    generatedAt: new Date().toISOString(),
    width: sourceWidth,
    height: sourceHeight,
    totalFrames: frames.length,
    webp: {
      desktop: hasWebpDesktop,
      mobile: hasWebpMobile,
      mobileHalf: hasWebpMobileHalf,
    },
    clips,
    frames,
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(manifest, null, 2));

  console.log(
    `[manifest] Built ${manifest.totalFrames} frames (${sourceWidth}x${sourceHeight}) from ${clips.length} clips -> ${path.relative(ROOT, OUT_PATH)}`
  );
  for (const c of clips) {
    console.log(
      `  ${c.id}: ${c.usedCount}/${c.rawCount} frames (global ${c.startFrame}..${c.endFrame})${c.droppedFirst ? ` [dropped duplicate first frame, MAD=${c.joinMad}]` : ''}`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

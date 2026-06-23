import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const input = path.join(root, 'assets/images/logo1.png');
const output = path.join(root, 'assets/images/splash-android.png');

const CANVAS = 1024;
const BACKGROUND = '#1B4F8A';
/** Logo occupies ~52% of canvas width — safe for Android 12+ splash icon bounds */
const LOGO_SCALE = 0.52;

const logo = sharp(input);
const meta = await logo.metadata();
const targetWidth = Math.round(CANVAS * LOGO_SCALE);
const resized = await logo.resize({ width: targetWidth }).png().toBuffer();
const resizedMeta = await sharp(resized).metadata();
const left = Math.round((CANVAS - resizedMeta.width) / 2);
const top = Math.round((CANVAS - resizedMeta.height) / 2);

await sharp({
  create: {
    width: CANVAS,
    height: CANVAS,
    channels: 4,
    background: BACKGROUND,
  },
})
  .composite([{ input: resized, left, top }])
  .png()
  .toFile(output);

console.log(`Wrote ${output} (${CANVAS}x${CANVAS})`);

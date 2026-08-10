/**
 * Extracts the Ionicons artwork used by map pins into a JSON module, so the WebView map
 * can draw the exact same glyphs as the rest of the app without loading a font or a CDN.
 *
 * Run after changing the icons in src/constants/mapLayers.ts:
 *   node scripts/build-map-icons.js
 */
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const svgDir = path.join(projectRoot, 'node_modules', 'ionicons', 'dist', 'svg');
const layersFile = path.join(projectRoot, 'src', 'constants', 'mapLayers.ts');
const outFile = path.join(projectRoot, 'src', 'vendor', 'mapPinIcons.json');

if (!fs.existsSync(svgDir)) {
  throw new Error(`Missing ${svgDir}. Run: npm install --save-dev ionicons`);
}

const iconNames = [
  ...new Set(
    Array.from(fs.readFileSync(layersFile, 'utf8').matchAll(/icon:\s*'([^']+)'/g), (m) => m[1]),
  ),
].sort();

if (iconNames.length === 0) {
  throw new Error(`No icon names found in ${layersFile}`);
}

const icons = {};
for (const name of iconNames) {
  const file = path.join(svgDir, `${name}.svg`);
  if (!fs.existsSync(file)) {
    throw new Error(`Ionicons has no icon named "${name}" (${file})`);
  }
  // Keep only the drawing instructions; the component supplies size and colour.
  const body = fs
    .readFileSync(file, 'utf8')
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .trim();
  icons[name] = body;
}

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(icons, null, 2), 'utf8');
console.log(`Wrote ${path.relative(projectRoot, outFile)} (${iconNames.length} icons)`);

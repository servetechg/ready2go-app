/**
 * Vendors Leaflet into a JSON module so the OSM map can be rendered inside a WebView
 * without fetching anything from a CDN at runtime.
 *
 * Run after bumping the leaflet devDependency:
 *   node scripts/build-leaflet-bundle.js
 */
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const leafletRoot = path.join(projectRoot, 'node_modules', 'leaflet');
const outFile = path.join(projectRoot, 'src', 'vendor', 'leafletBundle.json');

function read(file) {
  const full = path.join(leafletRoot, 'dist', file);
  if (!fs.existsSync(full)) {
    throw new Error(`Missing ${full}. Run: npm install --save-dev leaflet`);
  }
  return fs.readFileSync(full, 'utf8');
}

const { version } = require(path.join(leafletRoot, 'package.json'));

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(
  outFile,
  JSON.stringify({
    version,
    css: read('leaflet.css'),
    js: read('leaflet.js'),
  }),
  'utf8',
);

const kb = Math.round(fs.statSync(outFile).size / 1024);
console.log(`Wrote ${path.relative(projectRoot, outFile)} (leaflet ${version}, ${kb} KB)`);

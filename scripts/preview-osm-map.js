/**
 * Serves the exact Leaflet page used by the in-app OSM map, seeded with sample markers,
 * heat circles and a polygon. Handy for checking tile/marker rendering in a real browser
 * (including an emulator via `adb reverse tcp:8099 tcp:8099`).
 *
 *   node scripts/preview-osm-map.js [port]
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'osm-map-preview-'));

// Compile the shared HTML builder so the preview cannot drift from the app.
const tsconfigPath = path.join(outDir, 'tsconfig.json');
fs.writeFileSync(
  tsconfigPath,
  JSON.stringify({
    compilerOptions: {
      outDir,
      rootDir: path.join(projectRoot, 'src'),
      baseUrl: projectRoot,
      paths: { '@/*': ['./src/*'] },
      module: 'commonjs',
      target: 'es2020',
      moduleResolution: 'node',
      resolveJsonModule: true,
      esModuleInterop: true,
      skipLibCheck: true,
    },
    files: [path.join(projectRoot, 'src', 'components', 'dashboard', 'osmMapHtml.ts')],
  }),
);

execFileSync(
  process.execPath,
  [require.resolve('typescript/bin/tsc'), '--project', tsconfigPath],
  { cwd: projectRoot, stdio: 'inherit' },
);

// tsc keeps "@/..." specifiers as-is, so point them at the compiled output.
const Module = require('module');
const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  const target = request.startsWith('@/') ? path.join(outDir, request.slice(2)) : request;
  return resolveFilename.call(this, target, ...rest);
};

const { buildOsmMapHtml } = require(
  path.join(outDir, 'components', 'dashboard', 'osmMapHtml.js'),
);

const html = buildOsmMapHtml({
  tileUrl: 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
  maxZoom: 20,
  colors: {
    background: '#E8EEF4',
    surface: '#FFFFFF',
    text: '#1A2B3C',
    textSecondary: '#5A6B7D',
  },
});

const region = {
  latitude: 44.08,
  longitude: -103.23,
  latitudeDelta: 0.35,
  longitudeDelta: 0.35,
};

const data = {
  markers: [
    { lat: 44.0805, lng: -103.231, title: 'Rapid City Hospital', description: 'Open · 24/7', icon: 'medical' },
    { lat: 44.09, lng: -103.2, title: 'Central Shelter', description: '120 beds available', icon: 'home' },
    { lat: 44.07, lng: -103.26, title: 'Supply Point', description: 'Water and food', icon: 'storefront' },
    { lat: 44.1, lng: -103.27, title: 'Outage Zone', description: '1,200 customers', icon: 'flash-outline' },
  ],
  heat: [
    { lat: 44.085, lng: -103.245, radius: 520, fill: 'rgb(183, 28, 28)', fillOpacity: 0.42, stroke: 'rgb(183, 28, 28)', strokeOpacity: 0.65 },
    { lat: 44.072, lng: -103.215, radius: 320, fill: 'rgb(255, 235, 59)', fillOpacity: 0.32, stroke: 'rgb(255, 193, 7)', strokeOpacity: 0.55 },
  ],
  polygons: [
    {
      coordinates: [
        [44.11, -103.29],
        [44.11, -103.24],
        [44.06, -103.24],
        [44.06, -103.29],
      ],
      fill: 'rgb(141, 110, 99)',
      fillOpacity: 0.25,
      stroke: 'rgb(141, 110, 99)',
      strokeOpacity: 0.7,
    },
  ],
};

const seeded = html.replace(
  '</head>',
  `<script>window.__INITIAL__ = ${JSON.stringify({ region, data })};</script></head>`,
);

const port = Number(process.argv[2] || 8099);
http
  .createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(seeded);
  })
  .listen(port, () => {
    console.log(`OSM map preview on http://localhost:${port} (${Math.round(seeded.length / 1024)} KB)`);
  });

/**
 * OSM-based raster tiles via CARTO CDN (no API key).
 *
 * tile.openstreetmap.org returns 403 for react-native-maps on Android because the
 * library sends a generic User-Agent that OSM has blocked for policy violations.
 * CARTO serves the same OpenStreetMap data and allows mobile app tile requests.
 *
 * @see https://operations.osmfoundation.org/policies/tiles/
 * @see https://carto.com/attributions/
 */
export const OSM_TILE_URL =
  'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';

export const OSM_TILE_MAX_ZOOM = 20;

export const OSM_ATTRIBUTION = '© OpenStreetMap contributors · © CARTO';

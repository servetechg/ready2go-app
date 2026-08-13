import leafletBundle from '@/vendor/leafletBundle.json';
import { OSM_TILE_MAX_ZOOM, OSM_TILE_URL } from '@/constants/openStreetMap';
import { palette } from '@/theme';

/**
 * Lightweight Leaflet map for the registration address picker.
 *
 * Renders a crisp SVG location pin (no broken image assets) with
 * draggable marker support, click-to-place, and RN bridge methods.
 */
export function buildAddressMapHtml(): string {
  const inlineJs = (source: string) => source.replace(/<\//g, '<\\/');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
<style>${leafletBundle.css}</style>
<style>
  html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; }
  body { overflow: hidden; -webkit-tap-highlight-color: transparent; }
  .leaflet-container { background: ${palette.borderLight}; outline: none; font-family: -apple-system, Roboto, system-ui, sans-serif; }
  .r2g-pin { width: 36px; height: 46px; display: flex; flex-direction: column; align-items: center; }
  .r2g-pin-head {
    width: 34px; height: 34px; border-radius: 17px; box-sizing: border-box;
    background: #1B4F8A; border: 2.5px solid #FFFFFF; color: #FFFFFF;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.4);
  }
  .r2g-pin-tail {
    width: 0; height: 0; margin-top: -2px;
    border-left: 7px solid transparent; border-right: 7px solid transparent;
    border-top: 10px solid #1B4F8A;
  }
</style>
</head>
<body>
<div id="map"></div>
<script>${inlineJs(leafletBundle.js)}<\/script>
<script>
(function () {
  var TILE_URL = ${JSON.stringify(OSM_TILE_URL)};
  var MAX_ZOOM = ${OSM_TILE_MAX_ZOOM};
  var initial = window.__INITIAL__ || {};

  function post(message) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(message));
    }
  }

  window.onerror = function (message) {
    post({ type: 'error', message: String(message) });
    return true;
  };

  var map = L.map('map', {
    zoomControl: false,
    attributionControl: false,
    zoomSnap: 0,
    zoomDelta: 1,
    minZoom: 2,
    maxZoom: MAX_ZOOM
  });

  L.tileLayer(TILE_URL, {
    maxZoom: MAX_ZOOM,
    tileSize: 256,
    keepBuffer: 2,
    updateWhenIdle: false
  }).addTo(map);

  var pinIcon = L.divIcon({
    html: '<div class="r2g-pin"><div class="r2g-pin-head"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="#FFFFFF"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div><div class="r2g-pin-tail"></div></div>',
    className: '',
    iconSize: [36, 46],
    iconAnchor: [18, 46]
  });

  var marker = null;

  function ensureMarker(lat, lng) {
    if (marker) {
      marker.setLatLng([lat, lng]);
    } else {
      marker = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(map);
      marker.on('dragend', function () {
        var pos = marker.getLatLng();
        post({ type: 'markerDragEnd', coordinate: { latitude: pos.lat, longitude: pos.lng } });
      });
    }
  }

  function toBounds(region) {
    var latPad = Math.max(region.latitudeDelta, 0.0001) / 2;
    var lngPad = Math.max(region.longitudeDelta, 0.0001) / 2;
    return L.latLngBounds(
      [region.latitude - latPad, region.longitude - lngPad],
      [region.latitude + latPad, region.longitude + lngPad]
    );
  }

  // Called from React Native to pan/zoom.
  window.__setView = function (region, duration) {
    var bounds = toBounds(region);
    if (duration > 0) {
      map.flyToBounds(bounds, { duration: duration / 1000 });
    } else {
      map.fitBounds(bounds, { animate: false });
    }
  };

  // Called from React Native to place/move the marker.
  window.__setMarker = function (lat, lng) {
    ensureMarker(lat, lng);
  };

  // Tap on the map → place marker + notify RN.
  map.on('click', function (event) {
    ensureMarker(event.latlng.lat, event.latlng.lng);
    post({
      type: 'markerDragEnd',
      coordinate: { latitude: event.latlng.lat, longitude: event.latlng.lng }
    });
  });

  window.addEventListener('resize', function () {
    map.invalidateSize();
  });

  // Initial state from RN.
  if (initial.region) {
    map.fitBounds(toBounds(initial.region), { animate: false });
  } else {
    map.setView([39.83, -98.58], 4);
  }
  if (initial.marker) {
    ensureMarker(initial.marker.latitude, initial.marker.longitude);
  }

  setTimeout(function () {
    map.invalidateSize();
  }, 0);

  post({ type: 'ready' });
})();
<\/script>
</body>
</html>`;
}

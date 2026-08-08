import leafletBundle from '@/vendor/leafletBundle.json';
import pinIcons from '@/vendor/mapPinIcons.json';

export interface OsmMapHtmlOptions {
  tileUrl: string;
  maxZoom: number;
  colors: {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
  };
}

/**
 * Self-contained Leaflet page for the OSM map. Everything it needs is inlined, so the
 * WebView never depends on a CDN or on a map SDK that has to authenticate an API key.
 *
 * Kept free of React Native imports so `scripts/preview-osm-map.js` can render the exact
 * same page in a browser for verification.
 */
export function buildOsmMapHtml({ tileUrl, maxZoom, colors }: OsmMapHtmlOptions): string {
  // A literal "</script>" inside an inline script would close the tag early.
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
  .leaflet-container { background: ${colors.background}; outline: none; font-family: -apple-system, Roboto, system-ui, sans-serif; }
  .r2g-pin { width: 40px; height: 50px; display: flex; flex-direction: column; align-items: center; }
  .r2g-pin-head {
    width: 40px; height: 40px; border-radius: 20px; box-sizing: border-box;
    background: ${colors.surface}; border: 1.5px solid #B0BEC5; color: ${colors.text};
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 3px rgba(0, 0, 0, 0.28);
  }
  .r2g-pin-tail {
    width: 0; height: 0; margin-top: -2px;
    border-left: 7px solid transparent; border-right: 7px solid transparent;
    border-top: 10px solid ${colors.surface};
  }
  .r2g-popup-title { font-size: 13px; font-weight: 600; color: ${colors.text}; }
  .r2g-popup-body { font-size: 12px; color: ${colors.textSecondary}; margin-top: 2px; }
  .leaflet-popup-content { margin: 8px 10px; }
  .leaflet-popup-content-wrapper { border-radius: 8px; }
</style>
</head>
<body>
<div id="map"></div>
<script>${inlineJs(leafletBundle.js)}</script>
<script>
(function () {
  var ICONS = ${JSON.stringify(pinIcons)};
  var TILE_URL = ${JSON.stringify(tileUrl)};
  var MAX_ZOOM = ${maxZoom};
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

  var shapeLayer = L.layerGroup().addTo(map);
  var markerLayer = L.layerGroup().addTo(map);
  var userLayer = L.layerGroup().addTo(map);

  function toBounds(region) {
    var latPad = Math.max(region.latitudeDelta, 0.0001) / 2;
    var lngPad = Math.max(region.longitudeDelta, 0.0001) / 2;
    return L.latLngBounds(
      [region.latitude - latPad, region.longitude - lngPad],
      [region.latitude + latPad, region.longitude + lngPad]
    );
  }

  function currentRegion() {
    var center = map.getCenter();
    var bounds = map.getBounds();
    return {
      latitude: center.lat,
      longitude: center.lng,
      latitudeDelta: Math.abs(bounds.getNorth() - bounds.getSouth()),
      longitudeDelta: Math.abs(bounds.getEast() - bounds.getWest())
    };
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function pinHtml(iconName) {
    var artwork = ICONS[iconName] || '';
    return '<div class="r2g-pin"><div class="r2g-pin-head">' +
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="22" height="22" fill="currentColor">' +
      artwork + '</svg></div><div class="r2g-pin-tail"></div></div>';
  }

  function popupHtml(marker) {
    var title = marker.title
      ? '<div class="r2g-popup-title">' + escapeHtml(marker.title) + '</div>'
      : '';
    var body = marker.description
      ? '<div class="r2g-popup-body">' + escapeHtml(marker.description) + '</div>'
      : '';
    return title + body;
  }

  // Heat circles sit under polygons; Leaflet keeps markers in a pane above both.
  window.__setData = function (data) {
    shapeLayer.clearLayers();
    markerLayer.clearLayers();

    (data.heat || []).forEach(function (circle) {
      L.circle([circle.lat, circle.lng], {
        radius: circle.radius,
        color: circle.stroke,
        opacity: circle.strokeOpacity,
        weight: 1,
        fillColor: circle.fill,
        fillOpacity: circle.fillOpacity,
        interactive: false
      }).addTo(shapeLayer);
    });

    (data.polygons || []).forEach(function (polygon) {
      L.polygon(polygon.coordinates, {
        color: polygon.stroke,
        opacity: polygon.strokeOpacity,
        weight: 2,
        fillColor: polygon.fill,
        fillOpacity: polygon.fillOpacity,
        interactive: false
      }).addTo(shapeLayer);
    });

    (data.markers || []).forEach(function (marker) {
      var pin = L.marker([marker.lat, marker.lng], {
        icon: L.divIcon({
          html: pinHtml(marker.icon),
          className: '',
          iconSize: [40, 50],
          iconAnchor: [20, 50],
          popupAnchor: [0, -46]
        }),
        keyboard: false,
        title: marker.title || ''
      });
      if (marker.title || marker.description) {
        pin.bindPopup(popupHtml(marker), { closeButton: false });
      }
      pin.addTo(markerLayer);
    });
  };

  window.__setView = function (region, duration) {
    var bounds = toBounds(region);
    if (duration > 0) {
      map.flyToBounds(bounds, { duration: duration / 1000 });
    } else {
      map.fitBounds(bounds, { animate: false });
    }
  };

  window.__setUserLocation = function (location) {
    userLayer.clearLayers();
    if (!location) return;
    if (location.accuracy > 0) {
      L.circle([location.lat, location.lng], {
        radius: location.accuracy,
        weight: 0,
        fillColor: '#4285F4',
        fillOpacity: 0.15,
        interactive: false
      }).addTo(userLayer);
    }
    L.circleMarker([location.lat, location.lng], {
      radius: 7,
      color: '#FFFFFF',
      weight: 3,
      fillColor: '#4285F4',
      fillOpacity: 1,
      interactive: false
    }).addTo(userLayer);
  };

  map.on('moveend', function () {
    post({ type: 'region', region: currentRegion() });
  });

  map.on('click', function (event) {
    post({
      type: 'press',
      coordinate: { latitude: event.latlng.lat, longitude: event.latlng.lng }
    });
  });

  window.addEventListener('resize', function () {
    map.invalidateSize();
  });

  if (initial.region) {
    map.fitBounds(toBounds(initial.region), { animate: false });
  } else {
    map.setView([0, 0], 2);
  }
  if (initial.data) {
    window.__setData(initial.data);
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

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
  .r2g-pin {
    display: flex;
    flex-direction: column;
    align-items: center;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.28));
  }
  .r2g-pin-head {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #ffffff;
    color: #ffffff;
  }
  .r2g-pin--alert {
    width: 26px;
    height: 26px;
  }
  .r2g-pin--alert .r2g-pin-head {
    width: 26px;
    height: 26px;
    border-radius: 13px;
  }
  .r2g-pin--home {
    width: 28px;
    height: 28px;
  }
  .r2g-pin--home .r2g-pin-head {
    width: 28px;
    height: 28px;
    border-radius: 14px;
    background: #1a73e8;
    border-color: #ffffff;
    color: #ffffff;
  }
  .r2g-pin--default {
    width: 30px;
    height: 38px;
  }
  .r2g-pin--default .r2g-pin-head {
    width: 30px;
    height: 30px;
    border-radius: 15px;
  }
  .r2g-pin-tail {
    width: 0;
    height: 0;
    margin-top: -2px;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 8px solid var(--pin-color, ${colors.surface});
  }
  .r2g-popup-title {
    font-size: 13px;
    font-weight: 600;
    color: ${colors.text};
    padding-right: 20px;
    line-height: 1.3;
  }
  .r2g-popup-body {
    font-size: 12px;
    color: ${colors.textSecondary};
    margin-top: 4px;
    max-height: 110px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y;
    overscroll-behavior: contain;
    line-height: 1.45;
    word-break: break-word;
    padding-right: 4px;
  }
  .r2g-popup-body::-webkit-scrollbar {
    width: 4px;
  }
  .r2g-popup-body::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.25);
    border-radius: 4px;
  }
  .leaflet-popup-content {
    margin: 10px 12px;
    max-width: 240px;
    box-sizing: border-box;
  }
  .leaflet-popup-content-wrapper {
    border-radius: 10px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  }
  .leaflet-popup-close-button {
    top: 8px !important;
    right: 8px !important;
    width: 22px !important;
    height: 22px !important;
    line-height: 20px !important;
    font-size: 16px !important;
    color: ${colors.textSecondary} !important;
    text-decoration: none !important;
    text-align: center;
    border-radius: 11px;
    background: rgba(0, 0, 0, 0.05);
    display: flex !important;
    align-items: center;
    justify-content: center;
  }
  .leaflet-popup-close-button:hover,
  .leaflet-popup-close-button:active {
    background: rgba(0, 0, 0, 0.12);
    color: ${colors.text} !important;
  }
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

  var markerPane = map.createPane('r2gMarkers');
  markerPane.style.zIndex = '650';
  var userPane = map.createPane('r2gUser');
  userPane.style.zIndex = '700';

  var shapeLayer = L.layerGroup().addTo(map);
  var markerLayer = L.layerGroup().addTo(map);
  var userLayer = L.layerGroup().addTo(map);

  function isValidLatLng(lat, lng) {
    var la = Number(lat);
    var ln = Number(lng);
    return isFinite(la) && isFinite(ln) && (la !== 0 || ln !== 0) && la >= -90 && la <= 90 && ln >= -180 && ln <= 180;
  }

  function isValidRegion(region) {
    if (!region) return false;
    if (!isValidLatLng(region.latitude, region.longitude)) return false;
    var latDelta = Number(region.latitudeDelta);
    var lngDelta = Number(region.longitudeDelta);
    return isFinite(latDelta) && isFinite(lngDelta) && latDelta > 0 && lngDelta > 0;
  }

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

  function pinVariant(layer) {
    if (layer === 'alerts') return 'alert';
    if (layer === 'home') return 'home';
    return 'default';
  }

  function pinLayout(variant) {
    if (variant === 'alert') {
      return { className: 'r2g-pin r2g-pin--alert', iconSize: 13, boxW: 26, boxH: 26, anchorY: 26, popupY: -28, tail: false };
    }
    if (variant === 'home') {
      return { className: 'r2g-pin r2g-pin--home', iconSize: 14, boxW: 28, boxH: 28, anchorY: 28, popupY: -30, tail: false };
    }
    return { className: 'r2g-pin r2g-pin--default', iconSize: 15, boxW: 30, boxH: 38, anchorY: 38, popupY: -36, tail: true };
  }

  function pinHtml(iconName, options) {
    options = options || {};
    var variant = options.variant || 'default';
    var color = options.color || '#546E7A';
    var layout = pinLayout(variant);
    var artwork = ICONS[iconName] || ICONS.warning || '';
    var headStyle = 'background:' + color + ';';
    if (variant === 'home') {
      headStyle = '';
    }
    var tail = layout.tail
      ? '<div class="r2g-pin-tail" style="--pin-color:' + color + ';"></div>'
      : '';
    return '<div class="' + layout.className + '" style="--pin-color:' + color + ';">' +
      '<div class="r2g-pin-head" style="' + headStyle + '">' +
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="' + layout.iconSize + '" height="' + layout.iconSize + '" fill="currentColor">' +
      artwork + '</svg></div>' + tail + '</div>';
  }

  function markerIcon(marker) {
    var variant = pinVariant(marker.layer);
    var layout = pinLayout(variant);
    return {
      html: pinHtml(marker.icon, { variant: variant, color: marker.color }),
      iconSize: [layout.boxW, layout.boxH],
      iconAnchor: [layout.boxW / 2, layout.anchorY],
      popupAnchor: [0, layout.popupY]
    };
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
      if (!isValidLatLng(circle.lat, circle.lng)) return;
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
      var ring = (polygon.coordinates || []).filter(function (point) {
        return Array.isArray(point) && isValidLatLng(point[0], point[1]);
      });
      if (ring.length < 3) return;
      L.polygon(ring, {
        color: polygon.stroke,
        opacity: polygon.strokeOpacity,
        weight: 2,
        fillColor: polygon.fill,
        fillOpacity: polygon.fillOpacity,
        interactive: false
      }).addTo(shapeLayer);
    });

    (data.markers || []).forEach(function (marker) {
      if (!isValidLatLng(marker.lat, marker.lng)) return;
      var iconSpec = markerIcon(marker);
      var pin = L.marker([marker.lat, marker.lng], {
        pane: 'r2gMarkers',
        icon: L.divIcon({
          html: iconSpec.html,
          className: '',
          iconSize: iconSpec.iconSize,
          iconAnchor: iconSpec.iconAnchor,
          popupAnchor: iconSpec.popupAnchor
        }),
        keyboard: false,
        title: marker.title || '',
        zIndexOffset: marker.layer === 'alerts' ? 300 : 200
      });
      if (marker.title || marker.description) {
        pin.bindPopup(popupHtml(marker), {
          closeButton: true,
          maxWidth: 240,
          minWidth: 160,
          maxHeight: 140,
          autoPan: true,
          autoPanPadding: [16, 16]
        });
        pin.on('popupopen', function (e) {
          var el = e.popup && e.popup.getElement();
          if (el) {
            L.DomEvent.disableScrollPropagation(el);
          }
        });
      }
      pin.addTo(markerLayer);
    });
  };

  window.__setView = function (region, duration) {
    if (!isValidRegion(region)) return;
    var bounds = toBounds(region);
    if (duration > 0) {
      map.flyToBounds(bounds, { duration: duration / 1000 });
    } else {
      map.fitBounds(bounds, { animate: false });
    }
  };

  window.__setUserLocation = function (location) {
    userLayer.clearLayers();
    if (!location || !isValidLatLng(location.lat, location.lng)) return;
    if (location.accuracy > 0) {
      L.circle([location.lat, location.lng], {
        radius: location.accuracy,
        weight: 0,
        fillColor: '#4285F4',
        fillOpacity: 0.15,
        interactive: false
      }).addTo(userLayer);
    }
    var homeIcon = markerIcon({ icon: 'home', color: '#1a73e8', layer: 'home' });
    L.marker([location.lat, location.lng], {
      pane: 'r2gUser',
      icon: L.divIcon({
        html: homeIcon.html,
        className: '',
        iconSize: homeIcon.iconSize,
        iconAnchor: homeIcon.iconAnchor,
        popupAnchor: homeIcon.popupAnchor
      }),
      keyboard: false,
      interactive: true,
      zIndexOffset: 2000
    })
      .on('click', function (event) {
        L.DomEvent.stopPropagation(event);
      })
      .addTo(userLayer);
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

  if (initial.region && isValidRegion(initial.region)) {
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

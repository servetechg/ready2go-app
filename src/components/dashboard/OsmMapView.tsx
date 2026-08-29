import * as Location from 'expo-location';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { buildOsmMapHtml } from '@/components/dashboard/osmMapHtml';
import { getMapLayerConfig } from '@/constants/mapLayers';
import { OSM_TILE_MAX_ZOOM, OSM_TILE_URL } from '@/constants/openStreetMap';
import { palette } from '@/theme';
import type { MapMarkerPoint, MapPolygonOverlay } from '@/types/emergency';
import { heatmapCircleStyle, overlayColors, resolveMarkerLayer } from '@/utils/mapLayers';
import type { HeatmapPoint } from '@/utils/mapLayers';
import { isValidLatLng, isValidMapRegion, sanitizeMapRegion } from '@/utils/mapRegion';

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface OsmMapHandle {
  animateToRegion: (region: MapRegion, duration?: number) => void;
}

interface OsmMapViewProps {
  initialRegion: MapRegion;
  pointMarkers: MapMarkerPoint[];
  heatmapPoints: HeatmapPoint[];
  overlays: MapPolygonOverlay[];
  style?: StyleProp<ViewStyle>;
  showsUserLocation?: boolean;
  staticUserLocation?: { latitude?: number; longitude?: number };
  onRegionChangeComplete?: (region: MapRegion) => void;
  onPress?: (coordinate: { latitude: number; longitude: number }) => void;
}

/** SVG paints colour and alpha separately, so split the rgba()/#rrggbbaa values apart. */
function splitColor(value: string): { color: string; opacity: number } {
  const rgba = /^rgba?\(([^)]+)\)$/i.exec(value.trim());
  if (rgba) {
    const parts = rgba[1].split(',').map((part) => part.trim());
    const alpha = parts.length > 3 ? Number(parts[3]) : 1;
    return {
      color: `rgb(${parts.slice(0, 3).join(',')})`,
      opacity: Number.isFinite(alpha) ? alpha : 1,
    };
  }

  const hexWithAlpha = /^#([0-9a-f]{6})([0-9a-f]{2})$/i.exec(value.trim());
  if (hexWithAlpha) {
    return { color: `#${hexWithAlpha[1]}`, opacity: parseInt(hexWithAlpha[2], 16) / 255 };
  }

  return { color: value, opacity: 1 };
}

const MAP_HTML = buildOsmMapHtml({
  tileUrl: OSM_TILE_URL,
  maxZoom: OSM_TILE_MAX_ZOOM,
  colors: {
    background: palette.borderLight,
    surface: palette.white,
    text: palette.text,
    textSecondary: palette.textSecondary,
  },
});

export const OsmMapView = forwardRef<OsmMapHandle, OsmMapViewProps>(function OsmMapView(
  {
    initialRegion,
    pointMarkers,
    heatmapPoints,
    overlays,
    style,
    showsUserLocation = false,
    staticUserLocation,
    onRegionChangeComplete,
    onPress,
  },
  ref,
) {
  const webRef = useRef<WebView>(null);
  const readyRef = useRef(false);
  // The map must not reload when props change, so the first region is all the page ever gets.
  const mountRegionRef = useRef(sanitizeMapRegion(initialRegion));

  const mapData = useMemo(
    () => ({
      markers: pointMarkers
        .map((marker) => {
          const layer = resolveMarkerLayer(marker);
          const config = getMapLayerConfig(layer);
          return {
            lat: marker.latitude,
            lng: marker.longitude,
            title: marker.title,
            description: marker.description ?? '',
            icon: config.icon,
            color: config.color,
            layer,
          };
        })
        .filter((marker) => isValidLatLng(marker.lat, marker.lng)),
      heat: heatmapPoints
        .filter((point) => isValidLatLng(point.latitude, point.longitude))
        .map((point) => {
        const circle = heatmapCircleStyle(point.weight ?? 1);
        const fill = splitColor(circle.fill);
        const stroke = splitColor(circle.stroke);
        return {
          lat: point.latitude,
          lng: point.longitude,
          radius: circle.radius,
          fill: fill.color,
          fillOpacity: fill.opacity,
          stroke: stroke.color,
          strokeOpacity: stroke.opacity,
        };
      }),
      polygons: overlays.map((overlay) => {
        const defaults = overlayColors(overlay.layer);
        const fill = splitColor(overlay.fillColor ?? defaults.fill);
        const stroke = splitColor(overlay.strokeColor ?? defaults.stroke);
        return {
          coordinates: overlay.coordinates
            .filter((point) => isValidLatLng(point.latitude, point.longitude))
            .map((point) => [point.latitude, point.longitude]),
          fill: fill.color,
          fillOpacity: fill.opacity,
          stroke: stroke.color,
          strokeOpacity: stroke.opacity,
        };
      }).filter((overlay) => overlay.coordinates.length >= 3),
    }),
    [pointMarkers, heatmapPoints, overlays],
  );

  const run = useCallback((script: string) => {
    webRef.current?.injectJavaScript(`${script};true;`);
  }, []);

  useEffect(() => {
    if (!readyRef.current) return;
    run(`window.__setData(${JSON.stringify(mapData)})`);
  }, [mapData, run]);

  useEffect(() => {
    if (!readyRef.current) return;
    const lat = staticUserLocation?.latitude;
    const lng = staticUserLocation?.longitude;
    if (!isValidLatLng(lat, lng)) {
      return;
    }
    run(
      `window.__setUserLocation(${JSON.stringify({
        lat,
        lng,
        accuracy: 0,
      })})`,
    );
  }, [staticUserLocation?.latitude, staticUserLocation?.longitude, run]);

  useImperativeHandle(
    ref,
    () => ({
      animateToRegion: (region, duration = 0) => {
        if (!isValidMapRegion(region)) return;
        run(`window.__setView(${JSON.stringify(sanitizeMapRegion(region))}, ${duration})`);
      },
    }),
    [run],
  );

  useEffect(() => {
    if (!showsUserLocation) return;
    if (staticUserLocation && isValidLatLng(staticUserLocation.latitude, staticUserLocation.longitude)) {
      return;
    }

    let subscription: Location.LocationSubscription | undefined;
    let cancelled = false;

    void (async () => {
      // Request permission here to ensure user location can be shown when they view the map
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted || cancelled) return;

      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 10 },
        (position) => {
          if (!isValidLatLng(position.coords.latitude, position.coords.longitude)) return;
          run(
            `window.__setUserLocation(${JSON.stringify({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy ?? 0,
            })})`,
          );
        },
      );
      if (cancelled) subscription.remove();
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [showsUserLocation, staticUserLocation, run]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let message: {
        type?: string;
        region?: MapRegion;
        coordinate?: { latitude: number; longitude: number };
        message?: string;
      };
      try {
        message = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }

      switch (message.type) {
        case 'ready': {
          readyRef.current = true;
          let initScript = `window.__setData(${JSON.stringify(mapData)});`;
          if (staticUserLocation && isValidLatLng(staticUserLocation.latitude, staticUserLocation.longitude)) {
            initScript += `window.__setUserLocation(${JSON.stringify({
              lat: staticUserLocation.latitude,
              lng: staticUserLocation.longitude,
              accuracy: 0,
            })});`;
          }
          run(initScript);
          break;
        }
        case 'region':
          if (message.region) onRegionChangeComplete?.(message.region);
          break;
        case 'press':
          if (message.coordinate) onPress?.(message.coordinate);
          break;
        case 'error':
          console.warn(`[OsmMapView] ${message.message}`);
          break;
      }
    },
    [mapData, staticUserLocation, onPress, onRegionChangeComplete, run],
  );

  // Claim the touch stream so the surrounding ScrollView cannot steal vertical pans.
  const nativeGesture = useMemo(
    () => Gesture.Native().shouldActivateOnStart(true).disallowInterruption(true),
    [],
  );

  return (
    <View style={[styles.container, style]}>
      <GestureDetector gesture={nativeGesture}>
        <WebView
          ref={webRef}
          style={styles.webview}
          source={{ html: MAP_HTML, baseUrl: 'https://localhost' }}
          injectedJavaScriptBeforeContentLoaded={`window.__INITIAL__ = ${JSON.stringify({
            region: mountRegionRef.current,
          })};true;`}
          onMessage={handleMessage}
          originWhitelist={['*']}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          scrollEnabled={false}
          overScrollMode="never"
          bounces={false}
          nestedScrollEnabled={true}
          setBuiltInZoomControls={false}
          androidLayerType="hardware"
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          allowsBackForwardNavigationGestures={false}
          onError={({ nativeEvent }) => console.warn('[OsmMapView] load failed', nativeEvent)}
        />
      </GestureDetector>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { overflow: 'hidden', backgroundColor: palette.borderLight },
  webview: { flex: 1, backgroundColor: 'transparent' },
});

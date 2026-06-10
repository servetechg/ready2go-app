import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import MapView, { Marker, Polygon, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapLayersPanel } from '@/components/dashboard/MapLayersPanel';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { ENV } from '@/constants/env';
import { DEFAULT_GIS_LAYER_STATE } from '@/constants/mapLayers';
import { useAppTheme } from '@/hooks/useAppTheme';
import { borderRadius, palette, shadows, spacing } from '@/theme';
import type { GisMapLayerId, MapMarkerPoint, MapPolygonOverlay } from '@/types/emergency';
import {
  filterMarkersByLayers,
  filterOverlaysByLayers,
  getMarkerPinColor,
  normalizeMapMarkers,
  overlayColors,
  resolveMarkerLayer,
} from '@/utils/mapLayers';

interface EmergencyMapProps {
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  markers: MapMarkerPoint[];
  overlays?: MapPolygonOverlay[];
  /** situation = cloudy emergency; area = normal day map centered on user */
  variant?: 'situation' | 'area';
}

type MapControlAction = 'zoomIn' | 'zoomOut' | 'recenter' | 'maximize' | 'minimize' | 'layers';

interface MapControlsProps {
  onAction: (action: MapControlAction) => void;
  fullscreen?: boolean;
  layersOpen?: boolean;
  style?: ViewStyle;
}

function MapControls({ onAction, fullscreen = false, layersOpen = false, style }: MapControlsProps) {
  const { colors } = useAppTheme();

  const buttons: {
    action: MapControlAction;
    icon: keyof typeof Ionicons.glyphMap;
    active?: boolean;
  }[] = fullscreen
    ? [
        { action: 'layers', icon: 'layers-outline', active: layersOpen },
        { action: 'zoomIn', icon: 'add' },
        { action: 'zoomOut', icon: 'remove' },
        { action: 'recenter', icon: 'locate' },
        { action: 'minimize', icon: 'contract' },
      ]
    : [
        { action: 'layers', icon: 'layers-outline', active: layersOpen },
        { action: 'zoomIn', icon: 'add' },
        { action: 'zoomOut', icon: 'remove' },
        { action: 'recenter', icon: 'locate' },
        { action: 'maximize', icon: 'expand' },
      ];

  return (
    <View style={[styles.controls, style]}>
      {buttons.map(({ action, icon, active }) => (
        <Pressable
          key={action}
          onPress={() => onAction(action)}
          style={({ pressed }) => [
            styles.controlBtn,
            shadows.sm,
            {
              backgroundColor: active ? colors.primary : colors.surface,
              borderColor: active ? colors.primary : palette.borderLight,
            },
            pressed && styles.controlBtnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={action}>
          <Ionicons name={icon} size={18} color={active ? palette.white : colors.text} />
        </Pressable>
      ))}
    </View>
  );
}

interface MapCanvasProps {
  region: Region;
  markers: MapMarkerPoint[];
  overlays: MapPolygonOverlay[];
  mapRef: React.RefObject<MapView | null>;
  mapStyle: ViewStyle;
  onRegionChangeComplete: (next: Region) => void;
}

function MapCanvas({
  region,
  markers,
  overlays,
  mapRef,
  mapStyle,
  onRegionChangeComplete,
}: MapCanvasProps) {
  return (
    <MapView
      ref={mapRef}
      style={mapStyle}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      initialRegion={region}
      onRegionChangeComplete={onRegionChangeComplete}
      showsUserLocation={true}
      showsCompass={true}
      showsMyLocationButton={false}
      toolbarEnabled={false}>
      {overlays.map((overlay) => {
        const colors = overlayColors(overlay.layer);
        return (
          <Polygon
            key={overlay.id}
            coordinates={overlay.coordinates}
            fillColor={overlay.fillColor ?? colors.fill}
            strokeColor={overlay.strokeColor ?? colors.stroke}
            strokeWidth={2}
          />
        );
      })}
      {markers.map((marker) => {
        const layer = resolveMarkerLayer(marker);
        return (
          <Marker
            key={marker.id}
            coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
            title={marker.title}
            description={marker.description}
            pinColor={getMarkerPinColor(layer)}
          />
        );
      })}
    </MapView>
  );
}

export function EmergencyMap({
  region: initialRegion,
  markers,
  overlays = [],
  variant = 'situation',
}: EmergencyMapProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const hasKey = Boolean(ENV.GOOGLE_MAPS_API_KEY);
  const mapRef = useRef<MapView>(null);
  const fullscreenMapRef = useRef<MapView>(null);
  const [mapRegion, setMapRegion] = useState<Region>(initialRegion);
  const [fullscreen, setFullscreen] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const [enabledLayers, setEnabledLayers] =
    useState<Record<GisMapLayerId, boolean>>(DEFAULT_GIS_LAYER_STATE);

  const normalizedMarkers = useMemo(() => normalizeMapMarkers(markers), [markers]);
  const visibleMarkers = useMemo(
    () => filterMarkersByLayers(normalizedMarkers, enabledLayers),
    [normalizedMarkers, enabledLayers],
  );
  const visibleOverlays = useMemo(
    () => filterOverlaysByLayers(overlays, enabledLayers),
    [overlays, enabledLayers],
  );

  const toggleLayer = useCallback((layerId: GisMapLayerId) => {
    setEnabledLayers((prev) => ({ ...prev, [layerId]: !prev[layerId] }));
  }, []);

  const applyZoom = useCallback(
    (factor: number, ref: React.RefObject<MapView | null>) => {
      const next: Region = {
        ...mapRegion,
        latitudeDelta: Math.min(Math.max(mapRegion.latitudeDelta * factor, 0.002), 2),
        longitudeDelta: Math.min(Math.max(mapRegion.longitudeDelta * factor, 0.002), 2),
      };
      setMapRegion(next);
      ref.current?.animateToRegion(next, 250);
    },
    [mapRegion],
  );

  const handleControl = useCallback(
    (action: MapControlAction, ref: React.RefObject<MapView | null>) => {
      switch (action) {
        case 'zoomIn':
          applyZoom(0.5, ref);
          break;
        case 'zoomOut':
          applyZoom(2, ref);
          break;
        case 'recenter':
          setMapRegion(initialRegion);
          ref.current?.animateToRegion(initialRegion, 300);
          break;
        case 'maximize':
          setFullscreen(true);
          break;
        case 'minimize':
          setFullscreen(false);
          setLayersOpen(false);
          break;
        case 'layers':
          setLayersOpen((open) => !open);
          break;
      }
    },
    [applyZoom, initialRegion],
  );

  const renderMapSection = (
    ref: React.RefObject<MapView | null>,
    mapStyle: ViewStyle,
    isFullscreen = false,
  ) => (
    <View style={isFullscreen ? styles.fullscreenMapWrap : styles.mapWrap}>
      <MapCanvas
        region={mapRegion}
        markers={visibleMarkers}
        overlays={visibleOverlays}
        mapRef={ref}
        mapStyle={mapStyle}
        onRegionChangeComplete={setMapRegion}
      />
      <MapControls
        fullscreen={isFullscreen}
        layersOpen={layersOpen}
        onAction={(action) => handleControl(action, ref)}
        style={styles.controlsOverlay}
      />
      {layersOpen ? (
        <View style={styles.layersPanelOverlay}>
          <MapLayersPanel
            enabledLayers={enabledLayers}
            onToggleLayer={toggleLayer}
            onClose={() => setLayersOpen(false)}
          />
        </View>
      ) : null}
    </View>
  );

  const isAreaMap = variant === 'area';
  const mapTitle = isAreaMap ? 'Area map' : 'GIS incident map';
  const mapSubtitle = isAreaMap
    ? 'Infrastructure and resources near your registered address. Toggle layers to explore.'
    : 'Toggle roads, hospitals, shelters, outages, and other infrastructure layers.';
  const fullscreenTitle = isAreaMap ? 'Area map' : 'Situation map';

  if (Platform.OS === 'web') {
    return (
      <AppCard>
        <AppText variant="body" color={colors.textSecondary}>
          Map view is available on iOS and Android. Open the app on a device to view the GIS map.
        </AppText>
      </AppCard>
    );
  }

  if (!hasKey) {
    return (
      <AppCard>
        <View style={styles.warnRow}>
          <Ionicons name="warning-outline" size={22} color={palette.warning} />
          <AppText variant="bodySmall" color={colors.textSecondary} style={styles.warnText}>
            Add GOOGLE_MAPS_API_KEY to your .env file and restart Expo to enable the map.
          </AppText>
        </View>
      </AppCard>
    );
  }

  return (
    <View>
      <AppText variant="h3" style={styles.title}>
        {mapTitle}
      </AppText>
      <AppText variant="bodySmall" color={colors.textSecondary} style={styles.subtitle}>
        {mapSubtitle}
      </AppText>
      {renderMapSection(mapRef, styles.map)}

      <Modal
        visible={fullscreen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setFullscreen(false)}>
        <View style={[styles.fullscreenRoot, { paddingTop: insets.top }]}>
          <View style={styles.fullscreenHeader}>
            <AppText variant="h3">{fullscreenTitle}</AppText>
            <Pressable
              onPress={() => {
                setFullscreen(false);
                setLayersOpen(false);
              }}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close map">
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
          {renderMapSection(fullscreenMapRef, styles.fullscreenMap, true)}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: spacing.xs },
  subtitle: { marginBottom: spacing.md },
  mapWrap: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.borderLight,
    position: 'relative',
  },
  map: { width: '100%', height: 280 },
  controlsOverlay: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  layersPanelOverlay: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    zIndex: 20,
  },
  controls: {
    gap: spacing.xs,
  },
  controlBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  controlBtnPressed: { opacity: 0.85 },
  warnRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  warnText: { flex: 1 },
  fullscreenRoot: {
    flex: 1,
    backgroundColor: palette.white,
  },
  fullscreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderLight,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenMapWrap: {
    flex: 1,
    position: 'relative',
  },
  fullscreenMap: { width: '100%', height: '100%' },
});

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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapIncidentDetailCard } from '@/components/dashboard/MapIncidentDetailCard';
import { MapLayersPanel } from '@/components/dashboard/MapLayersPanel';
import {
  OsmMapView,
  type MapRegion as Region,
  type OsmMapHandle,
} from '@/components/dashboard/OsmMapView';
import { AppText } from '@/components/ui/AppText';
import { DEFAULT_GIS_LAYER_STATE } from '@/constants/mapLayers';
import { OSM_ATTRIBUTION } from '@/constants/openStreetMap';
import { useAppTheme } from '@/hooks/useAppTheme';
import { borderRadius, palette, shadows, spacing } from '@/theme';
import type { GisMapLayerId, MapMarkerPoint, MapPolygonOverlay } from '@/types/emergency';
import { findNearestMapMarker, heatmapTapThresholdDegrees } from '@/utils/mapGeo';
import {
  buildHeatmapPoints,
  filterIncidentMarkersForHeatmap,
  filterOverlaysByLayers,
  filterPointMarkersForMap,
  normalizeMapMarkers,
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
  pointMarkers: MapMarkerPoint[];
  incidentMarkers: MapMarkerPoint[];
  heatmapPoints: Array<{ latitude: number; longitude: number; weight: number }>;
  overlays: MapPolygonOverlay[];
  mapRef: React.RefObject<OsmMapHandle | null>;
  mapStyle: ViewStyle;
  onRegionChangeComplete: (next: Region) => void;
  onIncidentTap: (incident: MapMarkerPoint | null) => void;
}

function MapCanvas({
  region,
  pointMarkers,
  incidentMarkers,
  heatmapPoints,
  overlays,
  mapRef,
  mapStyle,
  onRegionChangeComplete,
  onIncidentTap,
}: MapCanvasProps) {
  const handleMapPress = useCallback(
    (coordinate: { latitude: number; longitude: number }) => {
      if (incidentMarkers.length === 0) {
        onIncidentTap(null);
        return;
      }
      const { latitude, longitude } = coordinate;
      const threshold = heatmapTapThresholdDegrees(region.latitudeDelta, region.longitudeDelta);
      const nearest = findNearestMapMarker(incidentMarkers, latitude, longitude, threshold);
      onIncidentTap(nearest);
    },
    [incidentMarkers, onIncidentTap, region.latitudeDelta, region.longitudeDelta],
  );

  return (
    <OsmMapView
      ref={mapRef}
      style={mapStyle}
      initialRegion={region}
      pointMarkers={pointMarkers}
      heatmapPoints={heatmapPoints}
      overlays={overlays}
      showsUserLocation={true}
      onRegionChangeComplete={onRegionChangeComplete}
      onPress={handleMapPress}
    />
  );
}

export function EmergencyMap({
  region: initialRegion,
  markers = [],
  overlays = [],
  variant = 'situation',
}: EmergencyMapProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<OsmMapHandle>(null);
  const fullscreenMapRef = useRef<OsmMapHandle>(null);
  const [mapRegion, setMapRegion] = useState<Region>(initialRegion);
  const [fullscreen, setFullscreen] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<MapMarkerPoint | null>(null);
  const [enabledLayers, setEnabledLayers] =
    useState<Record<GisMapLayerId, boolean>>(DEFAULT_GIS_LAYER_STATE);

  const normalizedMarkers = useMemo(() => normalizeMapMarkers(markers), [markers]);
  const pointMarkers = useMemo(
    () => filterPointMarkersForMap(normalizedMarkers, enabledLayers),
    [normalizedMarkers, enabledLayers],
  );
  const incidentMarkers = useMemo(
    () => filterIncidentMarkersForHeatmap(normalizedMarkers, enabledLayers),
    [normalizedMarkers, enabledLayers],
  );
  const heatmapPoints = useMemo(
    () => buildHeatmapPoints(normalizedMarkers, enabledLayers),
    [normalizedMarkers, enabledLayers],
  );
  const visibleOverlays = useMemo(
    () => filterOverlaysByLayers(overlays, enabledLayers),
    [overlays, enabledLayers],
  );

  const handleIncidentTap = useCallback((incident: MapMarkerPoint | null) => {
    setSelectedIncident(incident);
  }, []);

  const toggleLayer = useCallback((layerId: GisMapLayerId) => {
    setEnabledLayers((prev) => ({ ...prev, [layerId]: !prev[layerId] }));
    setSelectedIncident(null);
  }, []);

  const applyZoom = useCallback(
    (factor: number, ref: React.RefObject<OsmMapHandle | null>) => {
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
    (action: MapControlAction, ref: React.RefObject<OsmMapHandle | null>) => {
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
          setSelectedIncident(null);
          break;
        case 'maximize':
          setFullscreen(true);
          break;
        case 'minimize':
          setFullscreen(false);
          setLayersOpen(false);
          setSelectedIncident(null);
          break;
        case 'layers':
          setLayersOpen((open) => !open);
          break;
      }
    },
    [applyZoom, initialRegion],
  );

  const renderMapSection = (
    ref: React.RefObject<OsmMapHandle | null>,
    mapStyle: ViewStyle,
    isFullscreen = false,
  ) => (
    <View style={isFullscreen ? styles.fullscreenMapWrap : styles.mapWrap}>
      <View style={isFullscreen ? styles.fullscreenMapClip : styles.mapClip}>
        <MapCanvas
          region={mapRegion}
          pointMarkers={pointMarkers}
          incidentMarkers={incidentMarkers}
          heatmapPoints={heatmapPoints}
          overlays={visibleOverlays}
          mapRef={ref}
          mapStyle={mapStyle}
          onRegionChangeComplete={setMapRegion}
          onIncidentTap={handleIncidentTap}
        />
        <View style={styles.attribution} pointerEvents="none">
          <AppText variant="caption" style={styles.attributionText}>
            {OSM_ATTRIBUTION}
          </AppText>
        </View>
      </View>
      <MapControls
        fullscreen={isFullscreen}
        layersOpen={layersOpen}
        onAction={(action) => handleControl(action, ref)}
        style={styles.controlsOverlay}
      />
      {layersOpen ? (
        <View style={styles.layersPanelOverlay} pointerEvents="box-none">
          <MapLayersPanel
            enabledLayers={enabledLayers}
            onToggleLayer={toggleLayer}
            onClose={() => setLayersOpen(false)}
            panelHeight={isFullscreen ? 420 : 248}
          />
        </View>
      ) : null}
      {selectedIncident ? (
        <MapIncidentDetailCard
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
        />
      ) : null}
    </View>
  );

  const isAreaMap = variant === 'area';
  const mapTitle = isAreaMap ? 'Area Map' : 'Situation Map';
  const mapSubtitle = isAreaMap
    ? 'OpenStreetMap Â· Tap heat areas for incident details. Layer pins show hospitals, shelters, and resources.'
    : 'OpenStreetMap Â· Tap heat areas for incident info. Toggle layers for flood zones, hospitals, and more.';
  const fullscreenTitle = mapTitle;

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webFallback}>
        <AppText variant="body" color={colors.textSecondary}>
          Map view is available on iOS and Android. Open the app on a device to view the map.
        </AppText>
      </View>
    );
  }

  return (
    <View>
      <AppText variant="h3" color={colors.primary} style={styles.title}>
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
                setSelectedIncident(null);
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
  title: { marginTop: spacing.md, marginBottom: spacing.xs },
  subtitle: { marginBottom: spacing.md },
  webFallback: { paddingVertical: spacing.md },
  mapWrap: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: palette.borderLight,
    position: 'relative',
  },
  mapClip: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  map: { width: '100%', height: 280 },
  fullscreenMapClip: {
    flex: 1,
    overflow: 'hidden',
  },
  attribution: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.88)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    zIndex: 5,
  },
  attributionText: {
    fontSize: 9,
    color: palette.textSecondary,
  },
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

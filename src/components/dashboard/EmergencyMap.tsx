import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { ENV } from '@/constants/env';
import { useAppTheme } from '@/hooks/useAppTheme';
import { borderRadius, palette, shadows, spacing } from '@/theme';
import type { MapMarkerPoint } from '@/types/emergency';

const MARKER_COLORS: Record<MapMarkerPoint['type'], string> = {
  closure: '#C62828',
  shelter: '#2E7D32',
  resource: '#1565C0',
  hazard: '#ED6C02',
};

interface EmergencyMapProps {
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  markers: MapMarkerPoint[];
}

type MapControlAction = 'zoomIn' | 'zoomOut' | 'recenter' | 'maximize' | 'minimize';

interface MapControlsProps {
  onAction: (action: MapControlAction) => void;
  fullscreen?: boolean;
  style?: ViewStyle;
}

function MapControls({ onAction, fullscreen = false, style }: MapControlsProps) {
  const { colors } = useAppTheme();

  const buttons: { action: MapControlAction; icon: keyof typeof Ionicons.glyphMap }[] =
    fullscreen
      ? [
          { action: 'zoomIn', icon: 'add' },
          { action: 'zoomOut', icon: 'remove' },
          { action: 'recenter', icon: 'locate' },
          { action: 'minimize', icon: 'contract' },
        ]
      : [
          { action: 'zoomIn', icon: 'add' },
          { action: 'zoomOut', icon: 'remove' },
          { action: 'recenter', icon: 'locate' },
          { action: 'maximize', icon: 'expand' },
        ];

  return (
    <View style={[styles.controls, style]}>
      {buttons.map(({ action, icon }) => (
        <Pressable
          key={action}
          onPress={() => onAction(action)}
          style={({ pressed }) => [
            styles.controlBtn,
            shadows.sm,
            { backgroundColor: colors.surface },
            pressed && styles.controlBtnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={action}>
          <Ionicons name={icon} size={18} color={colors.textPrimary} />
        </Pressable>
      ))}
    </View>
  );
}

interface MapCanvasProps {
  region: Region;
  markers: MapMarkerPoint[];
  mapRef: React.RefObject<MapView | null>;
  mapStyle: ViewStyle;
  onRegionChangeComplete: (next: Region) => void;
}

function MapCanvas({ region, markers, mapRef, mapStyle, onRegionChangeComplete }: MapCanvasProps) {
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
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
          title={marker.title}
          description={marker.description}
          pinColor={MARKER_COLORS[marker.type]}
        />
      ))}
    </MapView>
  );
}

export function EmergencyMap({ region: initialRegion, markers }: EmergencyMapProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const hasKey = Boolean(ENV.GOOGLE_MAPS_API_KEY);
  const mapRef = useRef<MapView>(null);
  const fullscreenMapRef = useRef<MapView>(null);
  const [mapRegion, setMapRegion] = useState<Region>(initialRegion);
  const [fullscreen, setFullscreen] = useState(false);

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
          break;
      }
    },
    [applyZoom, initialRegion],
  );

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
        GIS incident map
      </AppText>
      <AppText variant="bodySmall" color={colors.textSecondary} style={styles.subtitle}>
        Closures, shelters, and hazards in your area (from emergency administrators).
      </AppText>
      <View style={styles.mapWrap}>
        <MapCanvas
          region={mapRegion}
          markers={markers}
          mapRef={mapRef}
          mapStyle={styles.map}
          onRegionChangeComplete={setMapRegion}
        />
        <MapControls
          onAction={(action) => handleControl(action, mapRef)}
          style={styles.controlsOverlay}
        />
      </View>
      <View style={styles.legend}>
        {(['closure', 'shelter', 'hazard', 'resource'] as const).map((type) => (
          <View key={type} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: MARKER_COLORS[type] }]} />
            <AppText variant="caption" color={colors.textSecondary}>
              {type}
            </AppText>
          </View>
        ))}
      </View>

      <Modal
        visible={fullscreen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setFullscreen(false)}>
        <View style={[styles.fullscreenRoot, { paddingTop: insets.top }]}>
          <View style={styles.fullscreenHeader}>
            <AppText variant="h3">Situation map</AppText>
            <Pressable
              onPress={() => setFullscreen(false)}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close map">
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
          </View>
          <View style={styles.fullscreenMapWrap}>
            <MapCanvas
              region={mapRegion}
              markers={markers}
              mapRef={fullscreenMapRef}
              mapStyle={styles.fullscreenMap}
              onRegionChangeComplete={setMapRegion}
            />
            <MapControls
              fullscreen
              onAction={(action) => handleControl(action, fullscreenMapRef)}
              style={styles.controlsOverlay}
            />
          </View>
          <View style={[styles.fullscreenLegend, { paddingBottom: insets.bottom + spacing.md }]}>
            {(['closure', 'shelter', 'hazard', 'resource'] as const).map((type) => (
              <View key={type} style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: MARKER_COLORS[type] }]} />
                <AppText variant="caption" color={colors.textSecondary}>
                  {type}
                </AppText>
              </View>
            ))}
          </View>
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
  map: { width: '100%', height: 240 },
  controlsOverlay: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
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
    borderColor: palette.borderLight,
  },
  controlBtnPressed: { opacity: 0.85 },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: { width: 10, height: 10, borderRadius: 5 },
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
  fullscreenLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: palette.borderLight,
  },
});

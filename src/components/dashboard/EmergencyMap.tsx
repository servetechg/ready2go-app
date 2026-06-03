import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { ENV } from '@/constants/env';
import { useAppTheme } from '@/hooks/useAppTheme';
import { borderRadius, palette, spacing } from '@/theme';
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

export function EmergencyMap({ region, markers }: EmergencyMapProps) {
  const { colors } = useAppTheme();
  const hasKey = Boolean(ENV.GOOGLE_MAPS_API_KEY);

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
        <MapView
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={region}
          showsUserLocation={true}
          showsCompass={true}>
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
  },
  map: { width: '100%', height: 240 },
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
});

import { Ionicons } from '@expo/vector-icons';
import React, { memo, useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';

import { getMapLayerConfig } from '@/constants/mapLayers';
import { borderRadius, palette } from '@/theme';
import type { MapMarkerPoint } from '@/types/emergency';
import { resolveMarkerLayer } from '@/utils/mapLayers';

type MapLayerMarkerProps = {
  marker: MapMarkerPoint;
};

const PIN_HEAD = 40;
const PIN_TAIL = 10;

function MapLayerMarkerComponent({ marker }: MapLayerMarkerProps) {
  const layer = resolveMarkerLayer(marker);
  const config = getMapLayerConfig(layer);
  const iconName = config.icon as keyof typeof Ionicons.glyphMap;
  const [tracksViewChanges, setTracksViewChanges] = useState(Platform.OS === 'android');

  useEffect(() => {
    if (!tracksViewChanges) return;
    const timer = setTimeout(() => setTracksViewChanges(false), 600);
    return () => clearTimeout(timer);
  }, [tracksViewChanges]);

  return (
    <Marker
      coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
      title={marker.title}
      description={marker.description}
      tracksViewChanges={tracksViewChanges}
      anchor={{ x: 0.5, y: 1 }}
      centerOffset={{ x: 0, y: -(PIN_HEAD + PIN_TAIL) / 2 }}>
      <View style={styles.wrap}>
        <View style={styles.head}>
          <Ionicons name={iconName} size={22} color={palette.text} />
        </View>
        <View style={styles.tail} />
      </View>
    </Marker>
  );
}

export const MapLayerMarker = memo(MapLayerMarkerComponent);

const styles = StyleSheet.create({
  wrap: {
    width: PIN_HEAD,
    height: PIN_HEAD + PIN_TAIL,
    alignItems: 'center',
  },
  head: {
    width: PIN_HEAD,
    height: PIN_HEAD,
    borderRadius: PIN_HEAD / 2,
    backgroundColor: palette.white,
    borderWidth: 1.5,
    borderColor: '#B0BEC5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 3,
    elevation: 5,
  },
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: PIN_TAIL,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: palette.white,
    marginTop: -2,
  },
});

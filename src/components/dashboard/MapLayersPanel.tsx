import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppCheckbox } from '@/components/form/AppCheckbox';
import { AppText } from '@/components/ui/AppText';
import { GIS_MAP_LAYERS } from '@/constants/mapLayers';
import { useAppTheme } from '@/hooks/useAppTheme';
import { borderRadius, palette, shadows, spacing } from '@/theme';
import type { GisMapLayerId } from '@/types/emergency';

type MapLayersPanelProps = {
  enabledLayers: Record<GisMapLayerId, boolean>;
  onToggleLayer: (layerId: GisMapLayerId) => void;
  onClose: () => void;
};

export function MapLayersPanel({ enabledLayers, onToggleLayer, onClose }: MapLayersPanelProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.panel, shadows.md, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <AppText variant="h3" color={colors.primary}>
          Map Layers
        </AppText>
        <Pressable
          onPress={onClose}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Close map layers">
          <Ionicons name="close" size={22} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {GIS_MAP_LAYERS.map((layer) => {
          const enabled = enabledLayers[layer.id];

          if (layer.kind === 'overlay') {
            return (
              <AppCheckbox
                key={layer.id}
                label={layer.label}
                checked={enabled}
                onToggle={() => onToggleLayer(layer.id)}
              />
            );
          }

          return (
            <Pressable
              key={layer.id}
              style={({ pressed }) => [styles.layerRow, pressed && styles.layerRowPressed]}
              onPress={() => onToggleLayer(layer.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: enabled }}>
              <View style={[styles.layerIcon, { borderColor: colors.border }]}>
                <Ionicons
                  name={layer.icon as keyof typeof Ionicons.glyphMap}
                  size={18}
                  color={colors.text}
                />
              </View>
              <AppText variant="body" style={styles.layerLabel}>
                {layer.label}
              </AppText>
              <View
                style={[
                  styles.toggleDot,
                  {
                    backgroundColor: enabled ? colors.primary : colors.border,
                    borderColor: enabled ? colors.primary : colors.border,
                  },
                ]}
              />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    maxHeight: 360,
    width: 280,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  list: {
    maxHeight: 300,
  },
  layerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  layerRowPressed: {
    opacity: 0.75,
  },
  layerIcon: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: palette.white,
  },
  layerLabel: {
    flex: 1,
  },
  toggleDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
  },
});

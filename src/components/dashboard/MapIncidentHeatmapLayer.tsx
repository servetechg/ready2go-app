import React, { memo } from 'react';
import { Circle } from 'react-native-maps';

import type { HeatmapPoint } from '@/utils/mapLayers';

type MapIncidentHeatmapLayerProps = {
  points: HeatmapPoint[];
};

function heatColor(weight: number): { fill: string; stroke: string; radius: number } {
  if (weight >= 2) {
    return { fill: 'rgba(183, 28, 28, 0.42)', stroke: 'rgba(183, 28, 28, 0.65)', radius: 520 };
  }
  if (weight >= 1.5) {
    return { fill: 'rgba(255, 87, 34, 0.38)', stroke: 'rgba(255, 87, 34, 0.6)', radius: 420 };
  }
  return { fill: 'rgba(255, 235, 59, 0.32)', stroke: 'rgba(255, 193, 7, 0.55)', radius: 320 };
}

function MapIncidentHeatmapLayerComponent({ points }: MapIncidentHeatmapLayerProps) {
  return (
    <>
      {points.map((point, index) => {
        const weight = point.weight ?? 1;
        const colors = heatColor(weight);
        return (
          <Circle
            key={`heat-${point.latitude}-${point.longitude}-${index}`}
            center={{ latitude: point.latitude, longitude: point.longitude }}
            radius={colors.radius}
            fillColor={colors.fill}
            strokeColor={colors.stroke}
            strokeWidth={1}
            zIndex={1}
          />
        );
      })}
    </>
  );
}

export const MapIncidentHeatmapLayer = memo(MapIncidentHeatmapLayerComponent);

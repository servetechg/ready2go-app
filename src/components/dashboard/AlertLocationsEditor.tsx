import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppInput } from '@/components/form/AppInput';
import { AppSelect } from '@/components/form/AppSelect';
import { PlacesAddressAutocomplete } from '@/components/form/PlacesAddressAutocomplete';
import { AppText } from '@/components/ui/AppText';
import { US_STATES } from '@/constants/registration';
import { useAppTheme } from '@/hooks/useAppTheme';
import { isPlacesSearchAvailable } from '@/services/places.service';
import { borderRadius, palette, spacing } from '@/theme';
import type { AlertLocation } from '@/types/registration';
import type { ParsedPlaceAddress } from '@/utils/googlePlaces';

interface AlertLocationsEditorProps {
  locations: AlertLocation[];
  onChange: (locations: AlertLocation[]) => void;
  compact?: boolean;
  maxLocations?: number;
}

function newLocationId() {
  return `loc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function formatLocationLine(loc: AlertLocation): string {
  return [loc.streetAddress, loc.city, loc.state, loc.zipCode].filter(Boolean).join(', ');
}

function formatPlacePreview(place: ParsedPlaceAddress): string {
  const parts = [place.streetAddress, place.city, place.state, place.zipCode].filter(Boolean);
  return place.formattedAddress || parts.join(', ');
}

export function AlertLocationsEditor({
  locations,
  onChange,
  compact = false,
  maxLocations,
}: AlertLocationsEditorProps) {
  const { colors } = useAppTheme();
  const usePlacesSearch = isPlacesSearchAvailable() && Platform.OS !== 'web';

  const [label, setLabel] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<ParsedPlaceAddress | null>(null);

  const applyPlace = (place: ParsedPlaceAddress) => {
    setSelectedPlace(place);
    setStreetAddress(place.streetAddress);
    setCity(place.city);
    setState(place.state);
    setZipCode(place.zipCode);
  };

  const clearPlace = () => {
    setSelectedPlace(null);
    setStreetAddress('');
    setCity('');
    setState('');
    setZipCode('');
  };

  const addLocation = () => {
    if (!city.trim() || !state) return;
    if (maxLocations !== undefined && locations.length >= maxLocations) return;
    onChange([
      ...locations,
      {
        id: newLocationId(),
        label: label.trim() || `${city.trim()}, ${state}`,
        streetAddress: streetAddress.trim(),
        city: city.trim(),
        state,
        zipCode: zipCode.trim(),
      },
    ]);
    setLabel('');
    clearPlace();
  };

  const removeLocation = (id: string) => {
    onChange(locations.filter((loc) => loc.id !== id));
  };

  const atMax = maxLocations !== undefined && locations.length >= maxLocations;

  return (
    <View style={styles.wrap}>
      {!compact ? (
        <>
          <AppText variant="label" style={styles.sectionLabel}>
            Other alert locations (optional)
          </AppText>
          <AppText variant="bodySmall" color={colors.textSecondary} style={styles.hint}>
            e.g. You live in Chicago but want alerts for family in California.
          </AppText>
        </>
      ) : null}

      {locations.map((loc) => (
        <View key={loc.id} style={styles.chipRow}>
          <View style={styles.chip}>
            <Ionicons name="location-outline" size={16} color={palette.tabActive} />
            <AppText variant="bodySmall" style={styles.chipText}>
              {loc.label || formatLocationLine(loc)}
            </AppText>
          </View>
          <Pressable onPress={() => removeLocation(loc.id)} hitSlop={8} accessibilityLabel="Remove location">
            <Ionicons name="close-circle" size={22} color={colors.textMuted} />
          </Pressable>
        </View>
      ))}

      {atMax ? (
        <AppText variant="caption" color={colors.textMuted}>
          Maximum {maxLocations} locations reached.
        </AppText>
      ) : (
        <>
          <AppInput
            label="Label (optional)"
            placeholder="e.g. Family in California"
            value={label}
            onChangeText={setLabel}
          />
          <AppInput
            label="City"
            placeholder="City"
            value={city}
            onChangeText={setCity}
          />
          <AppInput
            label="Street (optional)"
            placeholder="Street address"
            value={streetAddress}
            onChangeText={setStreetAddress}
          />

          {usePlacesSearch ? (
            <>
              <PlacesAddressAutocomplete
                label="Search address"
                onPlaceSelected={applyPlace}
                onClear={clearPlace}
              />
              {selectedPlace ? (
                <View style={[styles.selectedPlace, { backgroundColor: colors.accent }]}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                  <AppText variant="bodySmall" style={styles.selectedPlaceText}>
                    {formatPlacePreview(selectedPlace)}
                  </AppText>
                </View>
              ) : null}
            </>
          ) : null}

          <View style={styles.row}>
            <View style={styles.stateCol}>
              <AppSelect
                label="State"
                value={state}
                options={US_STATES}
                onChange={setState}
                placeholder="State"
                containerStyle={styles.select}
              />
            </View>
            <AppInput
              label="ZIP (optional)"
              placeholder="ZIP"
              value={zipCode}
              onChangeText={setZipCode}
              keyboardType="number-pad"
              containerStyle={styles.zip}
            />
          </View>

          <Pressable
            style={[
              styles.addBtn,
              { borderColor: colors.primary },
              (!city.trim() || !state) && styles.addBtnDisabled,
            ]}
            onPress={addLocation}
            disabled={!city.trim() || !state}
            accessibilityRole="button">
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <AppText variant="label" color={colors.primary}>
              Add location
            </AppText>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  sectionLabel: { marginTop: spacing.lg },
  hint: { marginBottom: spacing.sm },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  chipText: { flex: 1, flexShrink: 1 },
  selectedPlace: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: -spacing.sm,
  },
  selectedPlaceText: { flex: 1 },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  stateCol: { width: 108, flexShrink: 0 },
  select: { marginBottom: 0 },
  zip: { flex: 1, minWidth: 0 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  addBtnDisabled: { opacity: 0.5 },
});

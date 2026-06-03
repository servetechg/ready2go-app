import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppInput } from '@/components/form/AppInput';
import { AppSelect } from '@/components/form/AppSelect';
import { AppText } from '@/components/ui/AppText';
import { US_STATES } from '@/constants/registration';
import { useAppTheme } from '@/hooks/useAppTheme';
import { borderRadius, palette, spacing } from '@/theme';
import type { AlertLocation } from '@/types/registration';

interface AlertLocationsEditorProps {
  locations: AlertLocation[];
  onChange: (locations: AlertLocation[]) => void;
  compact?: boolean;
}

function newLocationId() {
  return `loc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function AlertLocationsEditor({
  locations,
  onChange,
  compact = false,
}: AlertLocationsEditorProps) {
  const { colors } = useAppTheme();
  const [label, setLabel] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');

  const addLocation = () => {
    if (!city.trim() || !state) return;
    onChange([
      ...locations,
      {
        id: newLocationId(),
        label: label.trim() || `${city.trim()}, ${state}`,
        city: city.trim(),
        state,
        zipCode: zipCode.trim(),
      },
    ]);
    setLabel('');
    setCity('');
    setState('');
    setZipCode('');
  };

  const removeLocation = (id: string) => {
    onChange(locations.filter((loc) => loc.id !== id));
  };

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
              {loc.label || `${loc.city}, ${loc.state}`}
            </AppText>
          </View>
          <Pressable onPress={() => removeLocation(loc.id)} hitSlop={8} accessibilityLabel="Remove location">
            <Ionicons name="close-circle" size={22} color={colors.textMuted} />
          </Pressable>
        </View>
      ))}

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
        style={[styles.addBtn, { borderColor: colors.primary }]}
        onPress={addLocation}
        accessibilityRole="button">
        <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
        <AppText variant="label" color={colors.primary}>
          Add location
        </AppText>
      </Pressable>
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
  chipText: { flex: 1 },
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
});

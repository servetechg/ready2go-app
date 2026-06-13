import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  AddLocationModal,
  type AddLocationFormData,
} from '@/components/onboarding/AddLocationModal';
import { AppText } from '@/components/ui/AppText';
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

function formatLocationLine(loc: AlertLocation): string {
  return [loc.streetAddress, loc.city, loc.state, loc.zipCode].filter(Boolean).join(', ');
}

function formDataToLocation(data: AddLocationFormData): AlertLocation {
  return {
    id: data.id ?? newLocationId(),
    label: data.label.trim(),
    streetAddress: data.streetAddress?.trim() ?? '',
    city: data.city.trim(),
    state: data.state,
    zipCode: data.zipCode?.trim() ?? '',
  };
}

export function AlertLocationsEditor({
  locations,
  onChange,
  compact = false,
}: AlertLocationsEditorProps) {
  const { colors } = useAppTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLocation, setEditingLocation] = useState<AlertLocation | null>(null);

  const openAdd = () => {
    setEditingLocation(null);
    setModalVisible(true);
  };

  const openEdit = (loc: AlertLocation) => {
    setEditingLocation(loc);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingLocation(null);
  };

  const handleSave = (data: AddLocationFormData) => {
    const next = formDataToLocation(data);
    if (data.id) {
      onChange(locations.map((loc) => (loc.id === data.id ? next : loc)));
      return;
    }
    onChange([...locations, next]);
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
          <Pressable style={styles.chip} onPress={() => openEdit(loc)} accessibilityRole="button">
            <Ionicons name="location-outline" size={16} color={palette.tabActive} />
            <View style={styles.chipTextWrap}>
              <AppText variant="bodySmall">
                {loc.label || formatLocationLine(loc)}
              </AppText>
              <AppText variant="caption" color={colors.textMuted} numberOfLines={1}>
                {formatLocationLine(loc)}
              </AppText>
            </View>
            <Ionicons name="create-outline" size={18} color={colors.textMuted} />
          </Pressable>
          <Pressable onPress={() => removeLocation(loc.id)} hitSlop={8} accessibilityLabel="Remove location">
            <Ionicons name="close-circle" size={22} color={colors.textMuted} />
          </Pressable>
        </View>
      ))}

      <Pressable
        style={[styles.addBtn, { borderColor: colors.primary }]}
        onPress={openAdd}
        accessibilityRole="button">
        <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
        <AppText variant="label" color={colors.primary}>
          Add location
        </AppText>
      </Pressable>

      <AddLocationModal
        visible={modalVisible}
        editingLocation={editingLocation}
        onClose={closeModal}
        onSave={handleSave}
      />
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
    gap: spacing.sm,
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
  chipTextWrap: { flex: 1, gap: 2 },
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

import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ErrorMessage } from '@/components/common/ErrorMessage';
import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/hooks/useAppTheme';
import {
  fetchPlaceAddress,
  fetchPlacePredictions,
  isPlacesSearchAvailable,
  type PlacePrediction,
} from '@/services/places.service';
import { borderRadius, inputHeight, inputTextStyle, spacing } from '@/theme';
import type { ParsedPlaceAddress } from '@/utils/googlePlaces';
import { sanitizeTextInputProps } from '@/utils/nativeProps';

interface PlacesAddressAutocompleteProps {
  label?: string;
  placeholder?: string;
  initialValue?: string;
  error?: string;
  onPlaceSelected: (place: ParsedPlaceAddress) => void;
  onClear?: () => void;
}

export function PlacesAddressAutocomplete({
  label = 'Search location',
  placeholder = 'City, area, or address',
  initialValue,
  error,
  onPlaceSelected,
  onClear,
}: PlacesAddressAutocompleteProps) {
  const { colors } = useAppTheme();
  const [query, setQuery] = useState(initialValue ?? '');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const placesEnabled = isPlacesSearchAvailable();

  useEffect(() => {
    if (initialValue !== undefined) {
      setQuery(initialValue);
    }
  }, [initialValue]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const runSearch = useCallback(
    (text: string) => {
      if (!placesEnabled) return;

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (text.trim().length < 2) {
        setPredictions([]);
        setOpen(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      setLookupError(null);
      const requestId = ++requestIdRef.current;

      debounceRef.current = setTimeout(() => {
        void (async () => {
          try {
            const results = await fetchPlacePredictions(text);
            if (requestId !== requestIdRef.current) return;
            setPredictions(results);
            setOpen(results.length > 0);
          } catch (err) {
            if (requestId !== requestIdRef.current) return;
            setPredictions([]);
            setOpen(false);
            setLookupError(err instanceof Error ? err.message : 'Search failed');
          } finally {
            if (requestId === requestIdRef.current) setLoading(false);
          }
        })();
      }, 300);
    },
    [placesEnabled],
  );

  const handleChangeText = (text: string) => {
    setQuery(text);
    onClear?.();
    runSearch(text);
  };

  const handleSelect = async (prediction: PlacePrediction) => {
    setQuery(prediction.description);
    setOpen(false);
    setPredictions([]);
    setLoading(true);
    setLookupError(null);

    try {
      const place = await fetchPlaceAddress(prediction.placeId);
      onPlaceSelected(place);
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : 'Could not load place');
    } finally {
      setLoading(false);
    }
  };

  const clearSelection = () => {
    setQuery('');
    setPredictions([]);
    setOpen(false);
    setLookupError(null);
    onClear?.();
  };

  if (!placesEnabled) {
    return (
      <View style={styles.container}>
        {label ? (
          <AppText variant="label" color={colors.textSecondary} style={styles.label}>
            {label}
          </AppText>
        ) : null}
        <AppText variant="caption" color={colors.textMuted}>
          Add EXPO_PUBLIC_GEOAPIFY_API_KEY to .env and restart Expo to enable address search.
        </AppText>
      </View>
    );
  }

  const nativeProps = sanitizeTextInputProps({
    value: query,
    onChangeText: handleChangeText,
    placeholder,
    placeholderTextColor: colors.textMuted,
    onFocus: () => {
      if (predictions.length > 0) setOpen(true);
    },
    autoCorrect: false,
    autoCapitalize: 'words',
  });

  return (
    <View style={styles.container}>
      {label ? (
        <AppText variant="label" color={colors.textSecondary} style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <View style={styles.inputRow}>
        <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              borderColor: error ? colors.error : colors.border,
              color: colors.text,
            },
          ]}
          textAlignVertical="center"
          {...(Platform.OS === 'android' ? { includeFontPadding: false as const } : {})}
          {...nativeProps}
        />
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
        ) : query.length > 0 ? (
          <Pressable onPress={clearSelection} hitSlop={8} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {open && predictions.length > 0 ? (
        <View style={[styles.dropdown, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled style={styles.dropdownScroll}>
            {predictions.map((item) => (
              <Pressable
                key={item.placeId}
                style={[styles.predictionRow, { borderBottomColor: colors.border }]}
                onPress={() => void handleSelect(item)}>
                <Ionicons name="location-outline" size={16} color={colors.primary} />
                <AppText variant="bodySmall" style={styles.predictionText}>
                  {item.description}
                </AppText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {lookupError ? <ErrorMessage message={lookupError} /> : null}
      {error ? <ErrorMessage message={error} /> : null}
    </View>
  );
}

const SEARCH_ICON_SIZE = 18;
const INPUT_SIDE_INSET = spacing.md + SEARCH_ICON_SIZE + spacing.sm;

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    zIndex: 10,
  },
  label: { marginBottom: spacing.xs },
  inputRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: spacing.md,
    zIndex: 1,
  },
  input: {
    height: inputHeight,
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingLeft: INPUT_SIDE_INSET,
    paddingRight: INPUT_SIDE_INSET,
    ...inputTextStyle,
  },
  loader: {
    position: 'absolute',
    right: spacing.md,
  },
  clearBtn: {
    position: 'absolute',
    right: spacing.md,
  },
  dropdown: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    maxHeight: 200,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  dropdownScroll: { maxHeight: 200 },
  predictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  predictionText: { flex: 1 },
});

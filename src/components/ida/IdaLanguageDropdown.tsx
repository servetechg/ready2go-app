import { Ionicons } from '@expo/vector-icons';
import ISO6391 from 'iso-639-1';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';

import { useAppTheme } from '@/hooks/useAppTheme';
import { borderRadius, fontFamily, fontSize, inputHeight, spacing } from '@/theme';

type LanguageOption = {
  label: string;
  value: string;
  search: string;
};

const PRIORITY_CODES = [
  'en',
  'es',
  'zh',
  'fr',
  'ar',
  'pt',
  'hi',
  'ru',
  'de',
  'ja',
  'ko',
  'it',
  'vi',
  'tl',
  'ht',
  'pl',
  'uk',
  'bn',
  'ur',
  'fa',
];

function buildLanguageOptions(): LanguageOption[] {
  return ISO6391.getAllCodes()
    .map((code) => {
      const name = ISO6391.getName(code);
      const native = ISO6391.getNativeName(code);
      if (!name) return null;
      const label = native && native !== name ? `${name} (${native})` : name;
      return {
        label,
        value: name,
        search: `${name} ${native} ${code}`.toLowerCase(),
      };
    })
    .filter((item): item is LanguageOption => item != null)
    .sort((a, b) => {
      const aCode = ISO6391.getCode(a.value);
      const bCode = ISO6391.getCode(b.value);
      const ai = PRIORITY_CODES.indexOf(aCode);
      const bi = PRIORITY_CODES.indexOf(bCode);
      if (ai !== -1 || bi !== -1) {
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      }
      return a.label.localeCompare(b.label);
    });
}

const LANGUAGE_OPTIONS = buildLanguageOptions();

type IdaLanguageDropdownProps = {
  value: string;
  onChange: (value: string) => void;
};

export function IdaLanguageDropdown({ value, onChange }: IdaLanguageDropdownProps) {
  const { colors } = useAppTheme();
  const selected = useMemo(() => {
    const exact = LANGUAGE_OPTIONS.find(
      (item) => item.value.toLowerCase() === value.trim().toLowerCase(),
    );
    if (exact) return exact.value;
    const byLabel = LANGUAGE_OPTIONS.find(
      (item) => item.label.toLowerCase() === value.trim().toLowerCase(),
    );
    return byLabel?.value ?? (value.trim() || null);
  }, [value]);

  return (
    <Dropdown
      data={LANGUAGE_OPTIONS}
      labelField="label"
      valueField="value"
      searchField="search"
      value={selected}
      placeholder="Search languages"
      search
      searchPlaceholder="Type to search"
      mode="modal"
      maxHeight={360}
      onChange={(item) => onChange(item.value)}
      style={[
        styles.dropdown,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      placeholderStyle={[styles.placeholder, { color: colors.textMuted }]}
      selectedTextStyle={[styles.selected, { color: colors.text }]}
      inputSearchStyle={[
        styles.search,
        {
          color: colors.text,
          borderColor: colors.border,
        },
      ]}
      containerStyle={[
        styles.list,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      itemTextStyle={[styles.item, { color: colors.text }]}
      activeColor={colors.accent}
      iconColor={colors.primary}
      renderRightIcon={() => (
        <Ionicons name="chevron-down" size={18} color={colors.primary} />
      )}
      renderLeftIcon={() => (
        <View style={styles.leftIcon}>
          <Ionicons name="language-outline" size={18} color={colors.primary} />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  dropdown: {
    minHeight: inputHeight,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  placeholder: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
  },
  selected: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
  },
  search: {
    height: inputHeight,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    borderRadius: borderRadius.sm,
  },
  list: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  item: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
});

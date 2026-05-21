import { TextInputProps, TextProps, ViewProps } from 'react-native';

import { toBoolean } from './coerce';

const VIEW_BOOLEAN_KEYS = [
  'accessible',
  'collapsable',
  'focusable',
  'needsOffscreenAlphaCompositing',
  'renderToHardwareTextureAndroid',
  'shouldRasterizeIOS',
  'isTVSelectable',
  'hasTVPreferredFocus',
  'tvParallaxProperties',
] as const;

const TEXT_BOOLEAN_KEYS = [
  'selectable',
  'allowFontScaling',
  'adjustsFontSizeToFit',
  'disabled',
] as const;

const TEXT_INPUT_BOOLEAN_KEYS = [
  'secureTextEntry',
  'editable',
  'multiline',
  'selectTextOnFocus',
  'showSoftInputOnFocus',
  'caretHidden',
  'contextMenuHidden',
  'blurOnSubmit',
  'scrollEnabled',
] as const;

const SCROLL_BOOLEAN_KEYS = [
  'horizontal',
  'showsHorizontalScrollIndicator',
  'showsVerticalScrollIndicator',
  'nestedScrollEnabled',
  'bounces',
  'scrollEnabled',
] as const;

const MODAL_BOOLEAN_KEYS = ['transparent', 'statusBarTranslucent', 'hardwareAccelerated'] as const;

function coerceKeys(props: Record<string, unknown>, keys: readonly string[]) {
  const next = { ...props };
  for (const key of keys) {
    if (key in next && next[key] !== undefined) {
      next[key] = toBoolean(next[key]);
    }
  }
  return next;
}

export function sanitizeViewProps(props: ViewProps): ViewProps {
  return coerceKeys(props as Record<string, unknown>, VIEW_BOOLEAN_KEYS) as ViewProps;
}

export function sanitizeTextProps(props: TextProps): TextProps {
  return coerceKeys(props as Record<string, unknown>, TEXT_BOOLEAN_KEYS) as TextProps;
}

export function sanitizeTextInputProps(props: TextInputProps): TextInputProps {
  return coerceKeys(
    props as Record<string, unknown>,
    TEXT_INPUT_BOOLEAN_KEYS,
  ) as TextInputProps;
}

export function sanitizeScrollViewProps<T extends Record<string, unknown>>(props: T): T {
  return coerceKeys(props, SCROLL_BOOLEAN_KEYS) as T;
}

export function sanitizeModalProps<T extends Record<string, unknown>>(props: T): T {
  return coerceKeys(props, MODAL_BOOLEAN_KEYS) as T;
}

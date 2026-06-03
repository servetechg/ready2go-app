import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { palette, shadows } from '@/theme';

interface DrawerCloseHandleProps {
  onPress: () => void;
  topOffset?: number;
}

/** Semi-circular tab on the drawer’s right edge with a circular close button (mockup). */
export function DrawerCloseHandle({ onPress, topOffset = 88 }: DrawerCloseHandleProps) {
  return (
    <View style={[styles.handle, { top: topOffset }]} pointerEvents="box-none">
      <View style={[styles.tab, shadows.md]}>
        <Pressable
          style={styles.button}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel="Close menu">
          <Ionicons name="close" size={20} color={palette.white} />
        </Pressable>
      </View>
    </View>
  );
}

const TAB_WIDTH = 52;
const TAB_HEIGHT = 58;
const BUTTON_SIZE = 38;

const styles = StyleSheet.create({
  handle: {
    position: 'absolute',
    right: -(TAB_WIDTH / 2) + 2,
    zIndex: 30,
    width: TAB_WIDTH,
    height: TAB_HEIGHT,
  },
  tab: {
    flex: 1,
    backgroundColor: palette.white,
    borderTopRightRadius: TAB_HEIGHT / 2,
    borderBottomRightRadius: TAB_HEIGHT / 2,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: palette.tabActive,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import React from 'react';
import Svg, { Path } from 'react-native-svg';

const MENU_PATH =
  'M0 2.5A1.5 1.5 0 0 0 1.5 4h19a1.5 1.5 0 0 0 0-3h-19A1.5 1.5 0 0 0 0 2.5M30.5 10h-29a1.5 1.5 0 0 0 0 3h29a1.5 1.5 0 0 0 0-3m0 10h-19a1.5 1.5 0 0 0 0 3h19a1.5 1.5 0 0 0 0-3';

interface MenuIconProps {
  size?: number;
  color?: string;
}

export function MenuIcon({ size = 26, color = '#1A2B3C' }: MenuIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill={color}>
      <Path d={MENU_PATH} />
    </Svg>
  );
}

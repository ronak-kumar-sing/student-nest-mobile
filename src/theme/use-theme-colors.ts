/**
 * Theme colors hook.
 *
 * Provides reactive access to theme color tokens based on the active color scheme.
 * Use this for component props that require JavaScript color strings (e.g. icon colors,
 * placeholderTextColor, RefreshControl tintColor), rather than hardcoding hex colors
 * or importing the light-only `colors` token object.
 */

import { useColorScheme } from 'nativewind';
import { colors, darkColors } from './tokens';

export type ThemeColors = {
  readonly [K in Exclude<keyof typeof colors, 'status'>]: string;
} & {
  readonly status: {
    readonly [S in keyof typeof colors.status]: string;
  };
};

export function useThemeColors(): ThemeColors {
  const { colorScheme } = useColorScheme();
  return colorScheme === 'dark' ? darkColors : colors;
}

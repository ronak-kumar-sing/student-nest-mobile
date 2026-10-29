import React from 'react';
import { Pressable, Text } from 'react-native';
import { cn } from '@/lib/cn';

/* ─────────────────────────── types ─────────────────────────────── */

interface ChipProps {
  /** Chip label text. */
  label: string;
  /** Whether the chip is currently selected. */
  selected?: boolean;
  /** Called when the chip is pressed. */
  onPress?: () => void;
  /** Additional className for the outer Pressable. */
  className?: string;
}

/* ─────────────────────────── component ────────────────────────── */

/**
 * Selectable filter chip with animated press feedback.
 *
 * @example
 * ```tsx
 * <Chip
 *   label="WiFi"
 *   selected={filters.includes('wifi')}
 *   onPress={() => toggleFilter('wifi')}
 * />
 * ```
 */
function Chip({ label, selected = false, onPress, className }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={cn(
        'items-center justify-center rounded-full px-4 py-2 active:scale-95',
        selected
          ? 'bg-primary'
          : 'bg-secondary',
        className,
      )}
    >
      <Text
        className={cn(
          'font-body-medium text-sm',
          selected
            ? 'text-primary-foreground'
            : 'text-secondary-foreground',
        )}
        maxFontSizeMultiplier={1.3}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export { Chip };
export type { ChipProps };

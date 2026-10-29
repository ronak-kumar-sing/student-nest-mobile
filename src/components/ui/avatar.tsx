import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

/* ─────────────────────────── variants ─────────────────────────── */

const avatarVariants = cva(
  'items-center justify-center overflow-hidden rounded-full bg-muted',
  {
    variants: {
      size: {
        sm: 'h-8 w-8',
        default: 'h-10 w-10',
        lg: 'h-14 w-14',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
);

const avatarTextVariants = cva('font-heading text-muted-foreground', {
  variants: {
    size: {
      sm: 'text-xs',
      default: 'text-sm',
      lg: 'text-body',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

/* ─────────────────────────── types ─────────────────────────────── */

type AvatarSize = VariantProps<typeof avatarVariants>['size'];

interface AvatarProps {
  /** Image URI. Falls back to initials when absent or fails to load. */
  src?: string | null;
  /** Full name used to derive initials for the fallback. */
  name?: string;
  /** Avatar size preset. */
  size?: AvatarSize;
  /** Additional className for the outer container. */
  className?: string;
}

/* ─────────────────────────── helpers ──────────────────────────── */

/** Extract up to 2 initials from a name string. */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '';
  if (parts.length === 1) return (parts[0]?.[0] ?? '').toUpperCase();
  return `${parts[0]?.[0] ?? ''}${parts[parts.length - 1]?.[0] ?? ''}`.toUpperCase();
}

/** Deterministic pastel hue from a name string (for fallback background). */
function nameToHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

/** Map size variant to pixel dimension for the expo-image. */
const SIZE_MAP: Record<NonNullable<AvatarSize>, number> = {
  sm: 32,
  default: 40,
  lg: 56,
};

/* ─────────────────────────── component ────────────────────────── */

/**
 * Avatar displaying a user image or initials fallback.
 *
 * @example
 * ```tsx
 * <Avatar src={user.avatarUrl} name={user.fullName} size="lg" />
 * <Avatar name="Ronak Singh" />
 * ```
 */
function Avatar({ src, name = '', size = 'default', className }: AvatarProps) {
  const initials = useMemo(() => getInitials(name), [name]);
  const hue = useMemo(() => nameToHue(name), [name]);
  const px = SIZE_MAP[size ?? 'default'];

  if (src) {
    return (
      <View className={cn(avatarVariants({ size }), className)}>
        <Image
          source={{ uri: src }}
          style={{ width: px, height: px }}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
          accessibilityLabel={name ? `${name}'s avatar` : 'User avatar'}
        />
      </View>
    );
  }

  return (
    <View
      className={cn(avatarVariants({ size }), className)}
      style={{ backgroundColor: `hsl(${hue}, 50%, 85%)` }}
      accessibilityLabel={name ? `${name}'s avatar` : 'User avatar'}
    >
      <Text
        className={cn(avatarTextVariants({ size }))}
        style={{ color: `hsl(${hue}, 45%, 35%)` }}
        maxFontSizeMultiplier={1.3}
      >
        {initials}
      </Text>
    </View>
  );
}

export { Avatar };
export type { AvatarProps };

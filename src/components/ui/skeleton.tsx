import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import { cn } from '@/lib/cn';

/* ─────────────────────────── types ─────────────────────────────── */

interface SkeletonProps {
  /** Additional className for width, height, borderRadius, etc. */
  className?: string;
}

/* ─────────────────────────── component ────────────────────────── */

/**
 * Skeleton loading placeholder with an animated shimmer pulse.
 * Respects `useReducedMotion` — shows a static semi-transparent
 * block when the user prefers reduced motion.
 *
 * @example
 * ```tsx
 * <Skeleton className="h-6 w-32 rounded-md" />
 * <Skeleton className="h-40 w-full rounded-lg" />
 * ```
 */
function Skeleton({ className }: SkeletonProps) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = 0.5;
      return;
    }

    opacity.value = withRepeat(
      withTiming(1, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1, // infinite
      true, // reverse
    );
  }, [opacity, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (reducedMotion) {
    return <View className={cn('rounded-md bg-muted opacity-50', className)} />;
  }

  return <Animated.View style={animatedStyle} className={cn('rounded-md bg-muted', className)} />;
}

export { Skeleton };
export type { SkeletonProps };

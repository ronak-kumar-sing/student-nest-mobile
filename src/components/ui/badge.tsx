import React from 'react';
import { Text, View } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

/* ─────────────────────────── variants ─────────────────────────── */

const badgeVariants = cva(
  'items-center justify-center self-start rounded-full px-2.5 py-0.5',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        secondary: 'bg-secondary',
        destructive: 'bg-destructive',
        outline: 'border border-border bg-transparent',
        success: 'bg-success',
        warning: 'bg-warning',
        info: 'bg-info',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

const badgeTextVariants = cva('font-body-semibold text-xs', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      destructive: 'text-destructive-foreground',
      outline: 'text-foreground',
      success: 'text-success-foreground',
      warning: 'text-warning-foreground',
      info: 'text-info-foreground',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

/* ─────────────────────────── types ─────────────────────────────── */

type BadgeVariantProps = VariantProps<typeof badgeVariants>;

interface BadgeProps extends BadgeVariantProps {
  children: React.ReactNode;
  className?: string;
  textClassName?: string;
}

/* ─────────────────────────── component ────────────────────────── */

/**
 * Small pill-shaped badge for status labels and counts.
 *
 * @example
 * ```tsx
 * <Badge variant="success">Active</Badge>
 * <Badge variant="warning">Pending</Badge>
 * ```
 */
function Badge({ children, variant, className, textClassName }: BadgeProps) {
  return (
    <View className={cn(badgeVariants({ variant }), className)}>
      {typeof children === 'string' ? (
        <Text
          className={cn(badgeTextVariants({ variant }), textClassName)}
          maxFontSizeMultiplier={1.3}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}

export { Badge, badgeVariants, badgeTextVariants };
export type { BadgeProps };

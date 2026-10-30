import React from 'react';
import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

/* ─────────────────────────── variants ─────────────────────────── */

const buttonVariants = cva('flex-row items-center justify-center rounded-md', {
  variants: {
    variant: {
      default: 'bg-primary active:opacity-90',
      secondary: 'bg-secondary active:opacity-90',
      destructive: 'bg-destructive active:opacity-90',
      outline: 'border border-border bg-transparent active:bg-accent',
      ghost: 'bg-transparent active:bg-accent',
    },
    size: {
      sm: 'h-9 px-3 rounded-sm',
      default: 'h-12 px-5 rounded-md',
      lg: 'h-14 px-8 rounded-lg',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

const buttonTextVariants = cva('font-heading-semibold text-center', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      destructive: 'text-destructive-foreground',
      outline: 'text-foreground',
      ghost: 'text-foreground',
    },
    size: {
      sm: 'text-sm',
      default: 'text-body',
      lg: 'text-body',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

/* ─────────────────────────── types ─────────────────────────────── */

type ButtonVariantProps = VariantProps<typeof buttonVariants>;

interface ButtonProps extends Omit<PressableProps, 'children'>, ButtonVariantProps {
  /** Button label or custom content. */
  children: React.ReactNode;
  /** Show an ActivityIndicator and disable interactions. */
  loading?: boolean;
  /** Additional className for the outer Pressable. */
  className?: string;
  /** Additional className for the inner Text. */
  textClassName?: string;
}

/* ─────────────────────────── component ────────────────────────── */

/**
 * Primary button component with variant and size support.
 *
 * @example
 * ```tsx
 * <Button variant="default" size="lg" onPress={handleSubmit}>
 *   Save
 * </Button>
 * ```
 */
function Button({
  children,
  variant,
  size,
  loading = false,
  disabled = false,
  className,
  textClassName,
  ...pressableProps
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      {...pressableProps}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      className={cn(buttonVariants({ variant, size }), isDisabled && 'opacity-50', className)}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          className={cn(
            variant === 'default' || variant === 'destructive'
              ? 'text-primary-foreground'
              : 'text-foreground',
          )}
        />
      ) : typeof children === 'string' ? (
        <Text
          className={cn(buttonTextVariants({ variant, size }), textClassName)}
          maxFontSizeMultiplier={1.3}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

export { Button, buttonVariants, buttonTextVariants };
export type { ButtonProps };

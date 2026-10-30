import React, { useState } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { cn } from '@/lib/cn';

/* ─────────────────────────── types ─────────────────────────────── */

interface InputProps extends TextInputProps {
  /** Label displayed above the input. Also used as accessibilityLabel. */
  label?: string;
  /** Error message displayed below the input in destructive color. */
  error?: string;
  /** Helper text displayed below the input in muted color. */
  helperText?: string;
  /** Additional className for the outer container. */
  containerClassName?: string;
  /** Additional className for the TextInput itself. */
  className?: string;
}

/* ─────────────────────────── component ────────────────────────── */

/**
 * Styled text input with label, error, and helper text support.
 *
 * @example
 * ```tsx
 * <Input
 *   label="Email"
 *   placeholder="you@example.com"
 *   error={errors.email?.message}
 *   keyboardType="email-address"
 * />
 * ```
 */
const Input = React.forwardRef<React.ElementRef<typeof TextInput>, InputProps>(
  (
    { label, error, helperText, containerClassName, className, onFocus, onBlur, ...textInputProps },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus: TextInputProps['onFocus'] = (e) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur: TextInputProps['onBlur'] = (e) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    return (
      <View className={cn('gap-1.5', containerClassName)}>
        {label ? (
          <Text className="font-body-medium text-sm text-foreground" maxFontSizeMultiplier={1.3}>
            {label}
          </Text>
        ) : null}

        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderClassName="text-muted-foreground"
          onFocus={handleFocus}
          onBlur={handleBlur}
          maxFontSizeMultiplier={1.3}
          {...textInputProps}
          className={cn(
            'h-12 rounded-md border bg-background px-4 font-body text-body text-foreground',
            isFocused ? 'border-ring' : 'border-input',
            error && 'border-destructive',
            textInputProps.editable === false && 'opacity-50',
            className,
          )}
        />

        {error ? (
          <Text
            className="font-body text-xs text-destructive"
            maxFontSizeMultiplier={1.3}
            accessibilityRole="alert"
          >
            {error}
          </Text>
        ) : helperText ? (
          <Text className="font-body text-xs text-muted-foreground" maxFontSizeMultiplier={1.3}>
            {helperText}
          </Text>
        ) : null}
      </View>
    );
  },
);

Input.displayName = 'Input';

export { Input };
export type { InputProps };

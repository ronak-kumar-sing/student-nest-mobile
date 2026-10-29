import React from 'react';
import { View, Text } from 'react-native';
import { cn } from '@/lib/cn';

/* ─────────────────────────── Card ─────────────────────────────── */

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

/** Card container with card bg, border, rounded corners, and soft shadow. */
function Card({ children, className }: CardProps) {
  return (
    <View
      className={cn(
        'rounded-lg border border-border bg-card shadow-elevation-1',
        className,
      )}
    >
      {children}
    </View>
  );
}

/* ─────────────────────────── CardHeader ────────────────────────── */

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

/** Padded header section of a Card. */
function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <View className={cn('gap-1.5 p-4', className)}>
      {children}
    </View>
  );
}

/* ─────────────────────────── CardTitle ─────────────────────────── */

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

/** Heading text for a Card (h3 size, heading font). */
function CardTitle({ children, className }: CardTitleProps) {
  return (
    <Text
      className={cn('font-heading text-h3 text-card-foreground', className)}
      maxFontSizeMultiplier={1.3}
    >
      {children}
    </Text>
  );
}

/* ─────────────────────────── CardDescription ──────────────────── */

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

/** Muted description text for a Card. */
function CardDescription({ children, className }: CardDescriptionProps) {
  return (
    <Text
      className={cn('font-body text-sm text-muted-foreground', className)}
      maxFontSizeMultiplier={1.3}
    >
      {children}
    </Text>
  );
}

/* ─────────────────────────── CardContent ──────────────────────── */

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

/** Padded content area of a Card. */
function CardContent({ children, className }: CardContentProps) {
  return (
    <View className={cn('px-4 pb-4', className)}>
      {children}
    </View>
  );
}

/* ─────────────────────────── CardFooter ───────────────────────── */

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

/** Flex-row padded footer of a Card. */
function CardFooter({ children, className }: CardFooterProps) {
  return (
    <View className={cn('flex-row items-center px-4 pb-4', className)}>
      {children}
    </View>
  );
}

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};
export type {
  CardProps,
  CardHeaderProps,
  CardTitleProps,
  CardDescriptionProps,
  CardContentProps,
  CardFooterProps,
};

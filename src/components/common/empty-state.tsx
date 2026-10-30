import React from 'react';
import { View, Text } from 'react-native';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { LucideIcon } from 'lucide-react-native';

export interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: LucideIcon;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon,
  className,
}: EmptyStateProps) {
  return (
    <View className={cn('flex-1 items-center justify-center p-6 text-center', className)}>
      {Icon && (
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Icon size={32} className="text-muted-foreground" />
        </View>
      )}
      <Text className="mb-2 text-center font-heading text-h3 text-foreground">{title}</Text>
      {description && (
        <Text className="mb-6 max-w-xs text-center font-body text-sm text-muted-foreground">
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button onPress={onAction} size="default">
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

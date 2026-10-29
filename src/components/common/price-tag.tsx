import React from 'react';
import { View, Text } from 'react-native';
import { formatINR } from '@/lib/money';
import { cn } from '@/lib/cn';

export interface PriceTagProps {
  paise: number;
  period?: string;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function PriceTag({ paise, period = '/month', size = 'default', className }: PriceTagProps) {
  const formatted = formatINR(paise);

  const sizeClasses = {
    sm: 'text-sm font-semibold',
    default: 'text-h3 font-heading',
    lg: 'text-h2 font-heading',
  };

  const periodClasses = {
    sm: 'text-xs',
    default: 'text-sm',
    lg: 'text-body',
  };

  return (
    <View className={cn('flex-row items-baseline', className)}>
      <Text className={cn('text-primary font-heading', sizeClasses[size])}>
        {formatted}
      </Text>
      {period && (
        <Text className={cn('text-muted-foreground font-body ml-1', periodClasses[size])}>
          {period}
        </Text>
      )}
    </View>
  );
}

import React from 'react';
import { View, Text } from 'react-native';
import { AlertCircle, RefreshCw } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { getErrorMessage } from '@/api/errors';
import { useTranslation } from 'react-i18next';
import { colors } from '@/theme/tokens';

export interface ErrorStateProps {
  message?: string;
  code?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ message, code, onRetry, className }: ErrorStateProps) {
  const { t } = useTranslation();

  const displayMessage =
    message || (code ? t(getErrorMessage(code)) : t('common.errorDescription'));

  return (
    <View className={cn('flex-1 items-center justify-center p-6 text-center', className)}>
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle size={32} color={colors.destructive} />
      </View>
      <Text className="mb-2 text-center font-heading text-h3 text-foreground">
        {t('common.error')}
      </Text>
      <Text className="mb-6 max-w-xs text-center font-body text-sm text-muted-foreground">
        {displayMessage}
      </Text>
      {onRetry && (
        <Button onPress={onRetry} variant="outline" size="default">
          <RefreshCw size={16} className="mr-2 text-foreground" />
          <Text className="font-body-medium text-foreground">{t('common.retry')}</Text>
        </Button>
      )}
    </View>
  );
}

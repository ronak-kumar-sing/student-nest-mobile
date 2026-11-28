import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MapPin, Calendar, Wallet, Sparkles, Send } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useThemeColors } from '@/theme/use-theme-colors';
import type { RoommateMatchCardViewModel } from '../types';

export interface MatchCardProps {
  item: RoommateMatchCardViewModel;
  onRequestPress: (item: RoommateMatchCardViewModel) => void;
  isSending?: boolean;
}

export function MatchCard({ item, onRequestPress, isSending = false }: MatchCardProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <View
      testID={`match-card-${item.id}`}
      className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-sm"
    >
      {/* Top row: Avatar, Name, Score Badge */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Text className="font-heading-semibold text-body text-primary">
              {item.initials}
            </Text>
          </View>
          <View>
            <Text className="font-heading-semibold text-body text-foreground">
              {item.displayName}
            </Text>
            <Text className="font-body text-xs text-muted-foreground">
              {item.cityName}
            </Text>
          </View>
        </View>

        <Badge variant="default" className="bg-primary/15 px-3 py-1">
          <Text className="font-body-semibold text-xs text-primary">
            {t('roommates.matchScore', { score: item.score, defaultValue: `${item.score}% match` })}
          </Text>
        </Badge>
      </View>

      {/* Budget & Move-in Info Grid */}
      <View className="my-3 flex-row gap-2 border-y border-border/50 py-2.5">
        <View className="flex-1 flex-row items-center gap-2">
          <Wallet size={16} color={colors.primary} />
          <View>
            <Text className="font-body text-xs text-muted-foreground">Budget</Text>
            <Text className="font-body-semibold text-sm text-foreground">
              {item.budgetLabel}
            </Text>
          </View>
        </View>

        <View className="flex-1 flex-row items-center gap-2">
          <Calendar size={16} color={colors.primary} />
          <View>
            <Text className="font-body text-xs text-muted-foreground">Move-in</Text>
            <Text className="font-body-semibold text-sm text-foreground">
              {item.moveInLabel}
            </Text>
          </View>
        </View>
      </View>

      {/* Preferred Localities */}
      {item.localities.length > 0 && (
        <View className="mb-2.5 flex-row items-start gap-1.5">
          <MapPin size={14} color={colors.mutedForeground} className="mt-0.5" />
          <Text className="flex-1 font-body text-xs text-muted-foreground" numberOfLines={1}>
            {item.localities.join(', ')}
          </Text>
        </View>
      )}

      {/* Bio snippet if present */}
      {item.bio ? (
        <Text
          className="mb-3 font-body text-xs text-muted-foreground"
          numberOfLines={2}
        >
          {item.bio}
        </Text>
      ) : null}

      {/* Reason Chips (max 3) */}
      {item.reasons.length > 0 && (
        <View className="mb-3 flex-row flex-wrap gap-1.5">
          {item.reasons.map((reason, idx) => (
            <View
              key={idx}
              className="flex-row items-center gap-1 rounded-full bg-secondary px-2.5 py-1"
            >
              <Sparkles size={11} color={colors.primary} />
              <Text className="font-body-medium text-xs text-secondary-foreground">
                {reason}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Separate action button (not nested) */}
      <Button
        onPress={() => onRequestPress(item)}
        variant="default"
        size="default"
        loading={isSending}
        className="w-full"
        accessibilityRole="button"
        accessibilityLabel={`${t('roommates.sendRequest', 'Send request')} to ${item.displayName}`}
      >
        <Send size={16} color={colors.primaryForeground} className="mr-2" />
        <Text className="font-heading-semibold text-body text-primary-foreground">
          {t('roommates.sendRequest', 'Send request')}
        </Text>
      </Button>
    </View>
  );
}

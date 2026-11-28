import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Phone, Mail, GraduationCap, CheckCircle2, XCircle, Clock } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useThemeColors } from '@/theme/use-theme-colors';
import type { RoommateRequestCardViewModel } from '../types';

export interface RequestCardProps {
  item: RoommateRequestCardViewModel;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  onCancel?: (id: string) => void;
  isActionLoading?: boolean;
}

export function RequestCard({
  item,
  onAccept,
  onDecline,
  onCancel,
  isActionLoading = false,
}: RequestCardProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  const getStatusBadgeVariant = (status: RoommateRequestCardViewModel['status']) => {
    switch (status) {
      case 'accepted':
        return 'success' as const;
      case 'pending':
        return 'warning' as const;
      case 'declined':
        return 'destructive' as const;
      case 'cancelled':
      case 'expired':
      default:
        return 'secondary' as const;
    }
  };

  const getStatusLabel = (status: RoommateRequestCardViewModel['status']) => {
    switch (status) {
      case 'accepted':
        return t('roommates.accepted', 'Accepted');
      case 'declined':
        return t('roommates.declined', 'Declined');
      case 'cancelled':
        return t('roommates.cancelled', 'Cancelled');
      case 'expired':
        return t('roommates.expired', 'Expired');
      case 'pending':
      default:
        return t('roommates.pending', 'Pending');
    }
  };

  return (
    <View
      testID={`request-card-${item.id}`}
      className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-sm"
    >
      {/* Top row: Counterpart avatar, name, direction, status */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-primary/10">
            <Text className="font-heading-semibold text-body text-primary">
              {item.counterpartInitials}
            </Text>
          </View>
          <View>
            <Text className="font-heading-semibold text-body text-foreground">
              {item.counterpartName}
            </Text>
            <Text className="font-body text-xs text-muted-foreground">
              {item.direction === 'incoming'
                ? t('roommates.incoming', 'Incoming')
                : t('roommates.outgoing', 'Outgoing')}
            </Text>
          </View>
        </View>

        <Badge variant={getStatusBadgeVariant(item.status)} className="px-2.5 py-0.5">
          <Text
            className={
              item.status === 'accepted'
                ? 'font-body-semibold text-xs text-success-foreground'
                : item.status === 'declined'
                  ? 'font-body-semibold text-xs text-destructive-foreground'
                  : 'font-body-semibold text-xs text-foreground'
            }
          >
            {getStatusLabel(item.status)}
          </Text>
        </Badge>
      </View>

      {/* Note / Message */}
      {item.message ? (
        <View className="mt-3 rounded-lg bg-muted/60 p-3">
          <Text className="font-body text-sm text-foreground italic">
            &ldquo;{item.message}&rdquo;
          </Text>
        </View>
      ) : null}

      {/* Contact Details (revealed only upon acceptance) */}
      {item.status === 'accepted' && item.contact ? (
        <View className="mt-3.5 rounded-xl border border-success/30 bg-success/10 p-3.5">
          <View className="mb-2 flex-row items-center gap-1.5">
            <CheckCircle2 size={16} color={colors.success} />
            <Text className="font-heading-semibold text-xs text-success">
              {t('roommates.contactDetails', 'Contact details')}
            </Text>
          </View>

          <View className="gap-1.5">
            <View className="flex-row items-center gap-2">
              <Text className="font-body-semibold text-xs text-foreground">
                {item.contact.displayName}
              </Text>
            </View>

            {item.contact.phone ? (
              <View className="flex-row items-center gap-2">
                <Phone size={13} color={colors.mutedForeground} />
                <Text className="font-body text-xs text-foreground select-all">
                  {item.contact.phone}
                </Text>
              </View>
            ) : null}

            {item.contact.email ? (
              <View className="flex-row items-center gap-2">
                <Mail size={13} color={colors.mutedForeground} />
                <Text className="font-body text-xs text-foreground select-all">
                  {item.contact.email}
                </Text>
              </View>
            ) : null}

            {item.contact.college ? (
              <View className="flex-row items-center gap-2">
                <GraduationCap size={13} color={colors.mutedForeground} />
                <Text className="font-body text-xs text-foreground">
                  {item.contact.college}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* Actions */}
      {item.canAccept || item.canDecline ? (
        <View className="mt-4 flex-row gap-2">
          {item.canDecline && onDecline ? (
            <Button
              onPress={() => onDecline(item.id)}
              variant="outline"
              size="default"
              loading={isActionLoading}
              className="flex-1"
              accessibilityRole="button"
              accessibilityLabel={t('roommates.decline', 'Decline')}
            >
              <XCircle size={16} color={colors.destructive} className="mr-1.5" />
              <Text className="font-heading-semibold text-sm text-destructive">
                {t('roommates.decline', 'Decline')}
              </Text>
            </Button>
          ) : null}

          {item.canAccept && onAccept ? (
            <Button
              onPress={() => onAccept(item.id)}
              variant="default"
              size="default"
              loading={isActionLoading}
              className="flex-1"
              accessibilityRole="button"
              accessibilityLabel={t('roommates.accept', 'Accept')}
            >
              <CheckCircle2 size={16} color={colors.primaryForeground} className="mr-1.5" />
              <Text className="font-heading-semibold text-sm text-primary-foreground">
                {t('roommates.accept', 'Accept')}
              </Text>
            </Button>
          ) : null}
        </View>
      ) : item.canCancel && onCancel ? (
        <View className="mt-3">
          <Button
            onPress={() => onCancel(item.id)}
            variant="outline"
            size="default"
            loading={isActionLoading}
            className="w-full"
            accessibilityRole="button"
            accessibilityLabel={t('roommates.cancel', 'Cancel')}
          >
            <Clock size={16} color={colors.mutedForeground} className="mr-1.5" />
            <Text className="font-body-medium text-sm text-muted-foreground">
              {t('roommates.cancel', 'Cancel')}
            </Text>
          </Button>
        </View>
      ) : null}
    </View>
  );
}

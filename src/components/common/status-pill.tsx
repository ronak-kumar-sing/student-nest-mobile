import React from 'react';
import { View, Text } from 'react-native';
import {
  Clock,
  CheckCircle2,
  XCircle,
  FileEdit,
  Send,
  HelpCircle,
  LucideIcon,
} from 'lucide-react-native';
import { cn } from '@/lib/cn';
import { colors } from '@/theme/tokens';

interface StatusConfig {
  label: string;
  badgeClass: string;
  textClass: string;
  icon: LucideIcon;
  iconColor: string;
}

const STATUS_CONFIGS: Record<string, StatusConfig> = {
  pending: {
    label: 'Pending',
    badgeClass: 'bg-warning/15 border-warning/30',
    textClass: 'text-warning',
    icon: Clock,
    iconColor: colors.warning,
  },
  pending_review: {
    label: 'Under Review',
    badgeClass: 'bg-warning/15 border-warning/30',
    textClass: 'text-warning',
    icon: Clock,
    iconColor: colors.warning,
  },
  approved: {
    label: 'Approved',
    badgeClass: 'bg-success/15 border-success/30',
    textClass: 'text-success',
    icon: CheckCircle2,
    iconColor: colors.success,
  },
  published: {
    label: 'Published',
    badgeClass: 'bg-success/15 border-success/30',
    textClass: 'text-success',
    icon: CheckCircle2,
    iconColor: colors.success,
  },
  confirmed: {
    label: 'Confirmed',
    badgeClass: 'bg-success/15 border-success/30',
    textClass: 'text-success',
    icon: CheckCircle2,
    iconColor: colors.success,
  },
  rejected: {
    label: 'Rejected',
    badgeClass: 'bg-destructive/15 border-destructive/30',
    textClass: 'text-destructive',
    icon: XCircle,
    iconColor: colors.destructive,
  },
  cancelled: {
    label: 'Cancelled',
    badgeClass: 'bg-destructive/15 border-destructive/30',
    textClass: 'text-destructive',
    icon: XCircle,
    iconColor: colors.destructive,
  },
  draft: {
    label: 'Draft',
    badgeClass: 'bg-muted border-border',
    textClass: 'text-muted-foreground',
    icon: FileEdit,
    iconColor: colors.mutedForeground,
  },
  submitted: {
    label: 'Submitted',
    badgeClass: 'bg-info/15 border-info/30',
    textClass: 'text-info',
    icon: Send,
    iconColor: colors.info,
  },
};

export interface StatusPillProps {
  status: string;
  className?: string;
}

export function StatusPill({ status, className }: StatusPillProps) {
  const config = STATUS_CONFIGS[status] ?? {
    label: status.replace(/_/g, ' '),
    badgeClass: 'bg-muted border-border',
    textClass: 'text-muted-foreground',
    icon: HelpCircle,
    iconColor: colors.mutedForeground,
  };

  const Icon = config.icon;

  return (
    <View
      className={cn(
        'flex-row items-center self-start rounded-full border px-2.5 py-1',
        config.badgeClass,
        className,
      )}
      accessibilityRole="text"
      accessibilityLabel={`Status: ${config.label}`}
    >
      <Icon size={12} color={config.iconColor} />
      <Text className={cn('ml-1.5 font-body-medium text-xs capitalize', config.textClass)}>
        {config.label}
      </Text>
    </View>
  );
}

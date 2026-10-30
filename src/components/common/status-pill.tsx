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
    iconColor: 'hsl(var(--warning))',
  },
  pending_review: {
    label: 'Under Review',
    badgeClass: 'bg-warning/15 border-warning/30',
    textClass: 'text-warning',
    icon: Clock,
    iconColor: 'hsl(var(--warning))',
  },
  approved: {
    label: 'Approved',
    badgeClass: 'bg-success/15 border-success/30',
    textClass: 'text-success',
    icon: CheckCircle2,
    iconColor: 'hsl(var(--success))',
  },
  published: {
    label: 'Published',
    badgeClass: 'bg-success/15 border-success/30',
    textClass: 'text-success',
    icon: CheckCircle2,
    iconColor: 'hsl(var(--success))',
  },
  confirmed: {
    label: 'Confirmed',
    badgeClass: 'bg-success/15 border-success/30',
    textClass: 'text-success',
    icon: CheckCircle2,
    iconColor: 'hsl(var(--success))',
  },
  rejected: {
    label: 'Rejected',
    badgeClass: 'bg-destructive/15 border-destructive/30',
    textClass: 'text-destructive',
    icon: XCircle,
    iconColor: 'hsl(var(--destructive))',
  },
  cancelled: {
    label: 'Cancelled',
    badgeClass: 'bg-destructive/15 border-destructive/30',
    textClass: 'text-destructive',
    icon: XCircle,
    iconColor: 'hsl(var(--destructive))',
  },
  draft: {
    label: 'Draft',
    badgeClass: 'bg-muted border-border',
    textClass: 'text-muted-foreground',
    icon: FileEdit,
    iconColor: 'hsl(var(--muted-foreground))',
  },
  submitted: {
    label: 'Submitted',
    badgeClass: 'bg-info/15 border-info/30',
    textClass: 'text-info',
    icon: Send,
    iconColor: 'hsl(var(--info))',
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
    iconColor: 'hsl(var(--muted-foreground))',
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


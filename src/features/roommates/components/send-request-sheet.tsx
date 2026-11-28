import React, { forwardRef, useEffect } from 'react';
import { View, Text, TextInput } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import BottomSheet from '@gorhom/bottom-sheet';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useThemeColors } from '@/theme/use-theme-colors';
import { sendRoommateRequestSchema } from '../schemas';
import type { RoommateMatchCardViewModel } from '../types';

interface SendRequestFormValues {
  message?: string;
}

export interface SendRequestSheetProps {
  targetStudent: RoommateMatchCardViewModel | null;
  onSend: (message?: string) => Promise<void>;
  isSending?: boolean;
  onClose?: () => void;
}

export const SendRequestSheet = forwardRef<BottomSheet, SendRequestSheetProps>(
  ({ targetStudent, onSend, isSending = false, onClose }, ref) => {
    const { t } = useTranslation();
    const colors = useThemeColors();

    const {
      control,
      handleSubmit,
      reset,
      watch,
      formState: { errors },
    } = useForm<SendRequestFormValues>({
      resolver: zodResolver(sendRoommateRequestSchema),
      defaultValues: {
        message: '',
      },
    });

    const messageValue = watch('message') ?? '';

    useEffect(() => {
      if (targetStudent) {
        reset({ message: '' });
      }
    }, [targetStudent, reset]);

    const onSubmit = async (data: SendRequestFormValues) => {
      await onSend(data.message?.trim() || undefined);
    };

    return (
      <Sheet ref={ref} snapPoints={['55%', '85%']} onClose={onClose}>
        <View className="flex-1 justify-between p-2">
          <View>
            <Text className="font-heading text-h3 text-foreground">
              {t('roommates.sendRequestTitle', 'Send Roommate Request')}
            </Text>
            {targetStudent ? (
              <Text className="font-body text-sm text-muted-foreground mt-0.5">
                {t('roommates.sendRequestTo', {
                  name: targetStudent.displayName,
                  defaultValue: `To ${targetStudent.displayName}`,
                })}
              </Text>
            ) : null}

            <View className="mt-4 gap-1.5">
              <Text className="font-body-medium text-sm text-foreground">
                {t('roommates.noteLabel', 'Add a friendly note (optional)')}
              </Text>
              <Controller
                control={control}
                name="message"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="min-h-[100px] rounded-xl border border-input bg-background p-3 font-body text-sm text-foreground"
                    placeholder={t(
                      'roommates.notePlaceholder',
                      'Hi! We have similar schedules and budgets. Would love to look for a 2BHK together!',
                    )}
                    placeholderTextColor={colors.mutedForeground}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    maxLength={300}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
              <View className="flex-row justify-between">
                {errors.message ? (
                  <Text className="font-body text-xs text-destructive">
                    {t(errors.message.message ?? '')}
                  </Text>
                ) : (
                  <View />
                )}
                <Text className="font-body text-xs text-muted-foreground">
                  {messageValue.length}/300
                </Text>
              </View>
            </View>
          </View>

          <View className="mt-6 gap-2">
            <Button
              onPress={() => {
                void handleSubmit(onSubmit)();
              }}
              loading={isSending}
              size="default"
              className="w-full"
              accessibilityRole="button"
              accessibilityLabel={t('roommates.sendButton', 'Send Request')}
            >
              <Text className="font-heading-semibold text-body text-primary-foreground">
                {isSending
                  ? t('roommates.sending', 'Sending...')
                  : t('roommates.sendButton', 'Send Request')}
              </Text>
            </Button>
          </View>
        </View>
      </Sheet>
    );
  },
);

SendRequestSheet.displayName = 'SendRequestSheet';

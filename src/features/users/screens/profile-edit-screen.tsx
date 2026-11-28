import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Chip } from '@/components/ui/chip';
import { toast } from '@/components/ui/toast';
import { useThemeColors } from '@/theme/use-theme-colors';
import { mediumImpact, selectionFeedback } from '@/lib/haptics';
import {
  profileEditSchema,
  type ProfileFormValues,
  VALID_CITIES,
} from '../schemas';
import {
  profileToFormDefaults,
  toUpdateProfileDto,
  getCityDisplayName,
} from '../mappers';
import { useMyProfile, useUpdateMyProfile } from '../queries';
import type { UserMeDto } from '../types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/common/error-state';
import { getErrorCode } from '@/api/errors';

const GENDER_OPTIONS = ['male', 'female', 'non_binary', 'undisclosed'] as const;

export function ProfileEditScreen() {
  const { t } = useTranslation();
  const { data: profileData, isLoading, isError, error, refetch } = useMyProfile();

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View testID="profile-edit-skeleton" className="gap-4 p-4">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !profileData) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-1">
          <ErrorState
            code={error ? getErrorCode(error) : undefined}
            onRetry={() => {
              void refetch();
            }}
          />
          <Button variant="ghost" onPress={() => router.back()}>
            {t('common.back')}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // Mount the form only once the profile is loaded so defaultValues are stable.
  return <ProfileEditForm profileData={profileData} />;
}

function ProfileEditForm({ profileData }: { profileData: UserMeDto }) {
  const { t } = useTranslation();
  const themeColors = useThemeColors();
  const updateProfileMutation = useUpdateMyProfile();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: profileToFormDefaults(profileData),
  });

  const bioValue = useWatch({ control, name: 'bio' }) ?? '';
  const selectedGender = useWatch({ control, name: 'gender' });
  const selectedCity = useWatch({ control, name: 'city' });

  const onValid = async (values: ProfileFormValues) => {
    mediumImpact();
    const patch = toUpdateProfileDto(values, profileData);
    if (Object.keys(patch).length === 0) {
      router.back();
      return;
    }

    try {
      await updateProfileMutation.mutateAsync(patch);
      router.back();
    } catch {
      // toast is handled in mutation onError
    }
  };

  const onInvalid = () => {
    selectionFeedback();
    toast.error(t('errors.VALIDATION_FAILED'));
  };

  const isSaving = updateProfileMutation.isPending;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Top Header */}
      <View className="flex-row items-center justify-between border-b border-border bg-card px-4 py-3">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            className="h-9 w-9 items-center justify-center rounded-full bg-muted/60"
            activeOpacity={0.7}
          >
            <ArrowLeft size={18} color={themeColors.foreground} />
          </TouchableOpacity>
          <Text className="font-heading text-h3 text-foreground">
            {t('profile.editProfileTitle')}
          </Text>
        </View>

        <TouchableOpacity
          testID="profile-edit-save"
          onPress={() => {
            void handleSubmit(onValid, onInvalid)();
          }}
          disabled={isSaving}
          className="flex-row items-center rounded-full bg-primary px-4 py-2 active:opacity-90"
          accessibilityRole="button"
          accessibilityLabel={t('common.save')}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={themeColors.primaryForeground} />
          ) : (
            <>
              <Check size={14} color={themeColors.primaryForeground} className="mr-1" />
              <Text className="font-heading-semibold text-xs text-primary-foreground">
                {t('common.save')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 60, gap: 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Full Name Field */}
        <View>
          <Text className="mb-1.5 font-body-medium text-xs text-foreground">
            {t('profile.nameLabel')} <Text className="text-destructive">*</Text>
          </Text>
          <Controller
            control={control}
            name="displayName"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                testID="profile-edit-name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={t('profile.namePlaceholder')}
                placeholderTextColor={themeColors.mutedForeground}
                maxLength={50}
                className="h-12 rounded-xl border border-border bg-card px-4 font-body text-sm text-foreground"
                autoCapitalize="words"
                accessibilityLabel={t('profile.nameLabel')}
              />
            )}
          />
          {Boolean(errors.displayName?.message) && (
            <Text className="mt-1 font-body text-xs text-destructive">
              {t(errors.displayName?.message ?? '')}
            </Text>
          )}
        </View>

        {/* Bio Field */}
        <View>
          <View className="mb-1.5 flex-row items-center justify-between">
            <Text className="font-body-medium text-xs text-foreground">
              {t('profile.bioLabel')}
            </Text>
            <Text className="font-body text-xs text-muted-foreground">
              {bioValue.length}/300
            </Text>
          </View>
          <Controller
            control={control}
            name="bio"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                testID="profile-edit-bio"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={t('profile.bioPlaceholder')}
                placeholderTextColor={themeColors.mutedForeground}
                maxLength={300}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="min-h-[84px] rounded-xl border border-border bg-card p-3 font-body text-sm text-foreground"
                accessibilityLabel={t('profile.bioLabel')}
              />
            )}
          />
          {Boolean(errors.bio?.message) && (
            <Text className="mt-1 font-body text-xs text-destructive">
              {t(errors.bio?.message ?? '')}
            </Text>
          )}
        </View>

        {/* Gender Chips */}
        <View>
          <Text className="mb-2 font-body-medium text-xs text-foreground">
            {t('profile.genderLabel')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {GENDER_OPTIONS.map((genderVal) => (
              <Chip
                key={genderVal}
                label={t(`profile.gender.${genderVal}`)}
                selected={selectedGender === genderVal}
                onPress={() => setValue('gender', genderVal, { shouldDirty: true })}
              />
            ))}
          </View>
          {Boolean(errors.gender?.message) && (
            <Text className="mt-1 font-body text-xs text-destructive">
              {t(errors.gender?.message ?? '')}
            </Text>
          )}
        </View>

        {/* College Field */}
        <View>
          <Text className="mb-1.5 font-body-medium text-xs text-foreground">
            {t('profile.collegeLabel')}
          </Text>
          <Controller
            control={control}
            name="college"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                testID="profile-edit-college"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={t('profile.collegePlaceholder')}
                placeholderTextColor={themeColors.mutedForeground}
                maxLength={100}
                className="h-12 rounded-xl border border-border bg-card px-4 font-body text-sm text-foreground"
                accessibilityLabel={t('profile.collegeLabel')}
              />
            )}
          />
          {Boolean(errors.college?.message) && (
            <Text className="mt-1 font-body text-xs text-destructive">
              {t(errors.college?.message ?? '')}
            </Text>
          )}
        </View>

        {/* City Chips */}
        <View>
          <Text className="mb-2 font-body-medium text-xs text-foreground">
            {t('profile.cityLabel')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {VALID_CITIES.map((citySlug) => (
              <Chip
                key={citySlug}
                label={getCityDisplayName(citySlug) ?? citySlug}
                selected={selectedCity === citySlug}
                onPress={() =>
                  setValue('city', selectedCity === citySlug ? '' : citySlug, {
                    shouldDirty: true,
                  })
                }
              />
            ))}
          </View>
          {Boolean(errors.city?.message) && (
            <Text className="mt-1 font-body text-xs text-destructive">
              {t(errors.city?.message ?? '')}
            </Text>
          )}
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

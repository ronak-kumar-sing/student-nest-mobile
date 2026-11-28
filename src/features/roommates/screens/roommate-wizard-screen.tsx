import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  X,
  AlertCircle,
} from 'lucide-react-native';
import { addDays, format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Chip } from '@/components/ui/chip';
import { useThemeColors } from '@/theme/use-theme-colors';
import { isApiError, ErrorCodes } from '@/api/errors';
import {
  makeRoommateWizardSchema,
  step1Fields,
  step2Fields,
  step3Fields,
} from '../schemas';
import {
  formValuesToUpsertDto,
  profileDtoToFormValues,
  slugify,
  slugToTitle,
} from '../mappers';
import {
  useRoommateProfile,
  useUpsertRoommateProfile,
} from '../queries';
import {
  ROOMMATE_INTERESTS,
  type RoommateInterest,
  type RoommateProfileDto,
  type RoommateWizardFormValues,
} from '../types';
import { useCitiesQuery } from '@/features/search';

export interface RoommateWizardScreenProps {
  initialProfile?: RoommateProfileDto | null;
  onComplete?: () => void;
}

/** Shown only until GET /v1/search/cities answers (the API's list is the source of truth). */
const FALLBACK_CITIES: readonly { slug: string; name: string }[] = [
  { slug: 'indore', name: 'Indore' },
  { slug: 'bhopal', name: 'Bhopal' },
  { slug: 'pune', name: 'Pune' },
];

const SUGGESTED_LOCALITIES: Record<string, string[]> = {
  indore: ['vijay-nagar', 'palasia', 'bhawarkua', 'sapna-sangeeta'],
  bhopal: ['mp-nagar', 'arera-colony', 'kolar-road'],
  pune: ['kothrud', 'viman-nagar', 'hinjewadi'],
};

function getRelativeDateStr(daysFromNow: number): string {
  return format(addDays(new Date(), daysFromNow), 'yyyy-MM-dd');
}

export function RoommateWizardScreen({
  initialProfile,
  onComplete,
}: RoommateWizardScreenProps) {
  const { t } = useTranslation();
  const { data: apiCities } = useCitiesQuery();
  const cityOptions =
    apiCities && apiCities.length > 0
      ? apiCities.map((c) => ({ slug: c.slug, name: c.name }))
      : FALLBACK_CITIES;
  const colors = useThemeColors();

  // Load profile from query if not passed via props (for edit mode)
  const { data: queriedProfile } = useRoommateProfile();
  const activeProfile = initialProfile !== undefined ? initialProfile : queriedProfile;

  const [step, setStep] = useState<number>(1);
  const [customLocality, setCustomLocality] = useState('');
  const [genderRequiredError, setGenderRequiredError] = useState(false);

  const defaultValues: RoommateWizardFormValues = activeProfile
    ? profileDtoToFormValues(activeProfile)
    : {
        citySlug: 'indore',
        preferredLocalities: ['vijay-nagar'],
        budgetMinRupees: 6000,
        budgetMaxRupees: 9000,
        moveInBy: getRelativeDateStr(14),
        preferredGender: 'any',
        lifestyle: {
          smoking: false,
          drinking: false,
          pets: false,
          diet: 'veg',
          sleepSchedule: 'flexible',
          cleanliness: 3,
          guests: 'sometimes',
          studyHabits: 'quiet',
        },
        bio: '',
        interests: ['reading', 'music'],
        college: '',
      };

  const {
    control,
    handleSubmit,
    setValue,
    trigger,
    reset,
    formState: { errors },
  } = useForm<RoommateWizardFormValues>({
    resolver: zodResolver(makeRoommateWizardSchema()),
    defaultValues,
    mode: 'onTouched',
  });

  useEffect(() => {
    if (activeProfile) {
      reset(profileDtoToFormValues(activeProfile));
    }
  }, [activeProfile, reset]);

  const upsertMutation = useUpsertRoommateProfile();

  const selectedCity = useWatch({ control, name: 'citySlug' });
  const selectedLocalities = useWatch({ control, name: 'preferredLocalities' }) ?? [];
  const selectedInterests = useWatch({ control, name: 'interests' }) ?? [];
  const bioValue = useWatch({ control, name: 'bio' }) ?? '';

  // ─── Step Navigation Handlers ─────────────────────────────────────

  const handleNext = async () => {
    if (step === 1) {
      const valid = await trigger(step1Fields as unknown as (keyof RoommateWizardFormValues)[]);
      if (valid) setStep(2);
    } else if (step === 2) {
      const valid = await trigger(step2Fields as unknown as (keyof RoommateWizardFormValues)[]);
      if (valid) setStep(3);
    } else if (step === 3) {
      const valid = await trigger(step3Fields as unknown as (keyof RoommateWizardFormValues)[]);
      if (valid) setStep(4);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const onSubmit = async (values: RoommateWizardFormValues) => {
    try {
      setGenderRequiredError(false);
      const dto = formValuesToUpsertDto(values);
      await upsertMutation.mutateAsync(dto);
      if (onComplete) {
        onComplete();
      } else {
        router.back();
      }
    } catch (err) {
      if (isApiError(err) && err.code === ErrorCodes.GENDER_REQUIRED) {
        setGenderRequiredError(true);
        setStep(2); // Jump back to gender step
      }
    }
  };

  // ─── Localities Logic ─────────────────────────────────────────────

  const toggleLocality = (localitySlug: string) => {
    if (selectedLocalities.includes(localitySlug)) {
      setValue(
        'preferredLocalities',
        selectedLocalities.filter((l) => l !== localitySlug),
        { shouldValidate: true },
      );
    } else if (selectedLocalities.length < 5) {
      setValue('preferredLocalities', [...selectedLocalities, localitySlug], {
        shouldValidate: true,
      });
    }
  };

  const addCustomLocality = () => {
    const slug = slugify(customLocality);
    if (!slug) return;
    if (!selectedLocalities.includes(slug) && selectedLocalities.length < 5) {
      setValue('preferredLocalities', [...selectedLocalities, slug], {
        shouldValidate: true,
      });
      setCustomLocality('');
    }
  };

  // ─── Interests Logic ──────────────────────────────────────────────

  const toggleInterest = (interest: RoommateInterest) => {
    if (selectedInterests.includes(interest)) {
      setValue(
        'interests',
        selectedInterests.filter((i) => i !== interest),
        { shouldValidate: true },
      );
    } else if (selectedInterests.length < 10) {
      setValue('interests', [...selectedInterests, interest], {
        shouldValidate: true,
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Top Header & Step Progress Bar */}
      <View className="border-b border-border/40 px-4 pb-3 pt-2">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={handleBack}
            className="rounded-full bg-secondary p-2"
            accessibilityRole="button"
            accessibilityLabel={t('common.back', 'Back')}
          >
            <ArrowLeft size={18} color={colors.foreground} />
          </TouchableOpacity>

          <Text className="font-heading-semibold text-body text-foreground">
            {activeProfile
              ? t('roommates.editTitle', 'Edit Roommate Profile')
              : t('roommates.createTitle', 'Create Roommate Profile')}
          </Text>

          <Text className="font-body-medium text-xs text-muted-foreground">
            {t('roommates.stepIndicator', { step, defaultValue: `Step ${step} of 4` })}
          </Text>
        </View>

        {/* 4-segment progress bar */}
        <View className="mt-3 flex-row gap-1.5">
          {[1, 2, 3, 4].map((i) => (
            <View
              key={i}
              className={`h-1 flex-1 rounded-full ${
                i <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </View>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ════════════════════════════════════════════════════════════
            STEP 1: City & Localities
        ════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <View className="gap-6">
            <View>
              <Text className="font-heading text-h2 text-foreground">
                {t('roommates.step1Title', 'City & Localities')}
              </Text>
              <Text className="mt-1 font-body text-sm text-muted-foreground">
                {t('roommates.step1Subtitle', 'Where do you want to live?')}
              </Text>
            </View>

            {/* City Chips */}
            <View className="gap-2">
              <Text className="font-body-medium text-sm text-foreground">
                {t('roommates.cityLabel', 'City')}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {cityOptions.map((c) => (
                  <Chip
                    key={c.slug}
                    label={c.name}
                    selected={selectedCity === c.slug}
                    onPress={() => {
                      setValue('citySlug', c.slug, { shouldValidate: true });
                      setValue('preferredLocalities', [], { shouldValidate: true });
                    }}
                  />
                ))}
              </View>
              {errors.citySlug ? (
                <Text className="font-body text-xs text-destructive">
                  {t(errors.citySlug.message ?? '')}
                </Text>
              ) : null}
            </View>

            {/* Localities Chips */}
            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="font-body-medium text-sm text-foreground">
                  {t('roommates.localitiesLabel', 'Preferred Localities (up to 5)')}
                </Text>
                <Text className="font-body text-xs text-muted-foreground">
                  {selectedLocalities.length}/5
                </Text>
              </View>

              {/* Selected Localities */}
              {selectedLocalities.length > 0 && (
                <View className="flex-row flex-wrap gap-1.5 mb-2">
                  {selectedLocalities.map((slug) => (
                    <TouchableOpacity
                      key={slug}
                      onPress={() => toggleLocality(slug)}
                      className="flex-row items-center gap-1 rounded-full bg-primary px-3 py-1.5"
                    >
                      <Text className="font-body-semibold text-xs text-primary-foreground">
                        {slugToTitle(slug)}
                      </Text>
                      <X size={12} color={colors.primaryForeground} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Suggested Localities for Current City */}
              <Text className="font-body text-xs text-muted-foreground mt-1">
                Suggested in {slugToTitle(selectedCity)}:
              </Text>
              <View className="flex-row flex-wrap gap-1.5">
                {(SUGGESTED_LOCALITIES[selectedCity] ?? []).map((slug) => {
                  const isSelected = selectedLocalities.includes(slug);
                  return (
                    <Chip
                      key={slug}
                      label={slugToTitle(slug)}
                      selected={isSelected}
                      onPress={() => toggleLocality(slug)}
                    />
                  );
                })}
              </View>

              {/* Custom Locality Input */}
              {selectedLocalities.length < 5 && (
                <View className="mt-3 flex-row gap-2">
                  <TextInput
                    className="flex-1 rounded-xl border border-input bg-background px-3 py-2 font-body text-sm text-foreground"
                    placeholder={t(
                      'roommates.customLocalityPlaceholder',
                      'Type locality and press add',
                    )}
                    placeholderTextColor={colors.mutedForeground}
                    value={customLocality}
                    onChangeText={setCustomLocality}
                  />
                  <Button
                    onPress={addCustomLocality}
                    size="sm"
                    variant="secondary"
                    accessibilityRole="button"
                    accessibilityLabel={t('roommates.addLocality', 'Add')}
                  >
                    <Plus size={16} color={colors.foreground} />
                  </Button>
                </View>
              )}

              {errors.preferredLocalities ? (
                <Text className="font-body text-xs text-destructive">
                  {t(errors.preferredLocalities.message ?? '')}
                </Text>
              ) : null}
            </View>
          </View>
        )}

        {/* ════════════════════════════════════════════════════════════
            STEP 2: Budget & Move-in
        ════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <View className="gap-6">
            <View>
              <Text className="font-heading text-h2 text-foreground">
                {t('roommates.step2Title', 'Budget & Move-in')}
              </Text>
              <Text className="mt-1 font-body text-sm text-muted-foreground">
                {t('roommates.step2Subtitle', 'Rent expectations and timeline')}
              </Text>
            </View>

            {genderRequiredError && (
              <View className="rounded-xl border border-destructive/40 bg-destructive/10 p-3.5 flex-row items-start gap-2.5">
                <AlertCircle size={18} color={colors.destructive} className="mt-0.5" />
                <Text className="flex-1 font-body text-xs text-destructive">
                  {t(
                    'roommates.genderRequiredNotice',
                    'To prefer the same gender, please set your gender in your Profile first.',
                  )}
                </Text>
              </View>
            )}

            {/* Budget Range Inputs */}
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Controller
                  control={control}
                  name="budgetMinRupees"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label={t('roommates.budgetMinLabel', 'Min monthly budget (₹)')}
                      placeholder="6000"
                      keyboardType="numeric"
                      value={value ? String(value) : ''}
                      onChangeText={(t) => onChange(Number(t) || 0)}
                      error={errors.budgetMinRupees?.message ? t(errors.budgetMinRupees.message) : undefined}
                    />
                  )}
                />
              </View>

              <View className="flex-1">
                <Controller
                  control={control}
                  name="budgetMaxRupees"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label={t('roommates.budgetMaxLabel', 'Max monthly budget (₹)')}
                      placeholder="9000"
                      keyboardType="numeric"
                      value={value ? String(value) : ''}
                      onChangeText={(t) => onChange(Number(t) || 0)}
                      error={errors.budgetMaxRupees?.message ? t(errors.budgetMaxRupees.message) : undefined}
                    />
                  )}
                />
              </View>
            </View>

            {/* Move-in Date */}
            <View className="gap-2">
              <Controller
                control={control}
                name="moveInBy"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label={t('roommates.moveInDateLabel', 'Target move-in date (YYYY-MM-DD)')}
                    placeholder="YYYY-MM-DD"
                    value={value}
                    onChangeText={onChange}
                    error={errors.moveInBy?.message ? t(errors.moveInBy.message) : undefined}
                  />
                )}
              />

              <View className="flex-row gap-2 mt-1">
                <Chip
                  label={t('roommates.twoWeeksChip', 'In 2 weeks')}
                  onPress={() => setValue('moveInBy', getRelativeDateStr(14), { shouldValidate: true })}
                />
                <Chip
                  label={t('roommates.nextMonthChip', 'Next month')}
                  onPress={() => setValue('moveInBy', getRelativeDateStr(30), { shouldValidate: true })}
                />
              </View>
            </View>

            {/* Preferred Gender */}
            <View className="gap-2">
              <Text className="font-body-medium text-sm text-foreground">
                {t('roommates.preferredGenderLabel', 'Preferred Roommate Gender')}
              </Text>
              <Controller
                control={control}
                name="preferredGender"
                render={({ field: { onChange, value } }) => (
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => onChange('any')}
                      className={`flex-1 rounded-xl border p-3.5 items-center ${
                        value === 'any'
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-card'
                      }`}
                      accessibilityRole="button"
                    >
                      <Text
                        className={`font-body-semibold text-sm ${
                          value === 'any' ? 'text-primary' : 'text-foreground'
                        }`}
                      >
                        {t('roommates.genderAny', 'Anyone')}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => onChange('same')}
                      className={`flex-1 rounded-xl border p-3.5 items-center ${
                        value === 'same'
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-card'
                      }`}
                      accessibilityRole="button"
                    >
                      <Text
                        className={`font-body-semibold text-sm ${
                          value === 'same' ? 'text-primary' : 'text-foreground'
                        }`}
                      >
                        {t('roommates.genderSame', 'Same gender as me')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.preferredGender ? (
                <Text className="font-body text-xs text-destructive">
                  {t(errors.preferredGender.message ?? '')}
                </Text>
              ) : null}
            </View>
          </View>
        )}

        {/* ════════════════════════════════════════════════════════════
            STEP 3: Lifestyle & Habits
        ════════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <View className="gap-5">
            <View>
              <Text className="font-heading text-h2 text-foreground">
                {t('roommates.step3Title', 'Lifestyle & Habits')}
              </Text>
              <Text className="mt-1 font-body text-sm text-muted-foreground">
                {t('roommates.step3Subtitle', 'Match with students who live like you')}
              </Text>
            </View>

            {/* Diet */}
            <View className="gap-2">
              <Text className="font-body-medium text-sm text-foreground">
                {t('roommates.dietLabel', 'Diet')}
              </Text>
              <Controller
                control={control}
                name="lifestyle.diet"
                render={({ field: { onChange, value } }) => (
                  <View className="flex-row gap-2">
                    <Chip
                      label={t('roommates.dietVeg', 'Vegetarian')}
                      selected={value === 'veg'}
                      onPress={() => onChange('veg')}
                    />
                    <Chip
                      label={t('roommates.dietEggetarian', 'Eggetarian')}
                      selected={value === 'eggetarian'}
                      onPress={() => onChange('eggetarian')}
                    />
                    <Chip
                      label={t('roommates.dietNonVeg', 'Non-Veg')}
                      selected={value === 'non_veg'}
                      onPress={() => onChange('non_veg')}
                    />
                  </View>
                )}
              />
            </View>

            {/* Sleep Schedule */}
            <View className="gap-2">
              <Text className="font-body-medium text-sm text-foreground">
                {t('roommates.sleepScheduleLabel', 'Sleep schedule')}
              </Text>
              <Controller
                control={control}
                name="lifestyle.sleepSchedule"
                render={({ field: { onChange, value } }) => (
                  <View className="flex-row gap-2">
                    <Chip
                      label={t('roommates.sleepEarly', 'Early riser')}
                      selected={value === 'early'}
                      onPress={() => onChange('early')}
                    />
                    <Chip
                      label={t('roommates.sleepLate', 'Night owl')}
                      selected={value === 'late'}
                      onPress={() => onChange('late')}
                    />
                    <Chip
                      label={t('roommates.sleepFlexible', 'Flexible')}
                      selected={value === 'flexible'}
                      onPress={() => onChange('flexible')}
                    />
                  </View>
                )}
              />
            </View>

            {/* Cleanliness rating (1-5) */}
            <View className="gap-2">
              <Text className="font-body-medium text-sm text-foreground">
                {t('roommates.cleanlinessLabel', 'Cleanliness (1 relaxed – 5 spotless)')}
              </Text>
              <Controller
                control={control}
                name="lifestyle.cleanliness"
                render={({ field: { onChange, value } }) => (
                  <View className="flex-row gap-2">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <TouchableOpacity
                        key={lvl}
                        onPress={() => onChange(lvl)}
                        className={`h-11 flex-1 items-center justify-center rounded-xl border ${
                          value === lvl
                            ? 'border-primary bg-primary'
                            : 'border-border bg-card'
                        }`}
                        accessibilityRole="button"
                      >
                        <Text
                          className={`font-heading-semibold text-sm ${
                            value === lvl ? 'text-primary-foreground' : 'text-foreground'
                          }`}
                        >
                          {lvl}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              />
            </View>

            {/* Guests Policy */}
            <View className="gap-2">
              <Text className="font-body-medium text-sm text-foreground">
                {t('roommates.guestsLabel', 'Guests policy')}
              </Text>
              <Controller
                control={control}
                name="lifestyle.guests"
                render={({ field: { onChange, value } }) => (
                  <View className="flex-row gap-2">
                    <Chip
                      label={t('roommates.guestsRarely', 'Rarely')}
                      selected={value === 'rarely'}
                      onPress={() => onChange('rarely')}
                    />
                    <Chip
                      label={t('roommates.guestsSometimes', 'Sometimes')}
                      selected={value === 'sometimes'}
                      onPress={() => onChange('sometimes')}
                    />
                    <Chip
                      label={t('roommates.guestsOften', 'Often')}
                      selected={value === 'often'}
                      onPress={() => onChange('often')}
                    />
                  </View>
                )}
              />
            </View>

            {/* Study Habits */}
            <View className="gap-2">
              <Text className="font-body-medium text-sm text-foreground">
                {t('roommates.studyHabitsLabel', 'Study habits')}
              </Text>
              <Controller
                control={control}
                name="lifestyle.studyHabits"
                render={({ field: { onChange, value } }) => (
                  <View className="flex-row gap-2">
                    <Chip
                      label={t('roommates.studyQuiet', 'Quiet')}
                      selected={value === 'quiet'}
                      onPress={() => onChange('quiet')}
                    />
                    <Chip
                      label={t('roommates.studyMusic', 'With music')}
                      selected={value === 'music'}
                      onPress={() => onChange('music')}
                    />
                    <Chip
                      label={t('roommates.studyFlexible', 'Flexible')}
                      selected={value === 'flexible'}
                      onPress={() => onChange('flexible')}
                    />
                  </View>
                )}
              />
            </View>

            {/* Smoking, Drinking, Pets Boolean Toggles */}
            <View className="gap-3 pt-2 border-t border-border/50">
              <Controller
                control={control}
                name="lifestyle.smoking"
                render={({ field: { onChange, value } }) => (
                  <View className="flex-row items-center justify-between">
                    <Text className="font-body-medium text-sm text-foreground">
                      {t('roommates.smokingLabel', 'Smoking')}
                    </Text>
                    <View className="flex-row gap-1.5">
                      <Chip label={t('roommates.no', 'No')} selected={!value} onPress={() => onChange(false)} />
                      <Chip label={t('roommates.yes', 'Yes')} selected={value} onPress={() => onChange(true)} />
                    </View>
                  </View>
                )}
              />

              <Controller
                control={control}
                name="lifestyle.drinking"
                render={({ field: { onChange, value } }) => (
                  <View className="flex-row items-center justify-between">
                    <Text className="font-body-medium text-sm text-foreground">
                      {t('roommates.drinkingLabel', 'Drinking')}
                    </Text>
                    <View className="flex-row gap-1.5">
                      <Chip label={t('roommates.no', 'No')} selected={!value} onPress={() => onChange(false)} />
                      <Chip label={t('roommates.yes', 'Yes')} selected={value} onPress={() => onChange(true)} />
                    </View>
                  </View>
                )}
              />

              <Controller
                control={control}
                name="lifestyle.pets"
                render={({ field: { onChange, value } }) => (
                  <View className="flex-row items-center justify-between">
                    <Text className="font-body-medium text-sm text-foreground">
                      {t('roommates.petsLabel', 'Pet friendly')}
                    </Text>
                    <View className="flex-row gap-1.5">
                      <Chip label={t('roommates.no', 'No')} selected={!value} onPress={() => onChange(false)} />
                      <Chip label={t('roommates.yes', 'Yes')} selected={value} onPress={() => onChange(true)} />
                    </View>
                  </View>
                )}
              />
            </View>
          </View>
        )}

        {/* ════════════════════════════════════════════════════════════
            STEP 4: Bio & Interests
        ════════════════════════════════════════════════════════════ */}
        {step === 4 && (
          <View className="gap-6">
            <View>
              <Text className="font-heading text-h2 text-foreground">
                {t('roommates.step4Title', 'Bio & Interests')}
              </Text>
              <Text className="mt-1 font-body text-sm text-muted-foreground">
                {t('roommates.step4Subtitle', 'Tell roommates a bit about yourself')}
              </Text>
            </View>

            {/* Bio Input */}
            <View className="gap-1.5">
              <Text className="font-body-medium text-sm text-foreground">
                {t('roommates.bioLabel', 'About you')}
              </Text>
              <Controller
                control={control}
                name="bio"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="min-h-[100px] rounded-xl border border-input bg-background p-3 font-body text-sm text-foreground"
                    placeholder={t(
                      'roommates.bioPlaceholder',
                      'Share a few sentences about your college, daily routine, or hobbies...',
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
                {errors.bio ? (
                  <Text className="font-body text-xs text-destructive">
                    {t(errors.bio.message ?? '')}
                  </Text>
                ) : (
                  <View />
                )}
                <Text className="font-body text-xs text-muted-foreground">
                  {bioValue.length}/300
                </Text>
              </View>
            </View>

            {/* College Input */}
            <Controller
              control={control}
              name="college"
              render={({ field: { onChange, value } }) => (
                <Input
                  label={t('roommates.collegeLabel', 'College (optional)')}
                  placeholder={t('roommates.collegePlaceholder', 'e.g. IIPS Indore')}
                  value={value ?? ''}
                  onChangeText={onChange}
                  error={errors.college?.message ? t(errors.college.message) : undefined}
                />
              )}
            />

            {/* Interests Chips (max 10) */}
            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="font-body-medium text-sm text-foreground">
                  {t('roommates.interestsLabel', 'Interests (pick up to 10)')}
                </Text>
                <Text className="font-body text-xs text-muted-foreground">
                  {selectedInterests.length}/10
                </Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {ROOMMATE_INTERESTS.map((interest) => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <Chip
                      key={interest}
                      label={t(`roommates.interest.${interest}`)}
                      selected={isSelected}
                      onPress={() => toggleInterest(interest)}
                    />
                  );
                })}
              </View>
              {errors.interests ? (
                <Text className="font-body text-xs text-destructive">
                  {t(errors.interests.message ?? '')}
                </Text>
              ) : null}
            </View>
          </View>
        )}
      </KeyboardAwareScrollView>

      {/* Bottom Sticky Action Bar */}
      <View className="border-t border-border/40 bg-background/90 px-4 py-3">
        {step < 4 ? (
          <Button
            onPress={handleNext}
            size="lg"
            className="w-full"
            accessibilityRole="button"
            accessibilityLabel={t('roommates.nextButton', 'Next')}
          >
            <Text className="font-heading-semibold text-body text-primary-foreground mr-2">
              {t('roommates.nextButton', 'Next')}
            </Text>
            <ArrowRight size={18} color={colors.primaryForeground} />
          </Button>
        ) : (
          <Button
            onPress={() => {
              void handleSubmit(onSubmit)();
            }}
            loading={upsertMutation.isPending}
            size="lg"
            className="w-full"
            accessibilityRole="button"
            accessibilityLabel={t('roommates.saveButton', 'Save Profile')}
          >
            <Check size={18} color={colors.primaryForeground} className="mr-2" />
            <Text className="font-heading-semibold text-body text-primary-foreground">
              {t('roommates.saveButton', 'Save Profile')}
            </Text>
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
}

export default RoommateWizardScreen;

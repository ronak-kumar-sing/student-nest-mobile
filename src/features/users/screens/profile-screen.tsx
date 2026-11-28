import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import {
  User,
  Phone,
  GraduationCap,
  MapPin,
  Building2,
  Building,
  Zap,
  ShieldCheck,
  Users,
  MessageSquare,
  LogOut,
  Wrench,
  ChevronRight,
  Pencil,
  AlertTriangle,
  X,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/common/error-state';
import { useThemeColors } from '@/theme/use-theme-colors';
import { useSessionStore } from '@/stores/session';
import { authApi } from '@/features/auth/api';
import { isApiError, ErrorCodes, getErrorMessage, getErrorCode } from '@/api/errors';
import { SHOW_DEV_MENU } from '@/lib/dev';
import { useMyProfile, useBecomeOwner } from '../queries';
import { userMeToProfileViewModel } from '../mappers';

export function ProfileScreen() {
  const { t } = useTranslation();
  const themeColors = useThemeColors();
  const { data, isLoading, isError, error, refetch, isRefetching } = useMyProfile();
  const becomeOwnerMutation = useBecomeOwner();

  const [showBecomeOwner, setShowBecomeOwner] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [becomeOwnerError, setBecomeOwnerError] = useState('');

  const handleSignOut = async () => {
    try {
      await authApi.signOut();
    } catch {
      useSessionStore.getState().logout();
    }
    router.replace('/(auth)');
  };

  const handleConfirmBecomeOwner = async () => {
    setBecomeOwnerError('');
    const cleanBusinessName = businessName.trim();
    if (cleanBusinessName && cleanBusinessName.length < 2) {
      setBecomeOwnerError(t('profile.businessNameTooShort'));
      return;
    }

    try {
      await becomeOwnerMutation.mutateAsync(
        cleanBusinessName ? { businessName: cleanBusinessName } : undefined,
      );
      setShowBecomeOwner(false);
    } catch (err: unknown) {
      // The mutation's onError already shows a toast; keep an inline message in the sheet.
      if (isApiError(err)) {
        setBecomeOwnerError(
          err.code === ErrorCodes.ACTIVE_BOOKINGS_EXIST
            ? t('profile.activeBookingsExistError')
            : t(getErrorMessage(err.code)),
        );
      } else {
        setBecomeOwnerError(t('common.error'));
      }
    }
  };

  // 1. Loading Skeleton
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-row items-center justify-between border-b border-border bg-card px-4 py-3">
          <Text className="font-heading text-h2 text-foreground">{t('profile.title')}</Text>
        </View>
        <ScrollView
          testID="profile-skeleton"
          className="flex-1"
          contentContainerStyle={{ padding: 16, gap: 16 }}
        >
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 2. Error State
  if (isError || !data) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-row items-center justify-between border-b border-border bg-card px-4 py-3">
          <Text className="font-heading text-h2 text-foreground">{t('profile.title')}</Text>
        </View>
        <ErrorState
          code={error ? getErrorCode(error) : undefined}
          onRetry={() => refetch()}
        />
      </SafeAreaView>
    );
  }

  const vm = userMeToProfileViewModel(data);
  // Fixed ids of the shared demo accounts (backend docs/features/01-auth.md).
  const isDemoAccount = vm.id === 'demo_student' || vm.id === 'demo_owner';
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Top Header */}
      <View className="flex-row items-center justify-between border-b border-border bg-card px-4 py-3">
        <Text className="font-heading text-h2 text-foreground">{t('profile.title')}</Text>
        <View className="flex-row items-center gap-2">
          {SHOW_DEV_MENU && (
            <TouchableOpacity
              onPress={() => router.push('/dev')}
              className="flex-row items-center rounded-full bg-muted/80 px-2.5 py-1.5"
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Open Dev Menu"
            >
              <Wrench size={13} color={themeColors.mutedForeground} className="mr-1" />
              <Text className="font-body-medium text-xs text-muted-foreground">Dev</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            testID="profile-edit-button"
            onPress={() => router.push('/profile/edit')}
            className="flex-row items-center rounded-full bg-primary/10 px-3 py-1.5"
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('profile.edit')}
          >
            <Pencil size={14} color={themeColors.primary} />
            <Text className="ml-1.5 font-body-semibold text-xs text-primary">
              {t('profile.edit')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              void refetch();
            }}
            tintColor={themeColors.primary}
            colors={[themeColors.primary]}
          />
        }
      >
        {/* Identity Card */}
        <View className="mb-5 overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-elevation-1">
          <View className="flex-row items-center gap-4">
            <Avatar src={vm.avatarUrl} name={vm.displayName} size="lg" />
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text
                  testID="profile-name"
                  className="font-heading text-h3 text-foreground"
                  numberOfLines={1}
                >
                  {vm.displayName || t('profile.unnamed')}
                </Text>
                <Badge variant={vm.role === 'owner' ? 'default' : 'secondary'}>
                  {vm.role === 'owner' ? t('profile.roleOwner') : t('profile.roleStudent')}
                </Badge>
              </View>
              <Text className="mt-0.5 font-body text-xs text-muted-foreground" numberOfLines={1}>
                {vm.email}
              </Text>
              {vm.phone ? (
                <View className="mt-1 flex-row items-center gap-1.5">
                  <Phone size={11} color={themeColors.mutedForeground} />
                  <Text className="font-body text-xs text-muted-foreground">{vm.phone}</Text>
                  {vm.phoneVerified ? (
                    <Badge variant="success" className="px-1.5 py-0">
                      {t('profile.verified')}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="px-1.5 py-0">
                      {t('profile.notVerified')}
                    </Badge>
                  )}
                </View>
              ) : null}
            </View>
          </View>

          {/* Additional details */}
          {(vm.college || vm.gender || vm.cityDisplayName || vm.bio) && (
            <View className="mt-4 border-t border-border/60 pt-3 gap-2">
              {vm.college ? (
                <View className="flex-row items-center gap-2">
                  <GraduationCap size={14} color={themeColors.mutedForeground} />
                  <Text className="font-body text-xs text-foreground">{vm.college}</Text>
                </View>
              ) : null}
              {vm.cityDisplayName ? (
                <View className="flex-row items-center gap-2">
                  <MapPin size={14} color={themeColors.mutedForeground} />
                  <Text className="font-body text-xs text-foreground">{vm.cityDisplayName}</Text>
                </View>
              ) : null}
              {vm.gender ? (
                <View className="flex-row items-center gap-2">
                  <User size={14} color={themeColors.mutedForeground} />
                  <Text className="font-body text-xs text-foreground">
                    {t(vm.genderLabelKey)}
                  </Text>
                </View>
              ) : null}
              {vm.bio ? (
                <Text className="mt-1 font-body text-xs italic text-muted-foreground">
                  &ldquo;{vm.bio}&rdquo;
                </Text>
              ) : null}
            </View>
          )}
        </View>

        {/* Verification Section */}
        <View className="mb-5 overflow-hidden rounded-xl border border-border bg-card shadow-elevation-1">
          <View className="border-b border-border/60 bg-muted/30 px-4 py-2.5">
            <Text className="font-heading text-xs uppercase tracking-wider text-muted-foreground">
              {t('profile.verificationTitle')}
            </Text>
          </View>

          {/* DigiLocker (Identity) - Coming Soon */}
          <View className="flex-row items-center justify-between gap-3 border-b border-border/40 p-3.5">
            <View className="flex-1 flex-row items-center gap-3">
              <ShieldCheck size={18} color={themeColors.mutedForeground} />
              <View className="flex-1">
                <Text className="font-body text-sm text-foreground">
                  {t('profile.identityDigilocker')}
                </Text>
                <Text className="font-body text-xs text-muted-foreground">
                  {t('profile.digilockerSubtitle')}
                </Text>
              </View>
            </View>
            <Badge variant="outline">{t('profile.comingSoon')}</Badge>
          </View>

          {/* Phone verification status */}
          <View
            className="flex-row items-center justify-between p-3.5"
            accessible
            accessibilityLabel={`${t('profile.phoneVerification')}: ${
              vm.phoneVerified ? t('profile.verified') : t('profile.notVerified')
            }`}
          >
            <View className="flex-row items-center gap-3">
              <Phone size={18} color={themeColors.mutedForeground} />
              <View>
                <Text className="font-body text-sm text-foreground">
                  {t('profile.phoneVerification')}
                </Text>
                <Text className="font-body text-xs text-muted-foreground">
                  {vm.phone ? vm.phone : t('profile.noPhoneAdded')}
                </Text>
              </View>
            </View>
            {vm.phoneVerified ? (
              <Badge variant="success">{t('profile.verified')}</Badge>
            ) : (
              <Badge variant="warning">{t('profile.notVerified')}</Badge>
            )}
          </View>
        </View>

        {/* Students-Only Navigation Links */}
        {vm.role === 'student' && (
          <View className="mb-5 overflow-hidden rounded-xl border border-border bg-card shadow-elevation-1">
            <TouchableOpacity
              onPress={() => router.push('/(student)/(tabs)/roommates')}
              className="flex-row items-center justify-between border-b border-border/40 p-3.5"
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('profile.roommateProfile')}
            >
              <View className="flex-row items-center gap-3">
                <Users size={18} color={themeColors.mutedForeground} />
                <Text className="font-body text-sm text-foreground">
                  {t('profile.roommateProfile')}
                </Text>
              </View>
              <ChevronRight size={16} color={themeColors.mutedForeground} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(student)/messages')}
              className="flex-row items-center justify-between p-3.5"
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('profile.messages')}
            >
              <View className="flex-row items-center gap-3">
                <MessageSquare size={18} color={themeColors.mutedForeground} />
                <Text className="font-body text-sm text-foreground">
                  {t('profile.messages')}
                </Text>
              </View>
              <ChevronRight size={16} color={themeColors.mutedForeground} />
            </TouchableOpacity>
          </View>
        )}

        {/* Owners-Only Status & Stats */}
        {vm.role === 'owner' && (
          <View className="mb-5 overflow-hidden rounded-xl border border-border bg-card shadow-elevation-1">
            <View className="border-b border-border/60 bg-muted/30 px-4 py-2.5">
              <Text className="font-heading text-xs uppercase tracking-wider text-muted-foreground">
                {t('profile.ownerAccount')}
              </Text>
            </View>

            {/* KYC Status Row */}
            <View className="flex-row items-center justify-between border-b border-border/40 p-3.5">
              <View className="flex-row items-center gap-3">
                <ShieldCheck size={18} color={themeColors.mutedForeground} />
                <Text className="font-body text-sm text-foreground">
                  {t('profile.ownerKyc')}
                </Text>
              </View>
              <Badge
                variant={
                  vm.kycStatus === 'approved'
                    ? 'success'
                    : vm.kycStatus === 'pending'
                      ? 'warning'
                      : vm.kycStatus === 'rejected'
                        ? 'destructive'
                        : 'outline'
                }
              >
                {t(`profile.kycStatus.${vm.kycStatus}`)}
              </Badge>
            </View>

            {/* Listed Properties Count */}
            {vm.ownerStats && (
              <View className="flex-row items-center justify-between border-b border-border/40 p-3.5">
                <View className="flex-row items-center gap-3">
                  <Building size={18} color={themeColors.mutedForeground} />
                  <Text className="font-body text-sm text-foreground">
                    {t('profile.listedProperties')}
                  </Text>
                </View>
                <Text className="font-heading text-sm text-foreground">
                  {vm.ownerStats.listedPropertyCount}
                </Text>
              </View>
            )}

            {/* Response Rate if available */}
            {vm.ownerStats?.responseRate != null && (
              <View className="flex-row items-center justify-between p-3.5">
                <View className="flex-row items-center gap-3">
                  <Zap size={18} color={themeColors.mutedForeground} />
                  <Text className="font-body text-sm text-foreground">
                    {t('profile.responseRate')}
                  </Text>
                </View>
                <Text className="font-heading text-sm text-foreground">
                  {Math.round(vm.ownerStats.responseRate * 100)}%
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Shared demo accounts cannot become owners (API answers 403 DEMO_ACCOUNT_LOCKED) */}
        {vm.role === 'student' && isDemoAccount && (
          <View
            testID="demo-account-note"
            className="mb-5 rounded-xl border border-border bg-muted/40 p-4"
          >
            <Text className="font-body text-xs text-muted-foreground">
              {t('profile.demoAccountNote')}
            </Text>
          </View>
        )}

        {/* Students-Only "Become an Owner" Card */}
        {vm.role === 'student' && !isDemoAccount && (
          <TouchableOpacity
            testID="become-owner-button"
            onPress={() => {
              setBecomeOwnerError('');
              setShowBecomeOwner(true);
            }}
            className="mb-5 flex-row items-center justify-between rounded-xl border border-primary/30 bg-primary/5 p-4"
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('profile.becomeOwnerTitle')}
          >
            <View className="flex-1 flex-row items-center pr-3">
              <Building2 size={22} color={themeColors.primary} className="mr-3" />
              <View className="flex-1">
                <Text className="font-heading-semibold text-sm text-primary">
                  {t('profile.becomeOwnerTitle')}
                </Text>
                <Text className="mt-0.5 font-body text-xs text-muted-foreground">
                  {t('profile.becomeOwnerSubtitle')}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={themeColors.primary} />
          </TouchableOpacity>
        )}

        {/* Sign Out Button */}
        <TouchableOpacity
          onPress={handleSignOut}
          className="mt-2 flex-row items-center justify-center rounded-xl border border-destructive/20 bg-card p-4"
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('profile.signOut')}
        >
          <LogOut size={16} color={themeColors.destructive} className="mr-2" />
          <Text className="font-body-semibold text-sm text-destructive">
            {t('profile.signOut')}
          </Text>
        </TouchableOpacity>

        {/* App Version Footer */}
        <Text className="mt-6 text-center font-body text-xs text-muted-foreground">
          {t('profile.version', { version: appVersion })}
        </Text>
      </ScrollView>

      {/* Become Owner Confirmation Modal */}
      <Modal
        visible={showBecomeOwner}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBecomeOwner(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/60 px-5">
          <View className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-elevation-3">
            <View className="mb-4 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Building2 size={20} color={themeColors.primary} />
                <Text className="font-heading text-h3 text-foreground">
                  {t('profile.becomeOwnerConfirmTitle')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowBecomeOwner(false)}
                accessibilityLabel={t('common.close')}
              >
                <X size={20} color={themeColors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <View className="mb-4 rounded-lg bg-warning/10 p-3 gap-1.5">
              <View className="flex-row items-center gap-1.5">
                <AlertTriangle size={15} color={themeColors.warning} />
                <Text className="font-heading-semibold text-xs text-foreground">
                  {t('profile.becomeOwnerImportant')}
                </Text>
              </View>
              <Text className="font-body text-xs text-muted-foreground">
                • {t('profile.becomeOwnerOneWay')}
              </Text>
              <Text className="font-body text-xs text-muted-foreground">
                • {t('profile.becomeOwnerAppSwitch')}
              </Text>
              <Text className="font-body text-xs text-muted-foreground">
                • {t('profile.becomeOwnerRoommateHidden')}
              </Text>
              <Text className="font-body text-xs text-muted-foreground">
                • {t('profile.becomeOwnerActiveBookingsNotice')}
              </Text>
            </View>

            <View className="mb-4">
              <Text className="mb-1 font-body-medium text-xs text-foreground">
                {t('profile.businessNameLabel')}
              </Text>
              <TextInput
                value={businessName}
                onChangeText={(text) => {
                  setBusinessName(text);
                  if (becomeOwnerError) setBecomeOwnerError('');
                }}
                placeholder={t('profile.businessNamePlaceholder')}
                placeholderTextColor={themeColors.mutedForeground}
                maxLength={80}
                className="h-11 rounded-lg border border-border bg-background px-3 font-body text-sm text-foreground"
                autoCapitalize="words"
              />
            </View>

            {Boolean(becomeOwnerError) && (
              <Text className="mb-3 font-body text-xs text-destructive">
                {becomeOwnerError}
              </Text>
            )}

            <View className="flex-row gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onPress={() => setShowBecomeOwner(false)}
                disabled={becomeOwnerMutation.isPending}
              >
                {t('common.cancel')}
              </Button>
              <TouchableOpacity
                testID="become-owner-confirm"
                onPress={handleConfirmBecomeOwner}
                disabled={becomeOwnerMutation.isPending}
                className="flex-1 items-center justify-center rounded-md bg-primary py-3 active:opacity-90"
                accessibilityRole="button"
                accessibilityLabel={t('common.confirm')}
              >
                {becomeOwnerMutation.isPending ? (
                  <ActivityIndicator size="small" color={themeColors.primaryForeground} />
                ) : (
                  <Text className="font-heading-semibold text-center text-primary-foreground">
                    {t('common.confirm')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

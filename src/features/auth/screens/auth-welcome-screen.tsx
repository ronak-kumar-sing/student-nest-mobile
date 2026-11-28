import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Wrench, ArrowRight, Mail, Sparkles, GraduationCap, House } from 'lucide-react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { NavigationBar } from 'expo-navigation-bar';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { AvatarBubble } from '../components/avatar-bubble';
import { useSessionStore } from '@/stores/session';
import { useSendEmailOtp, useDemoConfig, useDemoSignIn } from '../queries';
import { getTransportMode } from '@/api/mode';
import { isApiError, ErrorCodes, getErrorMessage } from '@/api/errors';
import { mediumImpact } from '@/lib/haptics';
import { toast } from '@/components/ui/toast';
import { useTranslation } from 'react-i18next';
import { SHOW_DEV_MENU } from '@/lib/dev';

const AVATAR_1 = require('../../../../assets/avatars/avatar-1-download-free-avatar-illustrations.svg');
const AVATAR_2 = require('../../../../assets/avatars/avatar-10-download-free-avatar-illustrations.svg');
const AVATAR_3 = require('../../../../assets/avatars/avatar-3-download-free-avatar-illustrations.svg');

interface AuthWelcomeScreenProps {
  initialMode?: 'signin' | 'signup';
}

export function AuthWelcomeScreen({
  initialMode: _initialMode = 'signin',
}: AuthWelcomeScreenProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const { setUser, setRole, setOnboarded } = useSessionStore();
  const sendEmailOtpMutation = useSendEmailOtp();
  const { data: demoConfig } = useDemoConfig();
  const demoSignInMutation = useDemoSignIn();
  const [loadingPersona, setLoadingPersona] = useState<'student' | 'owner' | null>(null);

  const isMock = getTransportMode('auth') === 'mock';

  // Keyboard tracking shared values for smooth header collapse
  const clusterHeight = useSharedValue(180);
  const clusterOpacity = useSharedValue(1);
  const headingMargin = useSharedValue(20);

  // Gentle subtle floating motion
  const avatar1Y = useSharedValue(0);
  const avatar2Y = useSharedValue(0);
  const avatar3Y = useSharedValue(0);

  useEffect(() => {
    avatar1Y.set(
      withRepeat(
        withSequence(
          withTiming(-4, { duration: 2800, easing: Easing.inOut(Easing.quad) }),
          withTiming(4, { duration: 2800, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      ),
    );

    avatar2Y.set(
      withRepeat(
        withSequence(
          withTiming(4, { duration: 3200, easing: Easing.inOut(Easing.quad) }),
          withTiming(-4, { duration: 3200, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      ),
    );

    avatar3Y.set(
      withRepeat(
        withSequence(
          withTiming(-3, { duration: 2600, easing: Easing.inOut(Easing.quad) }),
          withTiming(3, { duration: 2600, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      ),
    );

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      clusterHeight.set(
        withTiming(0, {
          duration: 220,
          easing: Easing.out(Easing.quad),
        }),
      );
      clusterOpacity.set(withTiming(0, { duration: 180 }));
      headingMargin.set(withTiming(4, { duration: 220 }));
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      clusterHeight.set(withTiming(180, { duration: 240 }));
      clusterOpacity.set(withTiming(1, { duration: 240 }));
      headingMargin.set(withTiming(20, { duration: 240 }));
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleContinue = async () => {
    mediumImpact();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setEmailError('');

    try {
      await sendEmailOtpMutation.mutateAsync(cleanEmail);
      router.push({
        pathname: '/(auth)/otp',
        params: { email: cleanEmail },
      });
    } catch (err: unknown) {
      if (isApiError(err)) {
        if (err.code === ErrorCodes.VALIDATION_FAILED) {
          setEmailError(t(getErrorMessage(err.code)));
        } else if (err.code === ErrorCodes.RATE_LIMITED || err.code === ErrorCodes.NETWORK_ERROR) {
          toast.error(t(getErrorMessage(err.code)));
        } else {
          toast.error(t(getErrorMessage(err.code)));
        }
      } else {
        toast.error(t('common.error'));
      }
    }
  };

  const handleDemoLogin = (demoRole: 'student' | 'owner') => {
    mediumImpact();
    if (demoRole === 'student') {
      setUser({
        id: 'student-1',
        email: 'rahul.sharma@example.com',
        displayName: 'Rahul Sharma',
        avatarUrl:
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
        phone: '+919876543210',
        role: 'student',
      });
      setRole('student');
      setOnboarded(true);
      toast.success('Logged in as Rahul Sharma (Demo Student)');
      router.replace('/(student)/(tabs)/explore');
    } else {
      setUser({
        id: 'owner-1',
        email: 'amit.kumar@example.com',
        displayName: 'Amit Kumar',
        avatarUrl:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
        phone: '+919876543212',
        role: 'owner',
      });
      setRole('owner');
      setOnboarded(true);
      toast.success('Logged in as Amit Kumar (Demo Owner)');
      router.replace('/(owner)/(tabs)/dashboard');
    }
  };

  const handleHttpDemoSignIn = async (persona: 'student' | 'owner') => {
    mediumImpact();
    setLoadingPersona(persona);
    try {
      await demoSignInMutation.mutateAsync(persona);
      // Session sync and auth gate route by role automatically
    } catch (err: unknown) {
      if (isApiError(err)) {
        if (err.statusCode === 404 || err.code === ErrorCodes.NOT_FOUND) {
          toast.error(t('demo.errorOff'));
        } else {
          toast.error(t(getErrorMessage(err.code)));
        }
      } else {
        toast.error(t('common.error'));
      }
    } finally {
      setLoadingPersona(null);
    }
  };

  // Animated styles
  const animatedClusterStyle = useAnimatedStyle(() => ({
    height: clusterHeight.get(),
    opacity: clusterOpacity.get(),
    overflow: 'hidden',
  }));

  const animatedHeadingStyle = useAnimatedStyle(() => ({
    marginBottom: headingMargin.get(),
  }));

  const animatedAvatar1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: avatar1Y.get() }],
  }));

  const animatedAvatar2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: avatar2Y.get() }],
  }));

  const animatedAvatar3Style = useAnimatedStyle(() => ({
    transform: [{ translateY: avatar3Y.get() }],
  }));

  const isLoading = sendEmailOtpMutation.isPending;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />
      {Platform.OS === 'android' && <NavigationBar style="dark" />}

      {/* Ambient decorative pastel bubbles */}
      <View pointerEvents="none" style={styles.ambientContainer}>
        <View style={styles.bubbleTopLeft} />
        <View style={styles.bubbleTopRight} />
        <View style={styles.bubbleMidLeft} />
        <View style={styles.speckYellow} />
        <View style={styles.speckWhite} />
        <View style={styles.speckMint} />
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.contentWrapper}>
          {/* Header Row with Dev Menu shortcut */}
          <View style={styles.topBar}>
            <View />
            {SHOW_DEV_MENU && (
              <TouchableOpacity
                onPress={() => router.push('/dev')}
                style={styles.devButton}
                activeOpacity={0.7}
                accessibilityLabel="Open Dev Menu"
              >
                <Wrench size={13} color="rgba(255, 255, 255, 0.7)" />
                <Text style={styles.devButtonText}>Dev</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* KeyboardAwareScrollView */}
          <KeyboardAwareScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            bottomOffset={Platform.OS === 'ios' ? 80 : 50}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Top Section: Overlapping 3D Avatar Cluster */}
            <Animated.View style={[styles.clusterContainer, animatedClusterStyle]}>
              <Animated.View style={[styles.avatarLeft, animatedAvatar1Style]}>
                <AvatarBubble
                  source={AVATAR_1}
                  size={108}
                  backgroundColor="#FBCFE8"
                  borderColor="rgba(255, 255, 255, 0.45)"
                />
              </Animated.View>

              <Animated.View style={[styles.avatarRight, animatedAvatar2Style]}>
                <AvatarBubble
                  source={AVATAR_2}
                  size={92}
                  backgroundColor="#BAE6FD"
                  borderColor="rgba(255, 255, 255, 0.55)"
                />
              </Animated.View>

              <Animated.View style={[styles.avatarBottom, animatedAvatar3Style]}>
                <AvatarBubble
                  source={AVATAR_3}
                  size={92}
                  backgroundColor="#BBF7D0"
                  borderColor="rgba(255, 255, 255, 0.4)"
                />
              </Animated.View>

              <View style={styles.centerBadge}>
                <Text style={styles.centerBadgeText}>Nest</Text>
              </View>
            </Animated.View>

            {/* Bold Heading */}
            <Animated.View style={[styles.headingContainer, animatedHeadingStyle]}>
              <Text style={styles.headingText}>Sign in or create{'\n'}an account</Text>
              <Text style={styles.headingSubtitle}>Zero brokerage student housing marketplace</Text>
            </Animated.View>

            {/* Form Card */}
            <View style={styles.cardContainer}>
              <View style={styles.formContainer}>
                {/* Email Field */}
                <View
                  style={[
                    styles.inputBox,
                    isFocused && styles.inputBoxFocused,
                    Boolean(emailError) && styles.inputBoxError,
                  ]}
                >
                  <View style={styles.inputIconContainer}>
                    <Mail size={18} color={isFocused ? '#111827' : '#9CA3AF'} />
                  </View>
                  <TextInput
                    style={styles.inputField}
                    placeholder="Enter your email address"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (emailError) setEmailError('');
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    accessibilityLabel="Email address"
                  />
                </View>
                {Boolean(emailError) && <Text style={styles.errorText}>{emailError}</Text>}
              </View>

              {/* Terms Note */}
              <View style={styles.footerLinkContainer}>
                <TouchableOpacity onPress={() => router.push('/(auth)/terms')} activeOpacity={0.7}>
                  <Text style={styles.termsText}>
                    By continuing, you agree to our{' '}
                    <Text style={styles.termsHighlight}>Terms & Privacy Policy</Text>
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Continue Button */}
              <View style={styles.bottomButtonContainer}>
                <TouchableOpacity
                  onPress={handleContinue}
                  activeOpacity={0.84}
                  disabled={isLoading || !email.trim()}
                  style={[
                    styles.highlightSubmitButton,
                    (!email.trim() || isLoading) && styles.buttonDisabled,
                  ]}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#0D0E11" />
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>Continue with Email</Text>
                      <View style={styles.buttonIconCircle}>
                        <ArrowRight size={17} color="#0D0E11" strokeWidth={2.6} />
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Quick Demo Accounts Row (ONLY in Mock Mode) */}
              {isMock && (
                <View style={styles.demoSection}>
                  <View style={styles.demoHeaderRow}>
                    <Sparkles size={13} color="#059669" />
                    <Text style={styles.demoHeaderLabel}>QUICK DEMO LOGIN (MOCK MODE)</Text>
                  </View>
                  <View style={styles.demoButtonsRow}>
                    <TouchableOpacity
                      onPress={() => handleDemoLogin('student')}
                      style={styles.demoPill}
                      activeOpacity={0.8}
                    >
                      <GraduationCap size={18} color={DEMO_ICON_COLOR} accessibilityElementsHidden importantForAccessibility="no" />
                      <View style={styles.demoPillTextWrap}>
                        <Text style={styles.demoPillRole}>Student</Text>
                        <Text style={styles.demoPillName} numberOfLines={1}>
                          Rahul
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDemoLogin('owner')}
                      style={styles.demoPill}
                      activeOpacity={0.8}
                    >
                      <House size={18} color={DEMO_ICON_COLOR} accessibilityElementsHidden importantForAccessibility="no" />
                      <View style={styles.demoPillTextWrap}>
                        <Text style={styles.demoPillRole}>Owner</Text>
                        <Text style={styles.demoPillName} numberOfLines={1}>
                          Amit
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Demo Sign-in Row (HTTP Mode when demo enabled) */}
              {!isMock && Boolean(demoConfig?.enabled) && (
                <View style={styles.demoSection}>
                  <View style={styles.demoHeaderRow}>
                    <Sparkles size={13} color="#059669" />
                    <Text style={styles.demoHeaderLabel}>{t('demo.sectionTitle')}</Text>
                  </View>
                  <View style={styles.demoButtonsRow}>
                    {demoConfig?.personas?.includes('student') && (
                      <TouchableOpacity
                        onPress={() => handleHttpDemoSignIn('student')}
                        style={styles.demoPill}
                        activeOpacity={0.8}
                        disabled={demoSignInMutation.isPending}
                        accessibilityRole="button"
                        accessibilityLabel={t('demo.tryStudent')}
                      >
                        {loadingPersona === 'student' ? (
                          <ActivityIndicator size="small" color="#047857" style={{ marginHorizontal: 'auto' }} />
                        ) : (
                          <>
                            <GraduationCap size={18} color={DEMO_ICON_COLOR} accessibilityElementsHidden importantForAccessibility="no" />
                            <View style={styles.demoPillTextWrap}>
                              <Text style={styles.demoPillRole}>{t('demo.tryStudent')}</Text>
                              <Text style={styles.demoPillName} numberOfLines={1}>
                                {t('demo.studentRole')}
                              </Text>
                            </View>
                          </>
                        )}
                      </TouchableOpacity>
                    )}

                    {demoConfig?.personas?.includes('owner') && (
                      <TouchableOpacity
                        onPress={() => handleHttpDemoSignIn('owner')}
                        style={styles.demoPill}
                        activeOpacity={0.8}
                        disabled={demoSignInMutation.isPending}
                        accessibilityRole="button"
                        accessibilityLabel={t('demo.tryOwner')}
                      >
                        {loadingPersona === 'owner' ? (
                          <ActivityIndicator size="small" color="#047857" style={{ marginHorizontal: 'auto' }} />
                        ) : (
                          <>
                            <House size={18} color={DEMO_ICON_COLOR} accessibilityElementsHidden importantForAccessibility="no" />
                            <View style={styles.demoPillTextWrap}>
                              <Text style={styles.demoPillRole}>{t('demo.tryOwner')}</Text>
                              <Text style={styles.demoPillName} numberOfLines={1}>
                                {t('demo.ownerRole')}
                              </Text>
                            </View>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={[styles.termsText, { marginTop: 10, fontSize: 11 }]}>
                    {t('demo.disclaimer')}
                  </Text>
                </View>
              )}
            </View>
          </KeyboardAwareScrollView>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

/** Same green as the demo pill text (this screen has a fixed light card on a dark hero). */
const DEMO_ICON_COLOR = '#047857';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0D0E11',
  },
  contentWrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    zIndex: 20,
  },
  devButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  devButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginLeft: 5,
  },

  ambientContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  bubbleTopLeft: {
    position: 'absolute',
    top: -25,
    left: -25,
    width: 85,
    height: 85,
    borderRadius: 42.5,
    backgroundColor: 'rgba(244, 114, 182, 0.35)',
  },
  bubbleTopRight: {
    position: 'absolute',
    top: 35,
    right: -25,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(167, 243, 208, 0.4)',
  },
  bubbleMidLeft: {
    position: 'absolute',
    top: '32%',
    left: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(186, 230, 253, 0.45)',
  },
  speckYellow: {
    position: 'absolute',
    top: 75,
    right: 50,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FDE047',
    opacity: 0.85,
  },
  speckWhite: {
    position: 'absolute',
    top: 150,
    left: 40,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    opacity: 0.8,
  },
  speckMint: {
    position: 'absolute',
    top: '35%',
    right: 35,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: '#A7F3D0',
    opacity: 0.85,
  },

  clusterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    position: 'relative',
  },
  avatarLeft: {
    position: 'absolute',
    top: 6,
    left: '50%',
    marginLeft: -105,
    zIndex: 2,
  },
  avatarRight: {
    position: 'absolute',
    top: 16,
    right: '50%',
    marginRight: -100,
    zIndex: 1,
  },
  avatarBottom: {
    position: 'absolute',
    top: 74,
    left: '50%',
    marginLeft: -46,
    zIndex: 3,
  },
  centerBadge: {
    position: 'absolute',
    top: 48,
    left: '50%',
    marginLeft: -38,
    backgroundColor: 'rgba(38, 41, 48, 0.92)',
    borderColor: 'rgba(255, 255, 255, 0.28)',
    borderWidth: 1.2,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 5,
    zIndex: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  centerBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
  },

  headingContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  headingText: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 36,
    fontFamily: 'PlusJakartaSans_700Bold',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  headingSubtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 6,
  },

  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  formContainer: {
    marginBottom: 12,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    height: 54,
    paddingHorizontal: 14,
  },
  inputBoxFocused: {
    borderColor: '#10B981',
    backgroundColor: '#FFFFFF',
  },
  inputBoxError: {
    borderColor: '#EF4444',
  },
  inputIconContainer: {
    marginRight: 10,
  },
  inputField: {
    flex: 1,
    height: '100%',
    color: '#111827',
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginTop: 5,
    marginLeft: 4,
  },
  footerLinkContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  termsText: {
    color: '#6B7280',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  termsHighlight: {
    color: '#10B981',
    fontFamily: 'Inter_600SemiBold',
  },
  bottomButtonContainer: {
    marginTop: 4,
  },
  highlightSubmitButton: {
    backgroundColor: '#34D399',
    height: 54,
    borderRadius: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#34D399',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#0D0E11',
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  buttonIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(13, 14, 17, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoSection: {
    marginTop: 22,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  demoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 10,
  },
  demoHeaderLabel: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#059669',
    letterSpacing: 0.6,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  demoPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  demoPillTextWrap: {
    flex: 1,
  },
  demoPillRole: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: '#065F46',
  },
  demoPillName: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#047857',
  },
});

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
  LayoutChangeEvent,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Eye, EyeOff, ChevronDown, Wrench, ArrowRight, User, Phone as PhoneIcon, Lock, Sparkles } from 'lucide-react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { NavigationBar } from 'expo-navigation-bar';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { AvatarBubble } from '../components/avatar-bubble';
import { GoogleIcon, GithubIcon } from '@/components/common/social-icons';
import { useSessionStore } from '@/stores/session';
import { lightImpact, mediumImpact, selectionFeedback } from '@/lib/haptics';
import { toast } from '@/components/ui/toast';

const AVATAR_1 = require('../../../../assets/avatars/avatar-1-download-free-avatar-illustrations.svg');
const AVATAR_2 = require('../../../../assets/avatars/avatar-10-download-free-avatar-illustrations.svg');
const AVATAR_3 = require('../../../../assets/avatars/avatar-3-download-free-avatar-illustrations.svg');

interface AuthWelcomeScreenProps {
  initialMode?: 'signin' | 'signup';
}

export function AuthWelcomeScreen({ initialMode = 'signin' }: AuthWelcomeScreenProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [countryCode, setCountryCode] = useState<'+91' | '+1'>('+91');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<'name' | 'phone' | 'password' | null>(null);

  const { setUser, setRole, setOnboarded } = useSessionStore();

  const isSignIn = mode === 'signin';

  // Segmented control measurement and slider animation
  const [tabContainerWidth, setTabContainerWidth] = useState(0);
  const sliderTranslateX = useSharedValue(initialMode === 'signup' ? 150 : 0);

  // Keyboard tracking shared values for smooth header collapse
  const clusterHeight = useSharedValue(180);
  const clusterOpacity = useSharedValue(1);
  const headingMargin = useSharedValue(20);

  // Gentle subtle floating motion (calm 4px drift, no scale pulsing, no wobble)
  const avatar1Y = useSharedValue(0);
  const avatar2Y = useSharedValue(0);
  const avatar3Y = useSharedValue(0);

  useEffect(() => {
    // Gentle floating move animation (calm and subtle)
    avatar1Y.set(
      withRepeat(
        withSequence(
          withTiming(-4, { duration: 2800, easing: Easing.inOut(Easing.quad) }),
          withTiming(4, { duration: 2800, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      )
    );

    avatar2Y.set(
      withRepeat(
        withSequence(
          withTiming(4, { duration: 3200, easing: Easing.inOut(Easing.quad) }),
          withTiming(-4, { duration: 3200, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      )
    );

    avatar3Y.set(
      withRepeat(
        withSequence(
          withTiming(-3, { duration: 2600, easing: Easing.inOut(Easing.quad) }),
          withTiming(3, { duration: 2600, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      )
    );

    // Keyboard show / hide listeners to dynamically collapse the top section
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      clusterHeight.set(
        withTiming(0, {
          duration: 220,
          easing: Easing.out(Easing.quad),
        })
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

  const handleTabLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setTabContainerWidth(width);
    const tabWidth = (width - 8) / 2;
    sliderTranslateX.set(mode === 'signup' ? tabWidth : 0);
  };

  const selectMode = (newMode: 'signin' | 'signup') => {
    if (mode === newMode) return;
    selectionFeedback();
    setMode(newMode);
    if (tabContainerWidth > 0) {
      const tabWidth = (tabContainerWidth - 8) / 2;
      sliderTranslateX.set(
        withTiming(newMode === 'signup' ? tabWidth : 0, {
          duration: 180,
          easing: Easing.out(Easing.quad),
        })
      );
    }
  };

  const toggleCountryCode = () => {
    selectionFeedback();
    setCountryCode((prev) => (prev === '+91' ? '+1' : '+91'));
  };

  const handleSubmit = () => {
    mediumImpact();

    if (!phone.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    if (!password.trim()) {
      toast.error('Please enter your password');
      return;
    }

    if (!isSignIn && !fullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      // Authenticate user into session store
      setUser({
        id: isSignIn ? 'student-1' : `user-${Date.now()}`,
        email: isSignIn ? 'rohan.sharma@gmail.com' : 'new.student@gmail.com',
        displayName: isSignIn ? 'Rohan Sharma' : fullName.trim(),
        avatarUrl: null,
        phone: `${countryCode} ${phone.trim()}`,
        role: 'student',
      });
      setRole('student');
      setOnboarded(true);

      toast.success(isSignIn ? 'Welcome back!' : 'Account created successfully!');
      router.replace('/(student)/(tabs)/explore');
    }, 450);
  };

  const handleDemoLogin = (demoRole: 'student' | 'owner') => {
    mediumImpact();
    if (demoRole === 'student') {
      setPhone('9876543210');
      setPassword('password123');
      setUser({
        id: 'student-1',
        email: 'rahul.sharma@example.com',
        displayName: 'Rahul Sharma',
        avatarUrl:
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
        phone: '+91 98765 43210',
        role: 'student',
      });
      setRole('student');
      setOnboarded(true);
      toast.success('Logged in as Rahul Sharma (Demo Student)');
      router.replace('/(student)/(tabs)/explore');
    } else {
      setPhone('9876543212');
      setPassword('password123');
      setUser({
        id: 'owner-1',
        email: 'amit.kumar@example.com',
        displayName: 'Amit Kumar',
        avatarUrl:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
        phone: '+91 98765 43212',
        role: 'owner',
      });
      setRole('owner');
      setOnboarded(true);
      toast.success('Logged in as Amit Kumar (Demo Owner)');
      router.replace('/(owner)/(tabs)/dashboard');
    }
  };

  const handleGoogleAuth = () => {
    mediumImpact();
    setUser({
      id: 'google-user-1',
      email: 'aarav.sharma@gmail.com',
      displayName: 'Aarav Sharma',
      avatarUrl:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      phone: '+91 98112 23344',
      role: 'student',
    });
    setRole('student');
    setOnboarded(true);
    toast.success('Signed in with Google!');
    router.replace('/(student)/(tabs)/explore');
  };

  const handleGithubAuth = () => {
    lightImpact();
    toast.info('GitHub authentication coming soon!');
  };

  const handleForgotPassword = () => {
    lightImpact();
    router.push('/(auth)/email');
  };

  // Reanimated animated styles
  const animatedClusterStyle = useAnimatedStyle(() => ({
    height: clusterHeight.get(),
    opacity: clusterOpacity.get(),
    overflow: 'hidden',
  }));

  const animatedHeadingStyle = useAnimatedStyle(() => ({
    marginBottom: headingMargin.get(),
  }));

  const animatedSliderStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sliderTranslateX.get() }],
    width: tabContainerWidth > 0 ? (tabContainerWidth - 8) / 2 : '50%',
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
            <TouchableOpacity
              onPress={() => router.push('/dev')}
              style={styles.devButton}
              activeOpacity={0.7}
              accessibilityLabel="Open Dev Menu"
            >
              <Wrench size={13} color="rgba(255, 255, 255, 0.7)" />
              <Text style={styles.devButtonText}>Dev</Text>
            </TouchableOpacity>
          </View>

          {/* KeyboardAwareScrollView ensures the focused input is NEVER hidden under keyboard */}
          <KeyboardAwareScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            bottomOffset={Platform.OS === 'ios' ? 80 : 50}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Top Section: Overlapping 3D Avatar Cluster */}
            <Animated.View style={[styles.clusterContainer, animatedClusterStyle]}>
              {/* Top-Left Avatar */}
              <Animated.View style={[styles.avatarLeft, animatedAvatar1Style]}>
                <AvatarBubble
                  source={AVATAR_1}
                  size={108}
                  backgroundColor="#FBCFE8"
                  borderColor="rgba(255, 255, 255, 0.45)"
                />
              </Animated.View>

              {/* Top-Right Avatar */}
              <Animated.View style={[styles.avatarRight, animatedAvatar2Style]}>
                <AvatarBubble
                  source={AVATAR_2}
                  size={92}
                  backgroundColor="#BAE6FD"
                  borderColor="rgba(255, 255, 255, 0.55)"
                />
              </Animated.View>

              {/* Bottom-Center Avatar */}
              <Animated.View style={[styles.avatarBottom, animatedAvatar3Style]}>
                <AvatarBubble
                  source={AVATAR_3}
                  size={92}
                  backgroundColor="#BBF7D0"
                  borderColor="rgba(255, 255, 255, 0.4)"
                />
              </Animated.View>

              {/* Center Floating Frosted Pill Badge */}
              <View style={styles.centerBadge}>
                <Text style={styles.centerBadgeText}>Nest</Text>
              </View>
            </Animated.View>

            {/* Large Bold Heading */}
            <Animated.View style={[styles.headingContainer, animatedHeadingStyle]}>
              <Text style={styles.headingText}>
                {isSignIn ? "Let's get you\nsigned in!" : "Let's get you\nstarted!"}
              </Text>
            </Animated.View>

            {/* White Bottom Form Card */}
            <View style={styles.cardContainer}>
              {/* Segmented Control: Highlighted Log In & Sign Up Tab Bar */}
              <View onLayout={handleTabLayout} style={styles.segmentedContainer}>
                {/* Animated Highlight Pill Indicator */}
                <Animated.View style={[styles.segmentedHighlight, animatedSliderStyle]} />

                {/* Log In Tab Button */}
                <TouchableOpacity
                  onPress={() => selectMode('signin')}
                  style={styles.segmentedTab}
                  activeOpacity={0.8}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isSignIn }}
                >
                  <Text style={[styles.segmentedTabText, isSignIn && styles.segmentedTabTextActive]}>
                    Sign In
                  </Text>
                </TouchableOpacity>

                {/* Sign Up Tab Button */}
                <TouchableOpacity
                  onPress={() => selectMode('signup')}
                  style={styles.segmentedTab}
                  activeOpacity={0.8}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: !isSignIn }}
                >
                  <Text style={[styles.segmentedTabText, !isSignIn && styles.segmentedTabTextActive]}>
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Form Inputs Container */}
              <View style={styles.formContainer}>
                {/* Full Name field (Sign Up mode only) */}
                {!isSignIn && (
                  <Animated.View
                    entering={FadeIn.duration(150)}
                    exiting={FadeOut.duration(150)}
                    style={[
                      styles.inputBox,
                      focusedField === 'name' && styles.inputBoxFocused,
                    ]}
                  >
                    <View style={styles.inputIconContainer}>
                      <User size={18} color={focusedField === 'name' ? '#111827' : '#9CA3AF'} />
                    </View>
                    <TextInput
                      style={styles.inputField}
                      placeholder="Full Name"
                      placeholderTextColor="#9CA3AF"
                      value={fullName}
                      onChangeText={setFullName}
                      autoCapitalize="words"
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </Animated.View>
                )}

                {/* Phone Row: Country Code + Phone Number */}
                <View style={styles.phoneRow}>
                  {/* Country Code Pill */}
                  <TouchableOpacity
                    onPress={toggleCountryCode}
                    activeOpacity={0.8}
                    style={styles.countryPicker}
                  >
                    <Text style={styles.flagEmoji}>{countryCode === '+91' ? '🇮🇳' : '🇺🇸'}</Text>
                    <Text style={styles.countryCodeText}>{countryCode}</Text>
                    <ChevronDown size={14} color="#6B7280" />
                  </TouchableOpacity>

                  {/* Phone Input Field */}
                  <View
                    style={[
                      styles.inputBox,
                      styles.phoneInputBox,
                      focusedField === 'phone' && styles.inputBoxFocused,
                    ]}
                  >
                    <View style={styles.inputIconContainer}>
                      <PhoneIcon size={16} color={focusedField === 'phone' ? '#111827' : '#9CA3AF'} />
                    </View>
                    <TextInput
                      style={styles.inputField}
                      placeholder="Phone number"
                      placeholderTextColor="#9CA3AF"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>

                {/* Password Field */}
                <View
                  style={[
                    styles.inputBox,
                    styles.passwordBox,
                    focusedField === 'password' && styles.inputBoxFocused,
                  ]}
                >
                  <View style={styles.inputIconContainer}>
                    <Lock size={17} color={focusedField === 'password' ? '#111827' : '#9CA3AF'} />
                  </View>
                  <TextInput
                    style={[styles.inputField, { flex: 1 }]}
                    placeholder={isSignIn ? 'Password' : 'Create Password'}
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword((prev) => !prev)}
                    style={styles.eyeButton}
                    activeOpacity={0.7}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color="#6B7280" />
                    ) : (
                      <Eye size={18} color="#6B7280" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot Password / Terms Note */}
              <View style={styles.footerLinkContainer}>
                {isSignIn ? (
                  <TouchableOpacity onPress={handleForgotPassword} activeOpacity={0.7}>
                    <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.termsText}>
                    By continuing, you agree to our Terms & Privacy Policy
                  </Text>
                )}
              </View>

              {/* Primary Highlighted Action Button */}
              <View style={styles.bottomButtonContainer}>
                <TouchableOpacity
                  onPress={handleSubmit}
                  activeOpacity={0.84}
                  disabled={isLoading}
                  style={styles.highlightSubmitButton}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>
                        {isSignIn ? 'Sign In' : 'Create Account'}
                      </Text>
                      <View style={styles.buttonIconCircle}>
                        <ArrowRight size={17} color="#FFFFFF" strokeWidth={2.4} />
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Quick Demo Accounts Row (Sign In mode) */}
              {isSignIn && (
                <View style={styles.demoSection}>
                  <View style={styles.demoHeaderRow}>
                    <Sparkles size={13} color="#059669" />
                    <Text style={styles.demoHeaderLabel}>QUICK DEMO LOGIN</Text>
                  </View>
                  <View style={styles.demoButtonsRow}>
                    <TouchableOpacity
                      onPress={() => handleDemoLogin('student')}
                      style={styles.demoPill}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.demoPillEmoji}>🎓</Text>
                      <View style={styles.demoPillTextWrap}>
                        <Text style={styles.demoPillRole}>Student</Text>
                        <Text style={styles.demoPillName} numberOfLines={1}>Rahul</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDemoLogin('owner')}
                      style={styles.demoPill}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.demoPillEmoji}>🏡</Text>
                      <View style={styles.demoPillTextWrap}>
                        <Text style={styles.demoPillRole}>Owner</Text>
                        <Text style={styles.demoPillName} numberOfLines={1}>Amit</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Social Login Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Login Buttons: Google & GitHub */}
              <View style={styles.socialButtonsRow}>
                {/* Google Button */}
                <TouchableOpacity
                  onPress={handleGoogleAuth}
                  style={styles.socialButton}
                  activeOpacity={0.8}
                >
                  <GoogleIcon size={18} />
                  <Text style={styles.socialButtonText}>Google</Text>
                </TouchableOpacity>

                {/* GitHub Button with Coming Soon badge */}
                <TouchableOpacity
                  onPress={handleGithubAuth}
                  style={[styles.socialButton, styles.socialButtonGithub]}
                  activeOpacity={0.8}
                >
                  <GithubIcon size={18} color="#4B5563" />
                  <Text style={[styles.socialButtonText, { color: '#4B5563' }]}>GitHub</Text>
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonBadgeText}>Coming soon</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAwareScrollView>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

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

  /* Ambient floating pastel circles */
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

  /* Avatar Cluster */
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

  /* Heading */
  headingContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  headingText: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 38,
    fontFamily: 'PlusJakartaSans_700Bold',
    textAlign: 'center',
    letterSpacing: -0.5,
  },

  /* White Card Container */
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 38,
    borderTopRightRadius: 38,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 10,
  },

  /* Highlighted Segmented Tab Switcher (Log In / Sign Up) */
  segmentedContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    height: 48,
    flexDirection: 'row',
    padding: 4,
    position: 'relative',
    marginBottom: 20,
  },
  segmentedHighlight: {
    position: 'absolute',
    top: 4,
    left: 4,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  segmentedTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  segmentedTabText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter_500Medium',
  },
  segmentedTabTextActive: {
    color: '#111827',
    fontFamily: 'PlusJakartaSans_700Bold',
  },

  /* Form */
  formContainer: {
    gap: 12,
  },
  inputBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    height: 54,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  inputBoxFocused: {
    borderColor: '#111827',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIconContainer: {
    marginRight: 10,
  },
  inputField: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    fontFamily: 'Inter_500Medium',
    padding: 0,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 10,
  },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    height: 54,
    paddingHorizontal: 14,
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  flagEmoji: {
    fontSize: 18,
  },
  countryCodeText: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Inter_600SemiBold',
  },
  phoneInputBox: {
    flex: 1,
  },
  passwordBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeButton: {
    padding: 6,
    marginLeft: 6,
  },

  /* Links */
  footerLinkContainer: {
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 16,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: '#1F2937',
    fontFamily: 'Inter_600SemiBold',
  },
  termsText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },

  /* Highlighted Submit Button */
  bottomButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightSubmitButton: {
    backgroundColor: '#111827',
    width: '100%',
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: -0.2,
  },
  buttonIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Quick Demo Accounts */
  demoSection: {
    backgroundColor: '#F0FDF4',
    borderRadius: 18,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  demoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  demoHeaderLabel: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#065F46',
    letterSpacing: 0.5,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demoPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 9,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  demoPillEmoji: {
    fontSize: 17,
  },
  demoPillTextWrap: {
    flex: 1,
  },
  demoPillRole: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#111827',
  },
  demoPillName: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: '#6B7280',
  },

  /* Social Login Divider */
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Inter_500Medium',
  },

  /* Social Auth Buttons */
  socialButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  socialButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  socialButtonText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#111827',
  },
  socialButtonGithub: {
    backgroundColor: '#F9FAFB',
  },
  comingSoonBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  comingSoonBadgeText: {
    fontSize: 8.5,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#4B5563',
    letterSpacing: 0.2,
  },
});

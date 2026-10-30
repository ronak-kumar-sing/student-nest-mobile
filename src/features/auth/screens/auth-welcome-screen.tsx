import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Eye, EyeOff, ChevronDown, Wrench } from 'lucide-react-native';
import { AvatarBubble } from '../components/avatar-bubble';
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

  const { setUser, setRole, setOnboarded } = useSessionStore();

  const isSignIn = mode === 'signin';

  const toggleMode = () => {
    selectionFeedback();
    setMode((prev) => (prev === 'signin' ? 'signup' : 'signin'));
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
    }, 400);
  };

  const handleForgotPassword = () => {
    lightImpact();
    router.push('/(auth)/email');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Ambient decorative pastel bubbles */}
      <View pointerEvents="none" style={styles.ambientContainer}>
        {/* Top left pink/lavender bubble */}
        <View style={styles.bubbleTopLeft} />
        {/* Top right mint bubble */}
        <View style={styles.bubbleTopRight} />
        {/* Mid left sky blue bubble */}
        <View style={styles.bubbleMidLeft} />
        {/* Small floating accent specks */}
        <View style={styles.speckYellow} />
        <View style={styles.speckWhite} />
        <View style={styles.speckMint} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Row with Dev Menu shortcut */}
          <View style={styles.topBar}>
            <View />
            <TouchableOpacity
              onPress={() => router.push('/dev')}
              style={styles.devButton}
              accessibilityLabel="Open Dev Menu"
            >
              <Wrench size={13} color="rgba(255, 255, 255, 0.7)" />
              <Text style={styles.devButtonText}>Dev</Text>
            </TouchableOpacity>
          </View>

          {/* Top Section: Overlapping 3D Avatar Cluster */}
          <View style={styles.clusterContainer}>
            {/* Top-Left Avatar (Pink background) */}
            <AvatarBubble
              source={AVATAR_1}
              size={110}
              backgroundColor="#FBCFE8"
              style={styles.avatarLeft}
            />

            {/* Top-Right Avatar (Cyan/Ice-Blue background with glowing ring) */}
            <AvatarBubble
              source={AVATAR_2}
              size={94}
              backgroundColor="#BAE6FD"
              borderColor="rgba(255, 255, 255, 0.45)"
              style={styles.avatarRight}
            />

            {/* Bottom-Center Avatar (Lime/Mint background) */}
            <AvatarBubble
              source={AVATAR_3}
              size={94}
              backgroundColor="#BBF7D0"
              borderColor="rgba(255, 255, 255, 0.35)"
              style={styles.avatarBottom}
            />

            {/* Center Floating Frosted Pill Badge */}
            <View style={styles.centerBadge}>
              <Text style={styles.centerBadgeText}>Nest</Text>
            </View>
          </View>

          {/* Large Bold Heading */}
          <View style={styles.headingContainer}>
            <Text style={styles.headingText}>
              {isSignIn ? "Let's get you\nsigned in!" : "Let's get you\nstarted!"}
            </Text>
          </View>

          {/* White Bottom Form Card */}
          <View style={styles.cardContainer}>
            {/* Subtitle & Switch Mode Link */}
            <View style={styles.cardHeader}>
              <Text style={styles.cardSubtitle}>
                {isSignIn ? "You don't have an account yet?" : 'Already have an account?'}
              </Text>
              <TouchableOpacity onPress={toggleMode} activeOpacity={0.7} style={styles.toggleLink}>
                <Text style={styles.toggleLinkText}>{isSignIn ? 'Sign Up' : 'Sign In'}</Text>
              </TouchableOpacity>
            </View>

            {/* Form Inputs */}
            <View style={styles.formContainer}>
              {/* Full Name field (Sign Up mode only) */}
              {!isSignIn && (
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.inputField}
                    placeholder="Full Name"
                    placeholderTextColor="#9CA3AF"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>
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
                <View style={[styles.inputBox, styles.phoneInputBox]}>
                  <TextInput
                    style={styles.inputField}
                    placeholder="--- --- ----"
                    placeholderTextColor="#9CA3AF"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Password Field */}
              <View style={[styles.inputBox, styles.passwordBox]}>
                <TextInput
                  style={[styles.inputField, { flex: 1 }]}
                  placeholder={isSignIn ? 'Password' : 'Create Password'}
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
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

            {/* Bottom Docked Signature Button */}
            <View style={styles.bottomButtonContainer}>
              <TouchableOpacity
                onPress={handleSubmit}
                activeOpacity={0.85}
                disabled={isLoading}
                style={styles.submitButton}
              >
                <Text style={styles.submitButtonText}>
                  {isLoading ? 'Please wait...' : isSignIn ? 'Sign In' : 'Sign Up'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0D0E11',
  },
  keyboardContainer: {
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(244, 114, 182, 0.45)',
  },
  bubbleTopRight: {
    position: 'absolute',
    top: 35,
    right: -25,
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: 'rgba(167, 243, 208, 0.5)',
  },
  bubbleMidLeft: {
    position: 'absolute',
    top: '32%',
    left: -30,
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: 'rgba(186, 230, 253, 0.55)',
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
    height: 180,
    marginTop: 10,
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
    marginLeft: -47,
    zIndex: 3,
  },
  centerBadge: {
    position: 'absolute',
    top: 48,
    left: '50%',
    marginLeft: -38,
    backgroundColor: 'rgba(38, 41, 48, 0.88)',
    borderColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 5,
    zIndex: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  centerBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
  },

  /* Heading */
  headingContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  headingText: {
    color: '#FFFFFF',
    fontSize: 32,
    lineHeight: 40,
    fontFamily: 'PlusJakartaSans_700Bold',
    textAlign: 'center',
    letterSpacing: -0.5,
  },

  /* White Card Container */
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  toggleLink: {
    marginTop: 3,
  },
  toggleLinkText: {
    fontSize: 15,
    color: '#111827',
    fontFamily: 'PlusJakartaSans_700Bold',
    textAlign: 'center',
  },

  /* Form */
  formContainer: {
    gap: 12,
  },
  inputBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    height: 52,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  inputField: {
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
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    height: 52,
    paddingHorizontal: 14,
    gap: 6,
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

  /* Bottom Docked Button */
  bottomButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  submitButton: {
    backgroundColor: '#000000',
    width: '100%',
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
});

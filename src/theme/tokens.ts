/**
 * Design tokens for programmatic use outside of className / NativeWind.
 *
 * These values mirror the CSS custom properties in `global.css` and
 * the Tailwind config in `tailwind.config.js`. Use these when you need
 * tokens in JavaScript (e.g. for Reanimated shared values, Skia paints,
 * or third-party libraries that don't accept className).
 *
 * For component styling, prefer NativeWind className props.
 */

// ─── Colors (Light theme) ───────────────────────────────────────────

export const colors = {
  primary: '#0F766E', // deep teal
  primaryForeground: '#FFFFFF',

  secondary: '#F1F5F9', // slate-100
  secondaryForeground: '#0F172A', // slate-900

  background: '#FFFFFF',
  foreground: '#0F172A',

  card: '#FFFFFF',
  cardForeground: '#0F172A',

  popover: '#FFFFFF',
  popoverForeground: '#0F172A',

  muted: '#F1F5F9',
  mutedForeground: '#64748B', // slate-500

  accent: '#F1F5F9',
  accentForeground: '#0F172A',

  destructive: '#EF4444', // red-500
  destructiveForeground: '#FFFFFF',

  success: '#16A34A', // green-600
  successForeground: '#FFFFFF',

  warning: '#F59E0B', // amber-500
  warningForeground: '#FFFFFF',

  info: '#0284C7', // sky-600
  infoForeground: '#FFFFFF',

  border: '#E2E8F0', // slate-200
  input: '#E2E8F0',
  ring: '#0F766E',

  status: {
    pending: '#F59E0B',
    approved: '#16A34A',
    rejected: '#EF4444',
    published: '#16A34A',
    draft: '#64748B',
    submitted: '#0284C7',
    confirmed: '#16A34A',
    cancelled: '#EF4444',
  },
} as const;

// ─── Dark Colors ────────────────────────────────────────────────────

export const darkColors = {
  primary: '#14B8A6', // teal-500
  primaryForeground: '#FFFFFF',

  secondary: '#1E293B', // slate-800
  secondaryForeground: '#F8FAFC', // slate-50

  background: '#0B0F17',
  foreground: '#F8FAFC',

  card: '#111827',
  cardForeground: '#F8FAFC',

  popover: '#111827',
  popoverForeground: '#F8FAFC',

  muted: '#1E293B',
  mutedForeground: '#94A3B8', // slate-400

  accent: '#1E293B',
  accentForeground: '#F8FAFC',

  destructive: '#DC2626',
  destructiveForeground: '#FFFFFF',

  success: '#15803D',
  successForeground: '#FFFFFF',

  warning: '#D97706',
  warningForeground: '#FFFFFF',

  info: '#0369A1',
  infoForeground: '#FFFFFF',

  border: '#1E293B',
  input: '#1E293B',
  ring: '#14B8A6',

  status: {
    pending: '#D97706',
    approved: '#15803D',
    rejected: '#DC2626',
    published: '#15803D',
    draft: '#94A3B8',
    submitted: '#0369A1',
    confirmed: '#15803D',
    cancelled: '#DC2626',
  },
} as const;

// ─── Typography ─────────────────────────────────────────────────────

export const typography = {
  fonts: {
    heading: 'PlusJakartaSans_700Bold',
    headingSemibold: 'PlusJakartaSans_600SemiBold',
    body: 'Inter_400Regular',
    bodyMedium: 'Inter_500Medium',
    bodySemibold: 'Inter_600SemiBold',
  },
  sizes: {
    display: { fontSize: 32, lineHeight: 40, letterSpacing: -0.64 },
    h1: { fontSize: 26, lineHeight: 32, letterSpacing: -0.26 },
    h2: { fontSize: 22, lineHeight: 28, letterSpacing: 0 },
    h3: { fontSize: 18, lineHeight: 24, letterSpacing: 0 },
    body: { fontSize: 16, lineHeight: 24, letterSpacing: 0 },
    sm: { fontSize: 14, lineHeight: 20, letterSpacing: 0 },
    xs: { fontSize: 12, lineHeight: 16, letterSpacing: 0 },
  },
  /** Maximum font size multiplier for a11y scaling */
  maxFontSizeMultiplier: 1.3,
} as const;

// ─── Spacing ────────────────────────────────────────────────────────

export const spacing = {
  /** 4px grid base */
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  13: 52,
  14: 56,
  15: 60,
  16: 64,
  18: 72,
  20: 80,
} as const;

// ─── Border Radius ──────────────────────────────────────────────────

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// ─── Shadows (iOS) ──────────────────────────────────────────────────

export const shadows = {
  elevation1: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  elevation2: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  elevation3: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 3,
  },
} as const;

// ─── Animation ──────────────────────────────────────────────────────

export const motion = {
  /** Standard ease-out for most transitions */
  duration: {
    fast: 150,
    normal: 200,
    slow: 250,
  },
  /** Spring config for bottom sheets and modals */
  spring: {
    damping: 20,
    stiffness: 300,
    mass: 0.5,
  },
} as const;

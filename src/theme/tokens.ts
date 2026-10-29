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
  primary: 'hsl(175, 84%, 32%)',
  primaryForeground: 'hsl(0, 0%, 100%)',

  secondary: 'hsl(210, 40%, 96%)',
  secondaryForeground: 'hsl(222, 47%, 11%)',

  background: 'hsl(0, 0%, 100%)',
  foreground: 'hsl(222, 47%, 11%)',

  card: 'hsl(0, 0%, 100%)',
  cardForeground: 'hsl(222, 47%, 11%)',

  popover: 'hsl(0, 0%, 100%)',
  popoverForeground: 'hsl(222, 47%, 11%)',

  muted: 'hsl(210, 40%, 96%)',
  mutedForeground: 'hsl(215, 16%, 47%)',

  accent: 'hsl(210, 40%, 96%)',
  accentForeground: 'hsl(222, 47%, 11%)',

  destructive: 'hsl(0, 84%, 60%)',
  destructiveForeground: 'hsl(0, 0%, 100%)',

  success: 'hsl(142, 71%, 45%)',
  successForeground: 'hsl(0, 0%, 100%)',

  warning: 'hsl(38, 92%, 50%)',
  warningForeground: 'hsl(0, 0%, 100%)',

  info: 'hsl(199, 89%, 48%)',
  infoForeground: 'hsl(0, 0%, 100%)',

  border: 'hsl(214, 32%, 91%)',
  input: 'hsl(214, 32%, 91%)',
  ring: 'hsl(175, 84%, 32%)',

  status: {
    pending: 'hsl(38, 92%, 50%)',
    approved: 'hsl(142, 71%, 45%)',
    rejected: 'hsl(0, 84%, 60%)',
    published: 'hsl(142, 71%, 45%)',
    draft: 'hsl(215, 16%, 47%)',
    submitted: 'hsl(199, 89%, 48%)',
    confirmed: 'hsl(142, 71%, 45%)',
    cancelled: 'hsl(0, 84%, 60%)',
  },
} as const;

// ─── Dark Colors ────────────────────────────────────────────────────

export const darkColors = {
  primary: 'hsl(175, 84%, 40%)',
  primaryForeground: 'hsl(0, 0%, 100%)',

  secondary: 'hsl(217, 33%, 17%)',
  secondaryForeground: 'hsl(210, 40%, 98%)',

  background: 'hsl(222, 47%, 5%)',
  foreground: 'hsl(210, 40%, 98%)',

  card: 'hsl(222, 47%, 8%)',
  cardForeground: 'hsl(210, 40%, 98%)',

  popover: 'hsl(222, 47%, 8%)',
  popoverForeground: 'hsl(210, 40%, 98%)',

  muted: 'hsl(217, 33%, 17%)',
  mutedForeground: 'hsl(215, 20%, 65%)',

  accent: 'hsl(217, 33%, 17%)',
  accentForeground: 'hsl(210, 40%, 98%)',

  destructive: 'hsl(0, 63%, 50%)',
  destructiveForeground: 'hsl(0, 0%, 100%)',

  success: 'hsl(142, 71%, 40%)',
  successForeground: 'hsl(0, 0%, 100%)',

  warning: 'hsl(38, 92%, 45%)',
  warningForeground: 'hsl(0, 0%, 100%)',

  info: 'hsl(199, 89%, 42%)',
  infoForeground: 'hsl(0, 0%, 100%)',

  border: 'hsl(217, 33%, 20%)',
  input: 'hsl(217, 33%, 20%)',
  ring: 'hsl(175, 84%, 40%)',

  status: {
    pending: 'hsl(38, 92%, 45%)',
    approved: 'hsl(142, 71%, 40%)',
    rejected: 'hsl(0, 63%, 50%)',
    published: 'hsl(142, 71%, 40%)',
    draft: 'hsl(215, 20%, 55%)',
    submitted: 'hsl(199, 89%, 42%)',
    confirmed: 'hsl(142, 71%, 40%)',
    cancelled: 'hsl(0, 63%, 50%)',
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

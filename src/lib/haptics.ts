/**
 * Haptic feedback utilities.
 *
 * Wraps `expo-haptics` with a reduced-motion check.
 * When the user has enabled "Reduce Motion" in system settings,
 * all haptic triggers are silently skipped.
 */

import * as Haptics from 'expo-haptics';

/**
 * Check whether haptics should fire.
 * Returns `true` when reduced motion is NOT active.
 *
 * Note: `ReduceMotion` from reanimated gives us a system-wide check.
 * We read the shared value synchronously through the `ReduceMotion` enum.
 */
let _reduceMotion = false;

/**
 * Call once at app startup (e.g. in the root layout) to sync the
 * reduced-motion preference. After that, haptic helpers respect it.
 */
export function setReducedMotion(value: boolean): void {
  _reduceMotion = value;
}

function shouldFire(): boolean {
  return !_reduceMotion;
}

// ─── Impact Feedback ────────────────────────────────────────────────

/** Light tap — selection changes, toggles */
export async function lightImpact(): Promise<void> {
  if (shouldFire()) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

/** Medium tap — button presses, card interactions */
export async function mediumImpact(): Promise<void> {
  if (shouldFire()) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
}

/** Heavy tap — destructive actions, significant state changes */
export async function heavyImpact(): Promise<void> {
  if (shouldFire()) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }
}

// ─── Notification Feedback ──────────────────────────────────────────

/** Success pattern — booking confirmed, profile saved */
export async function successNotification(): Promise<void> {
  if (shouldFire()) {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}

/** Error pattern — validation failure, network error */
export async function errorNotification(): Promise<void> {
  if (shouldFire()) {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
}

/** Warning pattern — destructive confirmation, account warning */
export async function warningNotification(): Promise<void> {
  if (shouldFire()) {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }
}

// ─── Selection Feedback ─────────────────────────────────────────────

/** Selection tick — picker changes, slider steps */
export async function selectionFeedback(): Promise<void> {
  if (shouldFire()) {
    await Haptics.selectionAsync();
  }
}

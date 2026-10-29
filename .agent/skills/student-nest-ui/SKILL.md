---
name: student-nest-ui
description: Design tokens, component inventory, and rules for loading/empty/error states, accessibility, haptics, and motion in the Student Nest app.
---

# Student Nest UI

## Design personality

Friendly, trustworthy, calm. Housing is a high-stakes decision for students. Use generous whitespace, clear prices, and visible trust signals ("Verified owner" badge, "Lived here" on reviews).

## Tokens

Defined as CSS variables in `src/global.css` (light and dark themes), mapped in `tailwind.config.js`.

### Semantic color tokens

| Token | Purpose |
| --- | --- |
| `background` | Page background |
| `foreground` | Primary text |
| `card` | Card background |
| `muted` | Subtle backgrounds |
| `muted-foreground` | Secondary text |
| `border` | Borders and dividers |
| `input` | Input field borders |
| `ring` | Focus rings |
| `primary` | Brand color (deep teal) |
| `primary-foreground` | Text on primary |
| `secondary` | Secondary actions |
| `accent` | Accent highlights |
| `success` | Positive states (approved, verified) |
| `warning` | Caution states (pending review) |
| `destructive` | Danger (reject, delete, cancel) |
| `info` | Informational |

Status colors for booking, tour, and listing states are derived from these.

**Rule: Never hard-code hex values in components.** Always use token classes.

### Typography

| Scale | Size | Font | Weight |
| --- | --- | --- | --- |
| `display` | 32 | Plus Jakarta Sans | 700 |
| `h1` | 26 | Plus Jakarta Sans | 700 |
| `h2` | 22 | Plus Jakarta Sans | 600 |
| `h3` | 18 | Plus Jakarta Sans | 600 |
| `body` | 16 | Inter | 400 |
| `body-medium` | 16 | Inter | 500 |
| `body-semibold` | 16 | Inter | 600 |
| `sm` | 14 | Inter | 400 |
| `xs` | 12 | Inter | 400 |

- Respect OS font scaling up to 1.3× (`maxFontSizeMultiplier`). Test layouts at 1.3× to make sure nothing breaks.

### Spacing and shape

- **Grid:** 4-pt increments.
- **Border radius:** `md` = 12, `lg` = 16, `xl` = 24.
- **Shadows:** Soft, elevation 1–3 only. No harsh drop shadows.

## UI kit components (src/components/ui/)

Built on React Native Reusables (shadcn/ui-style, NativeWind-based). We own the code — restyle to our tokens.

| Component | File | Notes |
| --- | --- | --- |
| Button | `button.tsx` | Variants: default, secondary, destructive, outline, ghost. Sizes: sm, default, lg. Loading state with spinner. |
| Input | `input.tsx` | With label, error message, helper text. Uses `react-native-keyboard-controller`. |
| Card | `card.tsx` | Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter. |
| Badge | `badge.tsx` | Variants: default, secondary, destructive, outline, success, warning. |
| Avatar | `avatar.tsx` | Image with fallback initials. |
| Skeleton | `skeleton.tsx` | Animated shimmer matching content layout. |
| Sheet | `sheet.tsx` | Wraps `@gorhom/bottom-sheet`. Snap points. |
| Tabs | `tabs.tsx` | Segmented control style. |
| Chip | `chip.tsx` | Selectable filter chips. |
| Toast | `toast.tsx` | Wraps `sonner-native`. Success, error, info variants. |

## Common components (src/components/common/)

| Component | File | Notes |
| --- | --- | --- |
| EmptyState | `empty-state.tsx` | Illustration/Lottie + title + description + primary action button. |
| ErrorState | `error-state.tsx` | Error message (from `error.code` mapping) + retry button. |
| OfflineBanner | `offline-banner.tsx` | Animated banner shown when offline (`@react-native-community/netinfo`). |
| PriceTag | `price-tag.tsx` | `formatINR(paise)` display with optional period label. |
| StatusPill | `status-pill.tsx` | Colored badge for booking/tour/listing status. |
| RoomCard | `room-card.tsx` | Cover image, price, type, locality, distance, rating, heart button. (M2) |

## UX states — every screen must handle ALL of these

### 1. Loading
- Use **skeletons** that match the final layout.
- No spinners on first load (spinners only for mutations/actions).
- Skeleton components mirror the real layout for zero layout shift.

### 2. Empty
- Show an illustration or Lottie animation.
- One sentence explaining the empty state.
- One primary action button (e.g., "Start exploring", "Clear filters").

### 3. Error
- Map `error.code` to a user-friendly i18n message.
- Show a retry button.
- **Mutation errors:** toast notification.
- **Query errors:** inline error state.
- **Form field errors:** inline below the field, from `details[].field`.

### 4. Offline
- Show cached data with a "You're offline" banner.
- Mutations are disabled with explanation.
- Use `@react-native-community/netinfo` + TanStack Query `onlineManager`.

### 5. Optimistic updates
- Favorites: immediate heart toggle, rollback on error.
- Chat send: message appears immediately, error indicator on failure.
- Mark-read: immediate badge clear.

### 6. Pull-to-refresh
- Every list supports pull-to-refresh.
- Refetch on screen focus (`useRefreshOnFocus` hook).

## Motion guidelines

- **Duration:** 150–250 ms ease-out for UI transitions.
- **Springs** for sheets and drag interactions.
- **List items:** `entering={FadeInDown.springify()}` on the **first page only** (not on subsequent loads).
- **Favorite heart:** pop animation + `Haptics.impactAsync(Light)`.
- **Booking approval:** success Lottie + `Haptics.notificationAsync(Success)`.
- **Reduced motion:** check `useReducedMotion()`. When on:
  - No layout animations
  - No autoplaying Lottie
  - Keep functionality intact

## Accessibility

- **Touch targets:** ≥ 44×44 pt.
- **Labels:** `accessibilityLabel` and `accessibilityRole` on every interactive element.
- **Contrast:** ≥ 4.5:1 for text.
- **Screen reader:** announce async results (success/error).
- **Color:** Never rely on color alone for status — always pair with a label and/or icon.

## Dark mode

- Supported from day 1 via `useColorScheme()` + NativeWind `dark:` classes.
- All tokens defined for both light and dark in `global.css`.
- Test every screen in both modes.

## Images

- Always use `expo-image`.
- `cachePolicy="memory-disk"`.
- `placeholder` with blurhash.
- `transition={200}`.
- Request `_400w` thumbnails in lists, `_1200w` in detail views.
- Never load full-size images in lists.

## Lists

- Always use `@shopify/flash-list` for lists > ~10 items.
- Stable `keyExtractor`.
- Lightweight `renderItem` — no inline anonymous heavy components.
- `estimatedItemSize` set per list.


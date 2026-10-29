---
name: student-nest-feature
description: Per-feature checklist to follow when building any feature in the Student Nest app. Covers spec reading, types, mocks, queries, screens, tests, and status updates.
---

# Student Nest Feature Checklist

Follow this checklist for **every** feature you build. Do not skip steps.

## Before you start

- [ ] Read the backend spec in `docs/features/<##>-<feature>.md`.
- [ ] Read `docs/features/README.md` for shared conventions.
- [ ] Check `docs/mobile-plan.md` for the feature's current status and any contract questions.

## Step 1: Types and schemas

- [ ] Create or update `src/features/<feature>/types.ts`:
  - TypeScript interfaces matching the spec's Data section exactly.
  - All enums as union types.
  - Money fields as `number` (paise), never string or float.
  - Timestamps as `string` (ISO 8601).
- [ ] Create or update `src/features/<feature>/schemas.ts`:
  - Zod schemas for form inputs.
  - Mirror backend DTO constraints: min/max lengths, patterns, enums.
  - Used by `react-hook-form` via `@hookform/resolvers`.

## Step 2: Mock handlers

- [ ] Add fixtures in `src/api/mock/fixtures/<feature>.ts`:
  - Use `faker.seed(42)` for deterministic data.
  - Cover every status/state the feature supports.
  - Use realistic Indian data (localities, colleges, prices in paise).
- [ ] Register fixtures in `src/api/mock/db.ts`.
- [ ] Create handlers in `src/api/mock/handlers/<feature>.ts`:
  - Match the spec's endpoints, request shapes, response shapes.
  - Implement status codes and error codes from the spec.
  - Implement state machines with transition validation.
  - Use `simulateLatency()` and `shouldInjectError()`.

## Step 3: API layer and queries

- [ ] Create `src/features/<feature>/api.ts`:
  - One function per endpoint.
  - Transport switching via `getTransportMode('<feature>')`.
  - Both mock and http paths implemented (http can be a stub initially).
- [ ] Create `src/features/<feature>/queries.ts`:
  - Query key factory:
    ```typescript
    export const <feature>Keys = {
      all: ['<feature>'] as const,
      lists: () => [...<feature>Keys.all, 'list'] as const,
      list: (filters: Filters) => [...<feature>Keys.lists(), filters] as const,
      details: () => [...<feature>Keys.all, 'detail'] as const,
      detail: (id: string) => [...<feature>Keys.details(), id] as const,
    };
    ```
  - `useQuery` / `useInfiniteQuery` hooks with appropriate `staleTime`.
  - Mutation hooks with `useMutation` + invalidation.
  - Optimistic updates where appropriate (favorites, chat, mark-read).

## Step 4: Screens and components

- [ ] Create feature screens in `src/features/<feature>/screens/`.
- [ ] Create feature components in `src/features/<feature>/components/`.
- [ ] Wire route files in `src/app/` (keep thin — just compose feature screens).
- [ ] Every screen handles ALL UX states (see `student-nest-ui` skill):
  - [ ] **Loading:** skeletons matching final layout.
  - [ ] **Empty:** illustration + message + action.
  - [ ] **Error:** mapped message + retry.
  - [ ] **Offline:** cached data + banner.
- [ ] Pull-to-refresh on every list.
- [ ] Refetch on screen focus.
- [ ] Dark mode works.
- [ ] i18n: all user-visible strings in `src/i18n/en.json` (no hard-coded strings).

## Step 5: Accessibility

- [ ] Touch targets ≥ 44×44.
- [ ] `accessibilityLabel` and `accessibilityRole` on every interactive element.
- [ ] Status conveyed by label + icon, not color alone.
- [ ] Screen reader announcements on async results.

## Step 6: Tests

- [ ] Unit tests for pure logic (money formatting, date conversion, scoring, state reducers).
- [ ] RNTL tests for key components and forms (validation messages).
- [ ] **One Maestro flow** per major user journey.

## Step 7: Verify

- [ ] `npm run lint` passes.
- [ ] `npm run typecheck` passes.
- [ ] `npm test` passes.
- [ ] `npx expo-doctor` is clean.
- [ ] Flow verified in mock mode on device/emulator.
- [ ] Both light and dark mode checked.

## Step 8: Update status

- [ ] Update `docs/mobile-plan.md`:
  - Feature status: ⏳ planned → 🔨 in-progress → ✅ mock → 🔗 http-ready → 🟢 live.
  - Check off completed items in the phase checklist.
  - Add any contract questions discovered.

## Common mistakes to avoid

1. **Don't invent fields** not in the backend spec. Ask in contract questions.
2. **Don't store money as floats.** Always paise (integer).
3. **Don't switch on `error.message`.** Always `error.code`.
4. **Don't use `Animated` from react-native.** Use Reanimated.
5. **Don't use `FlatList`.** Use `FlashList`.
6. **Don't use `Image` from react-native.** Use `expo-image`.
7. **Don't hard-code colors or strings.** Use tokens and i18n.
8. **Don't show exact address/contact** unless the API response includes them.
9. **Don't write to Firestore.** All writes go through the API.
10. **Don't skip the skeleton state.** No spinners on first load.


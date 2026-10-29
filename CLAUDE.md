# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

The conventions, commands, testing gates, and "Never Do" list in `AGENTS.md` (imported above) apply in full. This file only adds what `AGENTS.md` leaves out.

## Current state of the repo

There is **no application code yet**. The repo contains only `plan.md`, `AGENTS.md`, `.env.example`, and `.opencode/skills/`. There is no `package.json`, so none of the `npm run …` scripts exist until **Phase 0** (in `plan.md` §8) scaffolds them. When you scaffold, create the scripts listed in `AGENTS.md` under those exact names. The README, CI, and skills all assume those names.

Once the Jest setup exists (standard NestJS layout: unit specs in `src/**/*.spec.ts`, e2e in `test/**/*.e2e-spec.ts`), run a single test with:

```bash
npm run test -- src/modules/bookings/bookings.service.spec.ts      # one file
npm run test -- -t "rejects double booking"                         # by test name
npm run test:e2e -- test/bookings.e2e-spec.ts                       # one e2e file (emulators must be running)
```

## Source of truth

- `plan.md` is the overview: collection map (§5), route list (§6), cross-cutting concerns (§7), phases (§8), the **decision log (§14)** that overrides the original idea, and open product questions (§15).
- `docs/features/NN-<feature>.md` is the detailed contract for each feature: fields and enums, endpoints with error codes, state machines, side effects, and **acceptance tests** (these are the e2e/unit test list). Implement from the spec. If the code must differ, update the spec and `plan.md` first.
- If a task touches anything listed in §15 (open questions), ask before you pick an answer.
- Work proceeds phase by phase (0 → 6). Don't build features from a later phase ahead of the current one.

## Architecture in brief (spans several files)

- **Write path**: the React Native app sends every write through the NestJS REST API (`/v1`, on Cloud Run). The API calls `firebase-admin` through the wrappers in `src/firebase/`. The mobile app only *reads* Firestore directly, through realtime listeners on paths that `firebase/firestore.rules` explicitly allows.
- **Side effects run in Firestore triggers**, which live in `firebase/functions/` (a separate npm package). Examples: Typesense search sync for `properties`, counter and `analytics_daily` aggregation, and outbound email/SMS/push. Triggers stay thin. Business logic and RBAC belong in NestJS services.
- **Search** never queries Firestore. `GET /v1/search/rooms` proxies Typesense. `properties.searchVersion` exists so that drift between Firestore and the index can be reconciled.
- **Auth**: Firebase ID token → `FirebaseAuthGuard` → `RolesGuard` (custom claims `role`, `kycStatus`) → `VerifiedOwnerGuard` for listing creation. The API is the only thing that sets claims, and it must refresh them on any role or KYC change.
- **State machines** (booking, property publish, verification, meeting, review moderation) are defined in `plan.md` §5. Booking creation is a `runTransaction` on the property/availability doc and honors an `Idempotency-Key` header.
- **Error envelope** comes from a single global filter: `{ error: { code, message, details? }, requestId }`.

## Agent skills

The skills in `.opencode/skills/<id>/SKILL.md` (`nestjs-development`, `firebase-backend`, `nest-testing`, `api-design`) are not registered as Claude Code skills. When a task matches one, read its `SKILL.md` directly and follow it. Each one has concrete patterns, such as the `firebase-admin` mock shape, emulator reset steps, Swagger decorators, and pagination DTOs.

## Local environment

Emulator ports: Auth `9099`, Firestore `8080`, Storage `9199`, Functions `5001`. Re-run `npm run seed` after every emulator restart. The emulator suite is the only place a dev-mode fixed OTP code is allowed.

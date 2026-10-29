# 01 — Authentication

**Phase 1** · Module: `auth`

## 1. Goal & user stories

- As a **student or owner**, I sign up and sign in with my email (OTP) or my phone (OTP), with no passwords.
- As a **user**, I verify both my email and my phone so owners and students can trust each other.
- As the **platform**, I issue no tokens of my own. Firebase Auth is the identity provider, and the API trusts only Firebase ID tokens.

## 2. Scope

**In:**
- Email OTP: the API generates the code, hashes it, and sends it via SendGrid. On verify, the API returns a Firebase **custom token**.
- Phone OTP via **Firebase Phone Auth on the client**.
- Linking email and phone to one account.
- Signup (profile bootstrap plus claims).
- Claim refresh signalling.

**Out:**
- Passwords.
- Social login (Google sign-in is a Phase 6+ candidate).
- Our own refresh tokens. The Firebase SDK refreshes ID tokens itself.

## 3. Flows

### Email OTP (passwordless)

```
App → POST /v1/auth/otp/email/send {email}
API → otp_codes/{sha256(email)} = {hash(code), attempts:0, expiresAt:+5m}; SendGrid email
App → POST /v1/auth/otp/email/verify {email, code}
API → verify hash (constant-time), mark consumed,
      get-or-create Firebase Auth user by email (emailVerified=true),
      return { customToken, isNewUser }
App → signInWithCustomToken(customToken) → ID token
App → if isNewUser: POST /v1/auth/signup {role, displayName, consents}
```

### Phone OTP

```
App → Firebase Phone Auth (reCAPTCHA/Play Integrity + App Check) → ID token with phone_number
    → if already signed in by email: linkWithCredential(phoneCredential) on the client
App → POST /v1/auth/phone/confirm   (API reads phone_number from verified token,
                                      sets users.phone + phoneVerified=true)
```

The phone number is never accepted from the request body. It comes only from the verified token. This makes it impossible to claim someone else's number.

### Signup / bootstrap

`POST /v1/auth/signup` is idempotent. It is allowed for an authenticated user with **no** `users/{uid}` doc yet (`@AllowUnregistered()`). It:
1. creates `users/{uid}`,
2. sets custom claims `{ role, status: "active" }`, plus `kycStatus: "none"` for owners,
3. returns `{ user, refreshToken: true }` so the app calls `getIdToken(true)`.

## 4. Data

`otp_codes/{sha256(lowercased email)}`:

| Field | Type | Notes |
| --- | --- | --- |
| `codeHash` | string | `HMAC-SHA256(code, OTP_PEPPER)`. Never stored in plaintext. |
| `attempts` | number | Max `OTP_MAX_ATTEMPTS` (5). After that the doc is locked until expiry. |
| `sendCount` | number | Sends in the current window |
| `expiresAt` | Timestamp | now + `OTP_EXPIRY_MINUTES` (5). Has a Firestore TTL policy. |
| `consumedAt` | Timestamp? | Set on success. A consumed code can't be reused. |

New env var: `OTP_PEPPER` (32+ random bytes). Add it to `.env.example` and the config schema.

## 5. Endpoints

| Method | Path | Auth | Request | Response | Errors |
| --- | --- | --- | --- | --- | --- |
| POST | `/v1/auth/otp/email/send` | public | `{ email }` | `202 { expiresInSec: 300, resendAfterSec: 30 }` | `RATE_LIMITED`, `VALIDATION_FAILED` |
| POST | `/v1/auth/otp/email/verify` | public | `{ email, code }` (6 digits) | `200 { customToken, isNewUser }` | `OTP_INVALID`, `OTP_EXPIRED`, `OTP_LOCKED`, `ACCOUNT_SUSPENDED` |
| POST | `/v1/auth/phone/confirm` | bearer (unregistered ok) | — | `200 { phone, phoneVerified: true }` | `PHONE_NOT_IN_TOKEN`, `PHONE_IN_USE` |
| POST | `/v1/auth/signup` | bearer (unregistered ok) | `{ role: student\|owner, displayName, acceptedTermsVersion, marketingOptIn? }` | `201 { user, refreshToken: true }` | `ALREADY_REGISTERED` (409, only if the role differs), `VALIDATION_FAILED` |

**Removed from the original plan:** `/v1/auth/login` (email verify *is* login), `/v1/auth/refresh` (the Firebase SDK refreshes tokens), and `/v1/auth/me` (duplicate of `GET /v1/users/me`). The phone send/verify endpoints were also removed because the client SDK handles them.

## 6. Business rules

- **Rate limits** (Firestore throttler):
  - email send: 3 per 15 min per email and 10 per hour per IP;
  - verify: 10 per 15 min per IP;
  - resend cooldown: 30 s.
- **Uniform response:** `send` returns 202 whether or not the email exists. This prevents account enumeration.
- **Dev mode:** with the emulator **and** `NODE_ENV != production`, code `000000` is accepted for `*@test.studentnest.app`. Boot fails if this is enabled in production.
- **Banned or suspended users:** verify still checks the code, but returns `ACCOUNT_SUSPENDED` instead of a token.
- **Admin role** is never self-assignable. Admins are created by a CLI script (`scripts/make-admin.ts`) or by another admin.

## 7. Side effects

- SendGrid transactional email with a template ID per locale (`SENDGRID_TEMPLATE_OTP`, a new env var). In the emulator, the code goes to the log instead.
- Signup writes an `auditLogs` entry (`user.signup`).

## 8. Security

- Hash the OTP with HMAC plus a pepper, compare in constant time, and keep a 5-minute TTL. Never log codes (the logger redacts them).
- App Check is required on the OTP endpoints once enforce mode is on.
- `customToken` lives for 1 h on Firebase's side and is single use in practice. Never log it.

## 9. Edge cases

- The email already belongs to a phone-first account: Firebase Auth user lookup by email returns the same uid, so the user signs into the existing account and nothing is duplicated.
- The phone number is already linked to another uid: `PHONE_IN_USE` (409). Support handles merging manually.
- The user requests a new code while the old one is still valid: the old code is overwritten and attempts reset (`sendCount` still counts).
- Clock skew: always use server timestamps.

## 10. Acceptance tests

- Happy path: send → verify → custom token → sign in (Auth emulator) → signup → `GET /v1/users/me` shows the role.
- A wrong code 5 times returns `OTP_LOCKED`. The correct code then still fails until expiry.
- An expired code returns `OTP_EXPIRED`. A reused code returns `OTP_INVALID`.
- The 4th send in 15 min returns 429.
- `POST /signup` twice with the same role returns 200 the second time (idempotent). With a different role it returns 409.
- `POST /signup` with `role: admin` returns 400.
- `phone/confirm` with a token that has no `phone_number` returns 400 `PHONE_NOT_IN_TOKEN`.
- Unit: the hash is never equal to the code; `otp_codes` never contains the plaintext.

## 11. Open questions

- **Twilio Verify vs Firebase Phone Auth.** This spec uses Firebase Phone Auth, which is cheaper to integrate and gives a native ID token. If you want Twilio Verify for OTP instead, the API would verify and then call `updateUser({ phoneNumber })`. Then `TWILIO_VERIFY_SID` is used and Twilio is otherwise only for transactional SMS.
- Should a phone be **required** before a student can book? The recommendation is yes, required for bookings, tours, and inquiries.

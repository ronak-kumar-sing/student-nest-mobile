# 03 — Owner Verification (KYC)

**Phase 2** (moved from Phase 5: properties can't be published without it) · Module: `verification` (+ admin review in 14)

## 1. Goal & user stories

- As an **owner**, I prove my identity once so students trust my listings.
- As an **admin**, I review the submitted documents quickly and approve or reject them with a reason.
- As a **student**, I see a "Verified owner" badge.

## 2. Scope

**In:**
- Identity verification with one government ID plus a selfie.
- A private upload flow.
- The admin review queue.
- Re-submission after rejection.
- Document retention rules.

**Out:**
- Automated KYC (DigiLocker or Aadhaar e-KYC API). This is a Phase 6+ candidate.
- Property ownership proof. That is covered by the listing review in 04 and 14.

## 3. Data — `verifications/{id}`

| Field | Type | Notes |
| --- | --- | --- |
| `uid` | string | Owner |
| `docType` | `KycDocType` = `aadhaar_masked \| pan \| passport \| driving_licence \| voter_id` | **Masked Aadhaar only.** Uploading a full Aadhaar number is not permitted (Aadhaar Act / UIDAI guidance). |
| `docNumberLast4` | string(4) | For admin cross-check. The full number is never stored. |
| `files` | `[{ kind: front\|back\|selfie, path, contentType, sizeBytes }]` | ≤ 3, private bucket `kyc/{uid}/{verificationId}/…` |
| `legalName` | string | Must match the ID |
| `status` | `VerificationStatus` = `draft \| submitted \| approved \| rejected \| cancelled` | |
| `rejectionReason` | `KycRejectionReason` enum + `note?` | `blurry \| mismatch_name \| expired \| unsupported_doc \| selfie_mismatch \| other` |
| `submittedAt`, `reviewedAt`, `reviewedBy` | | |
| `history[]` | | |
| `purgeAfter` | Timestamp? | Set on decision (see retention) |

Indexes: `(status, submittedAt)` for the admin queue and `(uid, createdAt desc)`.

The current state is mirrored on `users/{uid}.ownerProfile.kycStatus` and in the `kycStatus` claim.

## 4. Endpoints

| Method | Path | Role | Request | Response | Errors |
| --- | --- | --- | --- | --- | --- |
| POST | `/v1/verification/requests` | owner | `{ docType, legalName, docNumberLast4 }` | `201 { id, status: draft }` | `KYC_ALREADY_APPROVED`, `KYC_IN_REVIEW` (409) |
| POST | `/v1/verification/requests/:id/upload-urls` | owner (own) | `{ files: [{ kind, contentType, sizeBytes ≤ 5MB }] }` | `{ uploads: [{ kind, uploadUrl, path, expiresAt }] }` (5 min) | `INVALID_TRANSITION` if not draft |
| POST | `/v1/verification/requests/:id/actions` | owner (own) | `{ action: "submit" }` | `{ id, status: submitted }` | `KYC_FILES_MISSING` (front + selfie are required), `INVALID_TRANSITION` |
| GET | `/v1/verification/requests/me` | owner | — | latest request DTO (no file URLs) | `NOT_FOUND` |

Admin endpoints are in [14-admin](./14-admin.md): queue, a detail view with 5-minute signed read URLs, approve, and reject.

## 5. State machine

```
draft ──submit──▶ submitted ──approve(admin)──▶ approved
  │                   └──reject(admin)──▶ rejected ──(owner creates new request)──▶ draft
  └──cancel/abandon (7 days, scheduled cleanup)──▶ cancelled
```

- Only one non-terminal request per owner.
- `approved` sets the user's `kycStatus=approved` and the claim, and sends the `kyc_approved` notification.
- `rejected` sets `kycStatus=rejected` and sends `kyc_rejected` with the reason.
- Re-submission is unlimited, but rate-limited to 3 per 24 h.
- **An admin can revoke** an approval (fraud). This sets `kycStatus=rejected`, which auto-suspends the owner's published listings (via a trigger).

## 6. Side effects

- A trigger on a `verifications` status change mirrors it to the user doc. The API also sets the claims synchronously, so the trigger is only a safety net.
- Notifications: `kyc_submitted` (to admins, as a digest), `kyc_approved`, `kyc_rejected`.
- `auditLogs` records every admin view of the documents (`kyc.view`) and every decision.

## 7. Security & privacy

- Storage rules: `kyc/**` is deny-all. Access goes only through signed URLs that the API issues (uploads by the owner for 5 min, reads by an admin for 5 min).
- The bucket is a separate private bucket (`KYC_BUCKET`, a new env var) with uniform bucket-level access and no public ACLs.
- **Retention:** document files are deleted 30 days after a decision (`purgeAfter`, scheduled function). Metadata (`docType`, `last4`, `legalName`, decision) is kept.
- Document URLs and file paths never appear in any non-admin response.

## 8. Edge cases

- Uploading to a signed URL after the request was submitted: the URL has already expired (5 min), and submit validates that the files exist and match the declared size and type.
- The owner changes `legalName` on their profile after approval: it doesn't affect anything. `legalName` lives on the verification record only.
- An admin approves a request that was cancelled concurrently: the transaction checks the status, returning 409 `INVALID_TRANSITION`.

## 9. Acceptance tests

- Create → upload URLs → (emulator upload) → submit → admin approve → the owner's next token has `kycStatus=approved` → `POST /v1/properties` is allowed.
- Submit without a selfie returns `KYC_FILES_MISSING`.
- A student calling create gets 403. An owner with an approved KYC calling create gets 409.
- Rules test: an authenticated owner cannot read `kyc/{uid}/…` directly from Storage.
- A purge function test deletes the files and keeps the metadata.

## 10. Open questions

- Is a selfie required in v1? It is recommended because it stops ID-photo theft.
- Should KYC files be kept for 30 days, or longer for dispute handling? This needs a legal call.

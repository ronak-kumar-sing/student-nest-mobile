# 04 — Properties (Listings)

**Phase 2** · Module: `properties`

## 1. Goal & user stories

- As a **verified owner**, I create a listing with photos, rent, rules, and capacity, then submit it for review.
- As an **owner**, I manage my listings: edit, pause, update availability, and see their status.
- As a **student**, I open a listing and see everything except the exact address. The exact address is shown only once I have a confirmed tour or an approved booking.
- As an **admin**, I approve or reject new listings and suspend bad ones (see 14).

## 2. Scope

**In:**
- CRUD.
- Images via signed URLs.
- The publish/review workflow.
- Capacity (beds/units).
- Address privacy.
- Soft delete.

**Out:**
- Per-date calendars. Availability is "from date" plus open beds.
- Video tours.
- Bulk import.

## 3. Data — `properties/{id}`

| Field | Type | Notes |
| --- | --- | --- |
| `ownerId` | string | |
| `title` | 10–100 chars | |
| `description` | 50–3000 chars | |
| `roomType` | `RoomType` = `1rk \| 1bhk \| 2bhk \| 3bhk \| pg \| hostel \| shared_room` | |
| `tenancyType` | `TenancyType` = `whole_unit \| per_bed` | `per_bed` for PG, hostel, and shared rooms |
| `capacity` | int ≥ 1 | Beds (`per_bed`) or 1 (`whole_unit`) |
| `availableSlots` | int 0..capacity | **Changed only inside booking transactions** (07) or by the owner's manual adjustment |
| `genderPolicy` | `GenderPolicy` = `any \| male_only \| female_only` | |
| `rentPaise` | int | Monthly, per bed or per unit depending on `tenancyType` |
| `depositPaise` | int | |
| `maintenancePaise` | int? | |
| `billsIncluded` | `BillType[]` = `electricity \| water \| wifi \| gas` | |
| `foodIncluded` | `none \| breakfast \| two_meals \| three_meals` | |
| `address` | `{ line1, line2?, locality, city, citySlug, state, pincode }` | `line1` and `line2` are **private** |
| `geo` | `GeoPoint` (exact, private) | |
| `publicGeo` | `GeoPoint` | The exact point shifted by a deterministic random offset of 200–400 m. This is the only geo that leaves the API before the reveal. |
| `nearby` | `[{ name, kind: college\|metro\|bus\|market, distanceKm }]` ≤ 10 | Entered by the owner |
| `amenities` | `Amenity[]` (closed enum: `wifi, ac, geyser, washing_machine, fridge, tv, parking, power_backup, lift, cctv, security_guard, housekeeping, gym, study_table, attached_bathroom, balcony, kitchen`) | |
| `houseRules` | `{ smoking: bool, drinking: bool, pets: bool, visitors: bool, curfew?: "HH:mm", nonVeg: bool }` | A structure, not free text, so it can be filtered |
| `minStayMonths`, `noticePeriodDays` | int | |
| `availableFrom` | Timestamp | |
| `images` | `[{ path, width, height, order, isCover, blurhash? }]` 3..15 | A bounded array, so it's allowed by the AGENTS rule. Its size is checked. |
| `status` | `PropertyStatus` = `draft \| pending_review \| published \| paused \| rejected \| suspended \| deleted` | |
| `rejection` | `{ reason: ListingRejectionReason, note? }?` | |
| `needsReReview` | bool | Set when a published listing edits sensitive fields |
| `ratingAvg`, `ratingCount` | number, int | Maintained by the reviews trigger (12) |
| `searchVersion` | int | Incremented on every indexed change (05) |
| `publishedAt`, `createdAt`, `updatedAt`, `deletedAt?` | | |

Stats are **not** on the doc. They are sharded counters at `counters/properties_{id}_{views|inquiries|favorites|bookings}` (see 15).

Indexes: `(ownerId, status, updatedAt desc)`, `(status, citySlug, rentPaise)`, `(status, createdAt)` for the admin queue, and `(needsReReview, updatedAt)`.

## 4. Endpoints

| Method | Path | Role | Request | Response | Errors |
| --- | --- | --- | --- | --- | --- |
| POST | `/v1/properties` | owner + `VerifiedOwnerGuard` | `CreatePropertyDto` (all fields except status/stats; images may be empty while in draft) | `201 PropertyOwnerDto` (status `draft`) | `KYC_REQUIRED` (403), `VALIDATION_FAILED`, `LISTING_LIMIT` (409, max 20 non-deleted listings) |
| GET | `/v1/properties/mine?status=&cursor=` | owner | — | `Page<PropertyOwnerDto>` with stats | — |
| GET | `/v1/properties/:id` | optional auth | — | `PropertyPublicDto`. It includes `address.line1` and exact geo **only** if the caller is the owner, an admin, or has a confirmed tour or approved booking. It also includes `owner: PublicUserDto` and `isFavorite` when authenticated. | `NOT_FOUND` (also for non-published listings when the caller isn't the owner or an admin) |
| PATCH | `/v1/properties/:id` | owner (own) | partial `UpdatePropertyDto` | `PropertyOwnerDto` | `FORBIDDEN`, `INVALID_STATE` (`deleted`/`suspended` can't be edited), `CAPACITY_BELOW_OCCUPIED` |
| POST | `/v1/properties/:id/image-uploads` | owner (own) | `{ files: [{ contentType, sizeBytes ≤ 5MB }] }` ≤ 15 | `{ uploads: [{ uploadUrl, path, expiresAt }] }` | `IMAGE_LIMIT` |
| PUT | `/v1/properties/:id/images` | owner (own) | `{ images: [{ path, order, isCover }] }` (full replace) | `PropertyOwnerDto` | `UPLOAD_NOT_FOUND`, `IMAGE_LIMIT`, `COVER_REQUIRED` |
| POST | `/v1/properties/:id/actions` | owner (own) | `{ action: submit \| pause \| resume \| withdraw }` | `PropertyOwnerDto` | `INVALID_TRANSITION`, `LISTING_INCOMPLETE` (lists the missing fields in `details`) |
| DELETE | `/v1/properties/:id` | owner (own) | — | `{ status: "deleted" }` | `ACTIVE_BOOKINGS_EXIST` |

`publish` and `unpublish` in the original plan are replaced by the `actions` endpoint. Admin approve, reject, and suspend are in 14.

## 5. State machine

```
draft ──submit──▶ pending_review ──approve(admin)──▶ published ◀──resume── paused
  ▲                    │  └──reject(admin)──▶ rejected ──(edit + submit)──▶ pending_review
  └──withdraw──────────┘                       published ──pause──▶ paused
published|paused ──suspend(admin)──▶ suspended ──reinstate(admin)──▶ published
any (no active bookings) ──delete──▶ deleted (soft; purged after 90 days)
```

- `submit` requires: KYC approved, ≥ 3 images including a cover, every required field present, and `availableFrom` no more than 6 months in the past.
- **Edits while published:** price, availability, `availableSlots`, rules, and amenities apply immediately. Title, description, images, and address apply immediately **and** set `needsReReview=true` (post-moderation queue in 14). Editing `address` or `geo` recomputes `publicGeo`.
- `availableSlots` set manually by the owner must satisfy `0 ≤ slots ≤ capacity - approvedOccupancy`. The check runs inside a transaction.

## 6. Side effects

- Trigger `onPropertyWrite`:
  - When `status == published` and `availableSlots > 0` (or the owner chose "show when full"), it upserts the Typesense doc.
  - Otherwise it deletes the Typesense doc.
  - It bumps `searchVersion`.
- An owner's `kycStatus` changing to `rejected` triggers a batch suspend of their published listings.
- Images: a function generates thumbnails (`_400w.webp`, `_1200w.webp`) and a `blurhash` on upload. The API returns CDN URLs plus `blurhash`, which the mobile app uses as an image placeholder.
- The listing count is maintained on `users.ownerProfile.listedPropertyCount` (published only).
- Notifications: `listing_approved`, `listing_rejected`, `listing_suspended` (owner).

## 7. Security

- Storage: `properties/{id}/images/*` is public-read, and writes go only via signed URL. Uploads that don't appear in `images` within 24 h are garbage-collected.
- Firestore rules: none for the mobile app. The app reads properties only via the API so the address stays private.

## 8. Edge cases

- The owner reduces `capacity` below the number of approved occupants: `CAPACITY_BELOW_OCCUPIED`.
- A student opens a listing that became `paused` or `suspended`: 404 for the public, but a student with an active booking still sees it through their booking (07).
- Concurrent PATCHes: last write wins on most fields. `availableSlots` changes always go through a transaction.
- An `availableFrom` in the past on a published listing means "available now". That's fine.

## 9. Acceptance tests

- An unverified owner gets 403 on create. A verified owner can create → upload → set images → submit → admin approve → it appears in search (with the Typesense test container) or the sync function is called (unit).
- Submit with 2 images returns `LISTING_INCOMPLETE` with details.
- Public GET never contains `address.line1` or the exact `geo`. After an approved booking, the student's GET includes them.
- Delete with an approved booking returns 409.
- Editing the title while published keeps the listing published and sets `needsReReview`.

## 10. Open questions

- Is the per-owner limit of 20 listings right? Brokers posing as owners are the main abuse vector.
- Should full listings stay visible in search (with "Full — notify me") or be hidden? The default is hidden, with an owner toggle.

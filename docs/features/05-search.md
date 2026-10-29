# 05 — Search & Discovery

**Phase 2** · Module: `search` · Sync: `firebase/functions/src/search/`

## 1. Goal & user stories

- As a **student** (signed in or guest), I search rooms by city or near my college, filter by budget, type, gender policy, amenities, and food, and sort by price, distance, rating, or newest.
- As a **student**, I get typo-tolerant text search ("kormangla").
- As the **platform**, search answers in < 200 ms p95 and never shows unpublished listings or exact addresses.

## 2. Scope

**In:**
- Typesense-backed search.
- Facets.
- Geo radius.
- Cursor pagination.
- City autocomplete.
- Index sync and reconciliation.

**Out:**
- Personalized ranking.
- Saved searches with alerts (Phase 6+ candidate).
- Map clustering (the client does it).

## 3. Typesense collection `rooms` (`TYPESENSE_COLLECTION`)

| Field | Type | Facet | Notes |
| --- | --- | --- | --- |
| `id` | string | | Property ID |
| `title`, `description`, `locality`, `nearbyNames` | string / string[] | | Searchable (`query_by`) |
| `citySlug` | string | ✓ | |
| `roomType`, `tenancyType`, `genderPolicy`, `foodIncluded` | string | ✓ | |
| `amenities`, `billsIncluded` | string[] | ✓ | |
| `rentPaise`, `depositPaise` | int64 | range | |
| `ratingAvg` | float | | Sort |
| `ratingCount`, `availableSlots` | int32 | | |
| `location` | geopoint | | **`publicGeo` only** |
| `availableFrom`, `publishedAt` | int64 (epoch s) | | Sort and filter |
| `coverImage` | string | | Index only |
| `ownerVerified` | bool | ✓ | Always true in v1; future-proofing |
| `searchVersion` | int32 | | Reconciliation |

Schema migrations live in `scripts/typesense/migrate.ts`. They are versioned and use an alias swap (`rooms` → `rooms_v2`) for zero-downtime reindexing.

## 4. Endpoints

| Method | Path | Auth | Query | Response | Errors |
| --- | --- | --- | --- | --- | --- |
| GET | `/v1/search/rooms` | optional | `q?`, `city?`, `near?=lat,lng`, `radiusKm?` (1–25, default 5), `minRent?`, `maxRent?` (rupees in the query, converted to paise), `roomType[]?`, `tenancyType?`, `genderPolicy?`, `amenities[]?` (AND), `food?`, `availableBy?` (date), `sort?` = `relevance\|rent_asc\|rent_desc\|distance\|rating\|newest`, `cursor?`, `limit?` | `{ items: RoomCardDto[], facets: { roomType, amenities, genderPolicy, rentHistogram }, nextCursor, hasMore, total }` | `VALIDATION_FAILED` (`city` or `near` required; `sort=distance` requires `near`) |
| GET | `/v1/search/cities?q=` | public | prefix | `[{ slug, name, state, listingCount }]` | — |
| GET | `/v1/search/suggest?q=&city=` | public | prefix | `[{ type: locality\|college\|property, label, value }]` ≤ 8 | — |

`RoomCardDto`: `{ id, title, coverImageUrl, roomType, tenancyType, rentPaise, depositPaise, genderPolicy, locality, citySlug, publicLocation, distanceKm?, ratingAvg, ratingCount, availableFrom, isFavorite? }`

**Cursor:** Typesense paginates by page number. The API hides this behind an opaque cursor that encodes `{ page, searchFingerprint }`. Reusing a cursor with different filters returns 400 `CURSOR_MISMATCH`. This satisfies the "no offset in the public API" rule, because clients never send offsets. The maximum depth is 25 pages (500 results).

## 5. Business rules

- Only `status == published` listings are in the index. "Full" listings are only indexed if the owner opted in.
- A gender filter is applied implicitly if the student set `gender` and the listing is single-gender. The mobile app shows a toggle to disable this (`respectGender=false`).
- Default sort: `relevance` when `q` is set, otherwise `distance` when `near` is set, otherwise `newest`.
- `isFavorite` is resolved after the search with one batched `getAll` on `users/{uid}/favorites` for the returned IDs.
- Search logs a `search` analytics event asynchronously (fire-and-forget, sampled at 100%) (15).

## 6. Sync & consistency

- `onPropertyWrite` trigger (04) upserts or deletes the doc with an idempotent upsert keyed by ID, including `searchVersion`.
- **Reconciliation job** (scheduled every hour) compares `published` property IDs and `searchVersion` with Typesense via export. It repairs drift and emits a `search_drift` metric.
- If Typesense is down, the API returns 503 `SEARCH_UNAVAILABLE`. There is no Firestore fallback, because a degraded city-only query would mislead users.
- Use a search-only scoped API key for queries and an admin key only in functions. That needs two env vars: `TYPESENSE_SEARCH_KEY` and `TYPESENSE_ADMIN_KEY` (rename `TYPESENSE_API_KEY`).

## 7. Security

- Search is public (guest browsing), so it's rate-limited to 60 per minute per IP and 120 per minute per uid, with App Check.
- The index stores only public fields: no address line, no exact geo, no owner contact.

## 8. Edge cases

- `minRent > maxRent` returns 400.
- `near` is outside India's bounding box: 400 `LOCATION_UNSUPPORTED`.
- A listing is unpublished between search and open: the detail call returns 404, and the app removes the card.
- Typo or Hinglish queries: Typesense typo tolerance is set to 2, with synonyms (`pg ↔ paying guest`, `flat ↔ bhk`) in `scripts/typesense/synonyms.json`.

## 9. Acceptance tests

- With the Typesense test container in CI e2e: seed 20 properties, filter city plus rent range, and get the correct subset. Geo radius orders by distance. Paginating with the cursor shows no duplicates.
- A non-published listing never appears.
- A cursor with changed filters returns 400.
- Unit: query builder mapping (rupees → paise, enums → `filter_by` string, escaping of `q`).
- Performance check in Phase 6: p95 < 200 ms at 50 RPS.

## 10. Open questions

- Typesense hosting: Typesense Cloud (managed, roughly $30/mo) or a self-hosted small VM? The plan prefers self-hosting for cost, but managed avoids operational work.
- Should the cities list be fixed (a launch-city allowlist) or open?

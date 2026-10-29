# 15 — Analytics

**Phase 2** (event ingestion and counters) **+ Phase 6** (owner dashboards, admin overview, BigQuery) · Module: `analytics`

## 1. User stories

- As an **owner**, I see views, saves, inquiries, tour requests, and bookings per listing over time, and how my rent compares to similar rooms nearby.
- As an **admin**, I see funnel and growth metrics per city.
- As the **product team**, we can answer ad-hoc questions without hurting production Firestore.

## 2. Events

`POST /v1/analytics/events` (optional auth, App Check, 60 requests per minute per IP) takes `{ events: [{ type, propertyId?, at, sessionId, props? }] }`, with at most 50 events per batch.

| Event type | Source | Effect |
| --- | --- | --- |
| `listing_view` | client (detail screen) | Increments the view counter after dedupe |
| `listing_impression` | client (search card visible ≥ 1 s) | BigQuery only |
| `search` | **server** (05) | BigQuery only |
| `contact` | **server** (09 first message) | Inquiries counter |
| `favorite`, `tour_request`, `booking_request`, `booking_approved` | **server** (06/08/07) | Their counters |

Server-side events are never accepted from the client endpoint. Its allowlist is `listing_view` and `listing_impression` only.

**View dedupe:** one counted view per (viewer, property, IST day). The viewer is the uid if signed in, otherwise `sessionId`. The marker doc is `viewMarks/{yyyymmdd}_{propertyId}_{viewerHash}` with a 2-day TTL, written with `create`, so a duplicate is a no-op. Owners viewing their own listing are not counted.

## 3. Storage

- **Live counters:** sharded `counters/properties_{id}_{metric}` (04).
- **Daily rollups:** `analytics_daily/{yyyy-mm-dd}/properties/{propertyId}` with `{ views, favorites, inquiries, tours, bookingRequests, bookingsApproved }`. These are written by a scheduled function at 00:30 IST that reads and resets per-day shards (a `daily_` counter prefix).
- **Platform rollups:** `analytics_daily/{yyyy-mm-dd}/cities/{citySlug}` and `/platform/all` with signups (by role), listings published, bookings by status, and median owner response time.
- **BigQuery:** the "Stream Firestore to BigQuery" extension on `bookings`, `properties`, and `users` (non-PII fields only), plus the raw event stream through a Pub/Sub → BigQuery subscription. This is for heavy and ad-hoc reporting and is never queried by the API.

## 4. Endpoints

| Method | Path | Role | Response |
| --- | --- | --- | --- |
| POST | `/v1/analytics/events` | optional | `202 { accepted, dropped }` |
| GET | `/v1/owners/analytics/summary?from=&to=` | owner | Totals across all listings, conversion (views → inquiries → bookings), and response rate |
| GET | `/v1/owners/analytics/properties/:propertyId?from=&to=&granularity=day\|week` | owner (own) | Time series from `analytics_daily`, plus today's live counters, plus `rentBenchmark { p25, median, p75 }` for the same `citySlug` + `roomType` + locality |
| GET | `/v1/admin/analytics/overview?from=&to=&city=` | admin | Platform rollups, queue sizes (KYC, listings, reports), and `/ready` status |

`from`/`to` are capped at a 180-day range. Responses are cached in memory for 5 min per owner.

## 5. Rent benchmark

A nightly function computes `rentBenchmarks/{citySlug}_{roomType}_{locality}` from published listings (n ≥ 5, otherwise it falls back to city level). The benchmark gives owners fair-pricing feedback and lets the app later show "priced below average" badges.

## 6. Privacy

- No PII in events or BigQuery tables beyond opaque uids. IP addresses are never stored, only used for rate limiting.
- `sessionId` is a random per-install ID, not a device ID.

## 7. Acceptance tests

- 3 views by the same student on the same day count as 1. A different day counts again. The owner's own view counts as 0.
- A client posting a `booking_request` event has it dropped (`dropped: 1`).
- Rollup function: shards are summed into the daily doc and the daily shards are reset (unit with the emulator).
- Owner analytics for another owner's property returns 403.

## 8. Open questions

- Is BigQuery needed at launch? The recommendation is to defer the extension to Phase 6. Rollups cover dashboards until then.

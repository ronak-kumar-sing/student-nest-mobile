# 06 — Favorites (Saved Rooms)

**Phase 2** · Module: `favorites` · *New. This feature was not in the original plan.*

## 1. Goal & user stories

- As a **student**, I save rooms I like and come back to compare them.
- As an **owner**, I see how many students saved my listing. This is a demand signal shown in analytics (15).

## 2. Scope

**In:** add, remove, and list favorites; the `isFavorite` flag in search and detail; a favorites counter.

**Out:** shared lists and price-drop alerts (a later candidate; the data is already in place).

## 3. Data — `users/{uid}/favorites/{propertyId}`

`{ propertyId, createdAt, snapshot: { title, coverImage, rentPaise, citySlug } }`

The snapshot is denormalized so the list renders without N extra reads. It is refreshed lazily on list (see rules). The cap is 200 favorites per user.

Indexes: single-field `createdAt desc` (automatic).

## 4. Endpoints

| Method | Path | Role | Response | Errors |
| --- | --- | --- | --- | --- |
| PUT | `/v1/favorites/:propertyId` | student | `200 { propertyId, createdAt }` (idempotent) | `NOT_FOUND` (not published), `FAVORITES_LIMIT` (409) |
| DELETE | `/v1/favorites/:propertyId` | student | `200 { status: "deleted" }` (idempotent) | — |
| GET | `/v1/favorites?cursor=&limit=` | student | `Page<RoomCardDto & { available: bool }>` | — |

## 5. Business rules

- A favorite whose property was later paused, suspended, or deleted stays in the list with `available: false`. The user removes it.
- On list, `getAll` fetches the current property docs, overrides the snapshot, and writes back a refreshed snapshot if the price or title changed.

## 6. Side effects

- PUT and DELETE (only when state actually changes) increment or decrement the sharded counter `properties_{id}_favorites`.

## 7. Security

- No Firestore rule is needed. The app reads favorites through the API, so `users/{uid}/favorites` stays default-deny.

## 8. Acceptance tests

- PUT twice leaves one doc and increments the counter once. DELETE twice is idempotent.
- PUT on a draft listing returns 404. An owner calling PUT gets 403.
- A paused property shows `available: false` in the list.

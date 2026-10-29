# 08 — Tours (Meetings)

**Phase 3** · Module: `meetings` (API path `/v1/tours`)

## 1. Goal & user stories

- As a **student**, I request a visit in person or by video, proposing up to 3 time slots.
- As an **owner**, I confirm one slot, decline, or propose other times.
- As **both**, we get reminders, and a video tour comes with a meeting link.

## 2. Scope

**In:**
- The slot-proposal flow.
- In-person and video tours.
- Reschedule.
- Cancel.
- No-show marking.
- Reminders.
- Address reveal for confirmed in-person tours.

**Out (v1):**
- Automatic Google Meet creation. See the open questions. v1 uses an **owner-provided link** (Meet, Zoom, WhatsApp video), or the app falls back to the in-app phone number.
- An owner availability calendar.

## 3. Data — `meetings/{id}`

| Field | Type | Notes |
| --- | --- | --- |
| `propertyId`, `studentId`, `ownerId` | string | |
| `mode` | `TourMode` = `in_person \| video` | |
| `proposedSlots` | `Timestamp[]` 1..3 | Each ≥ now + 2 h and ≤ now + 30 days. 30-minute granularity. |
| `proposedBy` | `student \| owner` | Whoever made the latest proposal |
| `scheduledAt` | Timestamp? | Set on confirm |
| `meetingLink` | URL? | Video only. Allowlisted hosts: meet.google.com, zoom.us, whatsapp. |
| `status` | `TourStatus` = `requested \| confirmed \| completed \| cancelled \| declined \| no_show \| expired` | |
| `note` | ≤ 300 | |
| `history[]` | | |

Indexes: `(studentId, status, scheduledAt)`, `(ownerId, status, scheduledAt)`, and `(status, scheduledAt)` for the reminder and auto-complete jobs.

## 4. State machine

```
requested ──confirm(slot)──▶ confirmed ──complete──▶ completed
   │ ▲                          │  └──mark_no_show(owner|student)──▶ no_show
   │ └──propose(other party)────┤ (reschedule = propose; back to requested)
   ├──decline(owner)──▶ declined
   ├──cancel(either)──▶ cancelled ◀──cancel(either)── confirmed
   └──(all slots in past)──▶ expired
```

- `confirm` is done by whoever did **not** make the latest proposal, and it must pick one of `proposedSlots`.
- `complete` is automatic at `scheduledAt + 2 h` unless someone marks a no-show.
- Limit: one active (requested or confirmed) tour per student per property, and 5 active tours per student overall.

## 5. Endpoints

| Method | Path | Role | Request | Response | Errors |
| --- | --- | --- | --- | --- | --- |
| POST | `/v1/tours` | student (phone verified) | `{ propertyId, mode, proposedSlots[], note? }` | `201 TourDto` | `PHONE_REQUIRED`, `PROPERTY_UNAVAILABLE`, `DUPLICATE_TOUR`, `TOO_MANY_TOURS`, `SLOT_INVALID` |
| GET | `/v1/tours?role=student\|owner&status=&cursor=` | student/owner | — | `Page<TourDto>` | — |
| GET | `/v1/tours/:id` | party/admin | — | `TourDto`. Includes `address` (in-person) or `meetingLink`, plus the other party's phone, only when `confirmed`. | `NOT_FOUND` |
| POST | `/v1/tours/:id/actions` | party | `{ action: confirm \| propose \| decline \| cancel \| mark_no_show, slot?, proposedSlots?, meetingLink?, reason? }` | `TourDto` | `INVALID_TRANSITION`, `SLOT_INVALID`, `MEETING_LINK_REQUIRED` (video confirm by owner), `LINK_NOT_ALLOWED` |

This replaces `/v1/meetings` from the original plan. "Tours" is the user-facing noun, and the module name stays `meetings` internally.

## 6. Side effects

- Notifications:
  - `tour_requested` to the owner.
  - `tour_confirmed` to both.
  - `tour_rescheduled` to the other party.
  - `tour_cancelled` and `tour_declined`.
  - Reminders at T−24 h and T−1 h to both, via a scheduled function every 15 min that queries `(status=confirmed, scheduledAt in window)` and records `remindersSent[]` for idempotency.
- Counter: `properties_{id}_inquiries` is incremented on tour request. This is the definition of "inquiry" alongside first messages (09).
- A completed tour unlocks the "Apply now" prompt.

## 7. Security

- Times are stored in UTC and displayed in IST on the client. The API accepts ISO strings with an offset and rejects naive ones.
- `meetingLink` is validated against the host allowlist to block phishing links.

## 8. Edge cases

- The owner proposes new slots after the student's slots: `proposedBy` flips and the student must confirm.
- Both parties try to confirm at once: a transaction on status means the first wins and the second gets 409.
- The property becomes unavailable with a confirmed tour: the tour is kept and the owner is notified to cancel or keep it.
- DST doesn't apply (IST), but always use UTC instants anyway.

## 9. Acceptance tests

- Request → owner confirms slot 2 → both receive `confirmed` with the address → the auto-complete job completes it.
- Confirming with a slot not in the proposal returns 400 `SLOT_INVALID`. A video confirm without a link returns 400.
- The student cannot confirm their own proposal (409 `INVALID_TRANSITION`).
- A reminder job running twice sends one reminder.
- A duplicate active tour on the same property returns 409.

## 10. Open questions

- **Automatic Google Meet links:** these need either a Google Workspace domain with a service account (domain-wide delegation) or per-owner Google OAuth (`GOOGLE_CLIENT_ID` and friends are already in `.env.example`). The recommendation is to defer to Phase 6 and keep the owner-provided link in v1.
- Should students be able to request tours as guests? The recommendation is no, because phone verification cuts spam.

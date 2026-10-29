# 13 — Reports & Moderation

**Phase 5** · Module: `reports` (user-facing). Admin resolution is in [14-admin](./14-admin.md). *The original plan had admin report endpoints but no way for users to file a report.*

## 1. Goal & user stories

- As a **student**, I report a fake or broker listing, an abusive review, a scam message, or a bad profile.
- As an **owner**, I report an abusive review or a fake student.
- As an **admin**, I work a prioritized queue and take actions that apply immediately.

## 2. Data — `reports/{id}`

| Field | Type | Notes |
| --- | --- | --- |
| `reporterId` | string | `system` for automatic reports |
| `targetType` | `ReportTargetType` = `listing \| review \| user \| message` | |
| `targetId` | string | For a message: `{threadId}/{msgId}` |
| `targetOwnerId` | string | The user responsible for the target |
| `reason` | `ReportReason` = `broker \| fake_listing \| wrong_info \| scam_payment \| harassment \| spam \| offensive \| discrimination \| other` | |
| `details` | ≤ 1000 | |
| `status` | `ReportStatus` = `open \| actioned \| dismissed` | |
| `priority` | `low \| normal \| high` | `high` for `scam_payment`, `harassment`, and any target with 3 or more open reports |
| `resolution` | `{ action: ModerationAction, note, by, at }?` | |
| `createdAt` | | |

`reportAggregates/{targetType}_{targetId}`: `{ openCount, totalCount }`. Used for priority and the auto-hide threshold.

Indexes: `(status, priority, createdAt)`, `(targetType, targetId, status)`, and `(reporterId, createdAt desc)`.

## 3. Endpoints (user)

| Method | Path | Role | Request | Response | Errors |
| --- | --- | --- | --- | --- | --- |
| POST | `/v1/reports` | any (signed in) | `{ targetType, targetId, reason, details? }` | `201 { id, status }` | `NOT_FOUND` (target), `DUPLICATE_REPORT` (409: same reporter and target while open), `RATE_LIMITED` (10 per day), `CANNOT_REPORT_SELF` |
| GET | `/v1/reports/mine` | any | — | `Page<ReportDto>` (status only, no admin notes) | — |

## 4. Rules

- **Auto-hide threshold:** a review or message with 3 or more open reports from distinct reporters is set to `flagged` or hidden pending review. A listing with 5 or more distinct reports is set to `needsReReview` and goes to high priority. Listings are never auto-suspended, because that would let competitors abuse it.
- Reporters are not told the outcome beyond `actioned` or `dismissed`.
- Automatic reports (from the spam heuristic in 09 and 12) use `reporterId: system`.

## 5. Moderation actions (`ModerationAction`, applied via 14)

`dismiss`, `hide_review`, `restore_review`, `hide_message`, `suspend_listing`, `require_listing_changes`, `warn_user`, `suspend_user (days)`, `ban_user`.

Each action:
- applies the change in the same transaction that resolves the report;
- resolves all other open reports on the same target;
- writes an `auditLogs` entry;
- notifies the affected user, except for `dismiss`.

## 6. Acceptance tests

- Report a listing returns 201. A duplicate open report returns 409. Reporting your own listing returns 400.
- Three reports on a review set it to `flagged`.
- An admin `suspend_listing` sets the listing to `suspended`, removes it from search, resolves all its reports, and creates an audit log entry.

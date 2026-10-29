/**
 * Date/time utilities for the Student Nest app.
 *
 * Timestamps are stored as ISO 8601 UTC strings on the wire and
 * displayed in IST (Asia/Kolkata) to the user.
 */

import { format, formatDistanceToNow, parseISO, isToday, isYesterday } from 'date-fns';
import { TZDate } from '@date-fns/tz';

/** IANA timezone for Indian Standard Time */
export const IST_TIMEZONE = 'Asia/Kolkata';

/** Default display format: "29 Oct 2026, 08:30 PM" */
const DEFAULT_FORMAT = 'dd MMM yyyy, hh:mm a';

/**
 * Format an ISO UTC timestamp in IST.
 *
 * @param isoString  — ISO 8601 UTC timestamp (e.g. from the API)
 * @param formatStr  — date-fns format string (default: `dd MMM yyyy, hh:mm a`)
 * @returns Formatted date string in IST
 *
 * @example
 * formatIST('2026-10-29T14:30:00.000Z')
 * // "29 Oct 2026, 08:00 PM"
 */
export function formatIST(isoString: string, formatStr: string = DEFAULT_FORMAT): string {
  const date = new TZDate(parseISO(isoString), IST_TIMEZONE);
  return format(date, formatStr);
}

/**
 * Format an ISO UTC timestamp as a relative string.
 * Returns "Today", "Yesterday", or a relative distance like "2 hours ago".
 *
 * @example
 * formatRelativeIST('2026-10-29T14:30:00.000Z') // "2 hours ago"
 */
export function formatRelativeIST(isoString: string): string {
  const date = new TZDate(parseISO(isoString), IST_TIMEZONE);

  if (isToday(date)) {
    return formatDistanceToNow(date, { addSuffix: true });
  }

  if (isYesterday(date)) {
    return 'Yesterday';
  }

  return format(date, 'dd MMM yyyy');
}

/**
 * Format a date as a short date string (e.g. "29 Oct").
 */
export function formatDateShort(isoString: string): string {
  return formatIST(isoString, 'dd MMM');
}

/**
 * Format a date as a time-only string (e.g. "08:30 PM").
 */
export function formatTimeIST(isoString: string): string {
  return formatIST(isoString, 'hh:mm a');
}

/**
 * Convert a Date to an ISO 8601 UTC string for the wire.
 */
export function toISOString(date: Date): string {
  return date.toISOString();
}

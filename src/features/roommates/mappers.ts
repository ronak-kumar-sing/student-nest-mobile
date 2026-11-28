import { format, parseISO } from 'date-fns';
import { formatINR, paiseToRupees, rupeesToPaise } from '@/lib/money';
import type {
  RoommateMatchDto,
  RoommateMatchCardViewModel,
  RoommateProfileDto,
  RoommateRequestDto,
  RoommateRequestCardViewModel,
  RoommateWizardFormValues,
  UpsertRoommateProfileDto,
} from './types';

// ─── Slug & String Helpers ──────────────────────────────────────────

/**
 * Convert user string into URL and API slug.
 * "Vijay Nagar" -> "vijay-nagar"
 */
export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Convert slug into human-readable title.
 * "vijay-nagar" -> "Vijay Nagar"
 */
export function slugToTitle(slug: string): string {
  if (!slug) return '';
  return slug
    .split('-')
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
    .join(' ');
}

/**
 * Extract 1-2 character uppercase initials from a name.
 * "Asha V." -> "AV"
 * "Rahul Sharma" -> "RS"
 * "Rahul" -> "R"
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) {
    const first = parts[0]?.charAt(0) ?? '';
    return first ? first.toUpperCase() : '?';
  }
  const first = parts[0]?.charAt(0) ?? '';
  const last = parts[parts.length - 1]?.replace(/[^a-zA-Z]/g, '').charAt(0) ?? '';
  return (first + last).toUpperCase() || '?';
}

// ─── DTO <-> Form Values Mappers ────────────────────────────────────

/**
 * Convert wizard form values into UpsertRoommateProfileDto.
 * Converts rupees to integer paise and trims strings.
 */
export function formValuesToUpsertDto(
  values: RoommateWizardFormValues,
): UpsertRoommateProfileDto {
  return {
    citySlug: slugify(values.citySlug),
    preferredLocalities: values.preferredLocalities.map(slugify).filter(Boolean),
    budgetMinPaise: rupeesToPaise(values.budgetMinRupees),
    budgetMaxPaise: rupeesToPaise(values.budgetMaxRupees),
    moveInBy: values.moveInBy,
    preferredGender: values.preferredGender,
    lifestyle: {
      smoking: Boolean(values.lifestyle.smoking),
      drinking: Boolean(values.lifestyle.drinking),
      pets: Boolean(values.lifestyle.pets),
      diet: values.lifestyle.diet,
      sleepSchedule: values.lifestyle.sleepSchedule,
      cleanliness: values.lifestyle.cleanliness,
      guests: values.lifestyle.guests,
      studyHabits: values.lifestyle.studyHabits,
    },
    bio: values.bio.trim(),
    interests: values.interests,
    ...(values.college && values.college.trim() ? { college: values.college.trim() } : {}),
  };
}

/**
 * Convert RoommateProfileDto into form default values for editing.
 * Converts paise to rupees.
 */
export function profileDtoToFormValues(
  dto: RoommateProfileDto,
): RoommateWizardFormValues {
  return {
    citySlug: dto.citySlug,
    preferredLocalities: [...dto.preferredLocalities],
    budgetMinRupees: Math.round(paiseToRupees(dto.budgetMinPaise)),
    budgetMaxRupees: Math.round(paiseToRupees(dto.budgetMaxPaise)),
    moveInBy: dto.moveInBy,
    preferredGender: dto.preferredGender,
    lifestyle: { ...dto.lifestyle },
    bio: dto.bio,
    interests: [...dto.interests],
    college: dto.college ?? '',
  };
}

// ─── Card View Model Mappers ────────────────────────────────────────

/**
 * Map RoommateMatchDto to card view model.
 */
export function matchDtoToCardViewModel(
  dto: RoommateMatchDto,
): RoommateMatchCardViewModel {
  let moveInLabel = dto.profile.moveInBy;
  try {
    const parsed = parseISO(dto.profile.moveInBy);
    if (!isNaN(parsed.getTime())) {
      moveInLabel = format(parsed, 'dd MMM yyyy');
    }
  } catch {
    // Keep raw string on parsing error
  }

  const clampedScore = Math.max(0, Math.min(100, Math.round(dto.score)));

  return {
    id: dto.profile.id,
    displayName: dto.profile.displayName,
    initials: getInitials(dto.profile.displayName),
    avatarUrl: dto.profile.avatarUrl,
    score: clampedScore,
    budgetLabel: `${formatINR(dto.profile.budgetMinPaise)} – ${formatINR(dto.profile.budgetMaxPaise)}`,
    moveInLabel,
    reasons: dto.reasons.slice(0, 3),
    localities: dto.profile.preferredLocalities.map(slugToTitle),
    cityName: slugToTitle(dto.profile.citySlug),
    gender: dto.profile.gender,
    preferredGender: dto.profile.preferredGender,
    bio: dto.profile.bio,
    interests: dto.profile.interests,
    lifestyle: dto.profile.lifestyle,
    raw: dto,
  };
}

/**
 * Map RoommateRequestDto to card view model based on perspective.
 *
 * Incoming: recipient perspective (fromUid sent to us).
 *   - Revealed contact is contact.from
 *   - Can accept/decline if pending
 * Outgoing: sender perspective (we sent to toUid).
 *   - Revealed contact is contact.to
 *   - Can cancel if pending
 * Contact is null unless status === 'accepted'.
 */
export function requestDtoToCardViewModel(
  dto: RoommateRequestDto,
  direction: 'incoming' | 'outgoing',
): RoommateRequestCardViewModel {
  const isAccepted = dto.status === 'accepted';
  const revealedContact = isAccepted && dto.contact
    ? direction === 'incoming'
      ? dto.contact.from
      : dto.contact.to
    : null;

  const fallbackName =
    revealedContact?.displayName ??
    (direction === 'incoming' ? 'Incoming Student' : 'Outgoing Student');

  const counterpartName = dto.counterpart?.displayName ?? fallbackName;
  const counterpartInitials = getInitials(counterpartName);
  const counterpartAvatarUrl = dto.counterpart?.avatarUrl ?? null;

  return {
    id: dto.id,
    fromUid: dto.fromUid,
    toUid: dto.toUid,
    direction,
    status: dto.status,
    message: dto.message,
    counterpartName,
    counterpartInitials,
    counterpartAvatarUrl,
    canAccept: direction === 'incoming' && dto.status === 'pending',
    canDecline: direction === 'incoming' && dto.status === 'pending',
    canCancel: direction === 'outgoing' && dto.status === 'pending',
    contact: revealedContact,
    createdAt: dto.createdAt,
    expiresAt: dto.expiresAt,
    respondedAt: dto.respondedAt,
    raw: dto,
  };
}

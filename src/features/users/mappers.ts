import type { UserMeDto, ProfileViewModel, UpdateProfileDto } from './types';
import type { ProfileFormValues } from './schemas';

const CITY_NAME_MAP: Record<string, string> = {
  indore: 'Indore',
  bhopal: 'Bhopal',
  pune: 'Pune',
  bengaluru: 'Bengaluru',
};

/**
 * Extracts up to two capital initials from a full name.
 */
export function getInitials(name?: string | null): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return (parts[0]?.[0] ?? '').toUpperCase();
  const first = parts[0]?.[0] ?? '';
  const last = parts[parts.length - 1]?.[0] ?? '';
  return `${first}${last}`.toUpperCase();
}

/**
 * Formats a normalized city slug into a human-readable city name.
 */
export function getCityDisplayName(citySlug?: string | null): string | null {
  if (!citySlug) return null;
  const lower = citySlug.toLowerCase().trim();
  return CITY_NAME_MAP[lower] ?? (lower.charAt(0).toUpperCase() + lower.slice(1));
}

/**
 * Pure mapping from UserMeDto to a UI-friendly ProfileViewModel.
 */
export function userMeToProfileViewModel(dto: UserMeDto): ProfileViewModel {
  const isOwner = dto.role === 'owner';
  const avatarUrl = typeof dto.avatarUrl === 'string' ? dto.avatarUrl : null;
  const kycStatus = dto.kycStatus ?? dto.ownerProfile?.kycStatus ?? 'none';

  return {
    id: dto.id,
    displayName: dto.displayName ?? '',
    initials: getInitials(dto.displayName),
    email: dto.email ?? '',
    phone: dto.phone ?? null,
    phoneVerified: Boolean(dto.phoneVerified),
    role: dto.role,
    college: dto.college ?? null,
    gender: dto.gender ?? null,
    genderLabelKey: dto.gender ? `profile.gender.${dto.gender}` : 'profile.gender.undisclosed',
    city: dto.city ?? null,
    cityDisplayName: getCityDisplayName(dto.city),
    bio: dto.bio ?? null,
    avatarUrl,
    kycStatus,
    ownerStats: isOwner && dto.ownerProfile
      ? {
          listedPropertyCount: dto.ownerProfile.listedPropertyCount ?? 0,
          responseRate: dto.ownerProfile.responseRate ?? null,
          avgResponseMins: dto.ownerProfile.avgResponseMins ?? null,
        }
      : null,
  };
}

/**
 * Converts a UserMeDto into initial values for the profile edit form.
 */
export function profileToFormDefaults(dto?: UserMeDto | null): ProfileFormValues {
  return {
    displayName: dto?.displayName ?? '',
    bio: dto?.bio ?? '',
    gender: dto?.gender ?? 'undisclosed',
    college: dto?.college ?? '',
    city: (dto?.city as ProfileFormValues['city']) ?? '',
  };
}

/**
 * Generates an UpdateProfileDto sending only fields that changed from original.
 * Omits empty strings.
 */
export function toUpdateProfileDto(
  values: ProfileFormValues,
  original?: UserMeDto | null,
): UpdateProfileDto {
  const patch: UpdateProfileDto = {};

  const cleanName = values.displayName.trim();
  const origName = (original?.displayName ?? '').trim();
  if (cleanName && cleanName !== origName) {
    patch.displayName = cleanName;
  }

  const cleanBio = values.bio?.trim() ?? '';
  const origBio = (original?.bio ?? '').trim();
  if (cleanBio !== origBio) {
    if (cleanBio !== '') {
      patch.bio = cleanBio;
    }
  }

  const newGender = values.gender;
  const origGender = original?.gender ?? 'undisclosed';
  if (newGender && newGender !== origGender) {
    patch.gender = newGender;
  }

  const cleanCollege = values.college?.trim() ?? '';
  const origCollege = (original?.college ?? '').trim();
  if (cleanCollege !== origCollege) {
    if (cleanCollege !== '') {
      patch.college = cleanCollege;
    }
  }

  const cleanCity = values.city?.trim() ?? '';
  const origCity = (original?.city ?? '').trim();
  if (cleanCity !== origCity) {
    if (cleanCity !== '') {
      patch.city = cleanCity;
    }
  }

  return patch;
}

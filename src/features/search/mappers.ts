import type { QueryValue } from '@/api/http';
import type { FiltersState } from '@/stores/filters';
import type { RoomCardDto, RoomCardViewModel } from './types';

export const ROOM_TYPE_LABELS: Record<RoomCardDto['roomType'], string> = {
  '1rk': '1 RK',
  '1bhk': '1 BHK',
  '2bhk': '2 BHK',
  '3bhk': '3 BHK',
  pg: 'PG',
  hostel: 'Hostel',
  shared_room: 'Shared room',
};

export const GENDER_POLICY_LABELS: Record<RoomCardDto['genderPolicy'], string> = {
  any: 'Co-ed',
  male_only: 'Boys only',
  female_only: 'Girls only',
};

function titleCase(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function roomCardDtoToViewModel(
  dto: RoomCardDto,
  cityDisplayName?: string,
): RoomCardViewModel {
  const roomTypeLabel = ROOM_TYPE_LABELS[dto.roomType] ?? dto.roomType;
  const genderPolicyLabel = GENDER_POLICY_LABELS[dto.genderPolicy] ?? 'Co-ed';

  const isNew = dto.ratingCount === 0 || dto.ratingAvg === 0;
  const ratingDisplay = isNew ? 'New' : `★ ${dto.ratingAvg.toFixed(1)} (${dto.ratingCount})`;

  return {
    id: dto.id,
    title: dto.title,
    coverImageUrl: dto.coverImageUrl ?? '',
    roomType: dto.roomType,
    roomTypeLabel,
    tenancyType: dto.tenancyType,
    rentPaise: dto.rentPaise,
    depositPaise: dto.depositPaise,
    genderPolicy: dto.genderPolicy,
    genderPolicyLabel,
    locality: dto.locality,
    citySlug: dto.citySlug,
    cityDisplayName: cityDisplayName ?? titleCase(dto.citySlug),
    ratingAvg: dto.ratingAvg,
    ratingCount: dto.ratingCount,
    ratingDisplay,
    availableFrom: dto.availableFrom,
    isFavorite: Boolean(dto.isFavorite),
    distanceKm: dto.distanceKm,
  };
}

const VALID_ROOM_TYPES = new Set(['1rk', '1bhk', '2bhk', '3bhk', 'pg', 'hostel', 'shared_room']);

export function buildSearchParams(
  filters: Pick<
    FiltersState,
    | 'city'
    | 'query'
    | 'budgetMin'
    | 'budgetMax'
    | 'roomTypes'
    | 'genderPolicy'
    | 'amenities'
    | 'foodIncluded'
    | 'availableBy'
    | 'sortBy'
  >,
  citySlug?: string,
): Record<string, QueryValue> {
  const params: Record<string, QueryValue> = {};

  const resolvedCity = citySlug ?? filters.city;
  if (resolvedCity) {
    params.city = resolvedCity.toLowerCase();
  }

  const trimmedQuery = filters.query?.trim();
  if (trimmedQuery) {
    params.q = trimmedQuery;
  }

  if (filters.budgetMin !== null && filters.budgetMin !== undefined && filters.budgetMin > 0) {
    params.minRent = Math.floor(filters.budgetMin / 100);
  }

  if (filters.budgetMax !== null && filters.budgetMax !== undefined && filters.budgetMax > 0) {
    params.maxRent = Math.ceil(filters.budgetMax / 100);
  }

  if (filters.roomTypes && filters.roomTypes.length > 0) {
    const valid = filters.roomTypes.filter((rt) => VALID_ROOM_TYPES.has(rt));
    if (valid.length > 0) {
      params.roomType = valid;
    }
  }

  if (filters.genderPolicy) {
    const policy = filters.genderPolicy.toLowerCase();
    if (policy === 'male' || policy === 'male_only') {
      params.genderPolicy = 'male_only';
    } else if (policy === 'female' || policy === 'female_only') {
      params.genderPolicy = 'female_only';
    } else if (policy === 'co-ed' || policy === 'any') {
      params.genderPolicy = 'any';
    }
  }

  if (filters.foodIncluded === true) {
    params.food = 'included';
  } else if (filters.foodIncluded === false) {
    params.food = 'none';
  }

  if (filters.amenities && filters.amenities.length > 0) {
    params.amenities = filters.amenities;
  }

  if (filters.availableBy) {
    // Standardize to YYYY-MM-DD
    params.availableBy = filters.availableBy.slice(0, 10);
  }

  if (filters.sortBy) {
    switch (filters.sortBy) {
      case 'price_asc':
        params.sort = 'rent_asc';
        break;
      case 'price_desc':
        params.sort = 'rent_desc';
        break;
      case 'rating':
        params.sort = 'rating';
        break;
      case 'newest':
        params.sort = 'newest';
        break;
      case 'relevance':
      default:
        params.sort = 'relevance';
        break;
    }
  }

  return params;
}

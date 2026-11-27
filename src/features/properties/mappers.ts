import { GENDER_POLICY_LABELS, ROOM_TYPE_LABELS } from '@/features/search/mappers';
import type { OwnerListingViewModel, PropertyDetailViewModel, PropertyOwnerDto, PropertyPublicDto } from './types';

export const AMENITY_LABELS: Record<string, string> = {
  wifi: 'WiFi',
  ac: 'Air Conditioning',
  geyser: 'Geyser',
  washing_machine: 'Washing Machine',
  power_backup: 'Power Backup',
  cctv: 'CCTV Security',
  security_guard: 'Security Guard',
  housekeeping: 'Housekeeping',
  gym: 'Fitness Gym',
  study_table: 'Study Table',
  attached_bathroom: 'Attached Bathroom',
  balcony: 'Balcony',
  kitchen: 'Kitchen Access',
  fridge: 'Refrigerator',
  tv: 'Television',
  parking: 'Parking',
  lift: 'Elevator',
};

function getAmenityLabel(slug: string): string {
  if (AMENITY_LABELS[slug]) {
    return AMENITY_LABELS[slug]!;
  }
  return slug
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function propertyPublicDtoToViewModel(dto: PropertyPublicDto): PropertyDetailViewModel {
  const roomTypeLabel = ROOM_TYPE_LABELS[dto.roomType] ?? dto.roomType;
  const genderPolicyLabel = GENDER_POLICY_LABELS[dto.genderPolicy] ?? 'Co-ed';

  const isNew = dto.ratingCount === 0 || dto.ratingAvg === 0;
  const ratingDisplay = isNew ? 'New' : `★ ${dto.ratingAvg.toFixed(1)} (${dto.ratingCount})`;

  const amenities = (dto.amenities ?? []).map((slug) => ({
    slug,
    label: getAmenityLabel(slug),
  }));

  const owner = dto.owner
    ? {
        id: dto.owner.id,
        displayName: dto.owner.displayName,
        avatarUrl: null,
        memberSince: dto.owner.memberSince,
        verified: Boolean(dto.owner.ownerBadge?.verified),
        responseRate: dto.owner.ownerBadge?.responseRate,
      }
    : undefined;

  // Address reveal rule: line1 and line2 only shown when addressRevealed is true
  const address = {
    locality: dto.address.locality,
    city: dto.address.city,
    citySlug: dto.address.citySlug,
    state: dto.address.state,
    pincode: dto.address.pincode,
    line1: dto.addressRevealed ? dto.address.line1 : undefined,
    line2: dto.addressRevealed ? dto.address.line2 : undefined,
  };

  return {
    id: dto.id,
    status: dto.status,
    title: dto.title,
    description: dto.description,
    roomType: dto.roomType,
    roomTypeLabel,
    tenancyType: dto.tenancyType,
    capacity: dto.capacity,
    availableSlots: dto.availableSlots,
    genderPolicy: dto.genderPolicy,
    genderPolicyLabel,
    rentPaise: dto.rentPaise,
    depositPaise: dto.depositPaise ?? dto.rentPaise * 2,
    maintenancePaise: dto.maintenancePaise ?? 0,
    billsIncluded: dto.billsIncluded ?? [],
    foodIncluded: dto.foodIncluded,
    nearby: dto.nearby ?? [],
    amenities,
    houseRules: dto.houseRules,
    minStayMonths: dto.minStayMonths,
    noticePeriodDays: dto.noticePeriodDays,
    availableFrom: dto.availableFrom,
    images: dto.images ?? [],
    ratingAvg: dto.ratingAvg,
    ratingCount: dto.ratingCount,
    ratingDisplay,
    address,
    addressRevealed: dto.addressRevealed,
    owner,
    isFavorite: Boolean(dto.isFavorite),
  };
}

export function propertyOwnerDtoToViewModel(dto: PropertyOwnerDto): OwnerListingViewModel {
  const roomTypeLabel = ROOM_TYPE_LABELS[dto.roomType] ?? dto.roomType;
  const isNew = dto.ratingCount === 0 || dto.ratingAvg === 0;
  const ratingDisplay = isNew ? 'New' : `★ ${dto.ratingAvg.toFixed(1)} (${dto.ratingCount})`;

  return {
    id: dto.id,
    status: dto.status,
    title: dto.title,
    roomType: dto.roomType,
    roomTypeLabel,
    rentPaise: dto.rentPaise,
    depositPaise: dto.depositPaise,
    locality: dto.address.locality,
    city: dto.address.city,
    images: dto.images ?? [],
    ratingAvg: dto.ratingAvg,
    ratingCount: dto.ratingCount,
    ratingDisplay,
    stats: dto.stats,
  };
}

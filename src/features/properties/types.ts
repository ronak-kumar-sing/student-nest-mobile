import type { Schemas } from '@/api/http/types';

export type PropertyPublicDto = Schemas['PropertyPublicDto'];
export type PropertyOwnerDto = Schemas['PropertyOwnerDto'];

export interface PropertyDetailViewModel {
  id: string;
  status: PropertyPublicDto['status'];
  title: string;
  description?: string;
  roomType: PropertyPublicDto['roomType'];
  roomTypeLabel: string;
  tenancyType: PropertyPublicDto['tenancyType'];
  capacity: number;
  availableSlots: number;
  genderPolicy: PropertyPublicDto['genderPolicy'];
  genderPolicyLabel: string;
  rentPaise: number;
  depositPaise: number;
  maintenancePaise: number;
  billsIncluded: string[];
  foodIncluded: string;
  nearby: { name: string; kind: 'college' | 'metro' | 'bus' | 'market'; distanceKm: number }[];
  amenities: { slug: string; label: string }[];
  houseRules: {
    smoking: boolean;
    drinking: boolean;
    pets: boolean;
    visitors: boolean;
    nonVeg: boolean;
    curfew?: string;
  };
  minStayMonths: number;
  noticePeriodDays: number;
  availableFrom?: string;
  images: { url: string; order: number; isCover: boolean; blurhash?: string }[];
  ratingAvg: number;
  ratingCount: number;
  ratingDisplay: string;
  address: {
    locality: string;
    city: string;
    citySlug: string;
    state: string;
    pincode: string;
    line1?: string;
    line2?: string;
  };
  addressRevealed: boolean;
  owner?: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    memberSince: string;
    verified: boolean;
    responseRate?: number;
  };
  isFavorite: boolean;
}

export interface OwnerListingViewModel {
  id: string;
  status: PropertyOwnerDto['status'];
  title: string;
  roomType: PropertyOwnerDto['roomType'];
  roomTypeLabel: string;
  rentPaise: number;
  depositPaise?: number;
  locality: string;
  city: string;
  images: { url: string; order: number; isCover: boolean }[];
  ratingAvg: number;
  ratingCount: number;
  ratingDisplay: string;
  stats?: PropertyOwnerDto['stats'];
}

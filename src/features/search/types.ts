import type { Schemas } from '@/api/http/types';

export type RoomCardDto = Schemas['RoomCardDto'];
export type CityDto = Schemas['CityDto'];

export interface RoomCardViewModel {
  id: string;
  title: string;
  coverImageUrl: string;
  roomType: RoomCardDto['roomType'];
  roomTypeLabel: string;
  tenancyType: RoomCardDto['tenancyType'];
  rentPaise: number;
  depositPaise: number;
  genderPolicy: RoomCardDto['genderPolicy'];
  genderPolicyLabel: string;
  locality: string;
  citySlug: string;
  cityDisplayName: string;
  ratingAvg: number;
  ratingCount: number;
  ratingDisplay: string;
  availableFrom: string;
  isFavorite: boolean;
  distanceKm?: number;
}

export interface CityViewModel {
  slug: string;
  name: string;
  state: string;
  listingCount: number;
}

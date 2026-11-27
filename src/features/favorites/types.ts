import type { Schemas } from '@/api/http/types';

export type FavoriteCardDto = Schemas['FavoriteCardDto'];

export interface FavoriteCardViewModel {
  id: string;
  title: string;
  coverImageUrl: string;
  roomType: FavoriteCardDto['roomType'];
  roomTypeLabel: string;
  rentPaise: number;
  locality: string;
  citySlug: string;
  cityDisplayName: string;
  available: boolean;
  savedAt: string;
  ratingAvg?: number;
  ratingCount?: number;
  ratingDisplay: string;
  isFavorite: boolean;
}

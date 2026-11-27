import { ROOM_TYPE_LABELS } from '@/features/search/mappers';
import type { FavoriteCardDto, FavoriteCardViewModel } from './types';

function titleCase(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function favoriteCardDtoToViewModel(dto: FavoriteCardDto): FavoriteCardViewModel {
  const roomTypeLabel = ROOM_TYPE_LABELS[dto.roomType] ?? dto.roomType;
  const isNew = !dto.ratingCount || !dto.ratingAvg;
  const ratingDisplay = isNew ? 'New' : `★ ${dto.ratingAvg!.toFixed(1)} (${dto.ratingCount})`;

  return {
    id: dto.id,
    title: dto.title,
    coverImageUrl: dto.coverImageUrl ?? '',
    roomType: dto.roomType,
    roomTypeLabel,
    rentPaise: dto.rentPaise,
    locality: dto.locality,
    citySlug: dto.citySlug,
    cityDisplayName: titleCase(dto.citySlug),
    available: dto.available,
    savedAt: dto.savedAt,
    ratingAvg: dto.ratingAvg,
    ratingCount: dto.ratingCount,
    ratingDisplay,
    isFavorite: true,
  };
}

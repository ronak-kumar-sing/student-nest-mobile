import { ROOM_TYPE_LABELS } from '@/features/search/mappers';
import type { BookingDto, BookingViewModel } from './types';

export const BOOKING_STATUS_LABELS: Record<BookingDto['status'], string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  expired: 'Expired',
  cancelled: 'Cancelled',
  checked_in: 'Checked In',
  completed: 'Completed',
};

export function bookingDtoToViewModel(dto: BookingDto): BookingViewModel {
  const statusLabel = BOOKING_STATUS_LABELS[dto.status] ?? dto.status;
  const roomTypeLabel =
    ROOM_TYPE_LABELS[dto.property.roomType as keyof typeof ROOM_TYPE_LABELS] ??
    dto.property.roomType;

  const history = dto.history.map((h) => ({
    status: h.status,
    statusLabel:
      BOOKING_STATUS_LABELS[h.status as keyof typeof BOOKING_STATUS_LABELS] ??
      h.status.replace(/_/g, ' '),
    at: h.at,
    by: h.by,
    note: h.note,
  }));

  const address = dto.property.address
    ? {
        locality: dto.property.address.locality,
        city: dto.property.address.city,
        citySlug: dto.property.address.citySlug,
        state: dto.property.address.state,
        pincode: dto.property.address.pincode,
        line1: dto.property.address.line1,
        line2: dto.property.address.line2,
      }
    : undefined;

  return {
    id: dto.id,
    status: dto.status,
    statusLabel,
    propertyId: dto.propertyId,
    propertyTitle: dto.property.title,
    coverImage: dto.property.coverImage,
    locality: dto.property.locality,
    citySlug: dto.property.citySlug,
    roomType: dto.property.roomType,
    roomTypeLabel,
    moveInDate: dto.moveInDate,
    durationMonths: dto.durationMonths,
    endDate: dto.endDate,
    occupants: dto.occupants,
    agreedRentPaise: dto.agreedRentPaise,
    agreedDepositPaise: dto.agreedDepositPaise,
    message: dto.message,
    history,
    expiresAt: dto.expiresAt,
    createdAt: dto.createdAt,
    contact: dto.contact,
    address,
  };
}

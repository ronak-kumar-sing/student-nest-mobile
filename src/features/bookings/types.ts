import type { Schemas } from '@/api/http/types';

export type BookingDto = Schemas['BookingDto'];
export type CreateBookingDto = Schemas['CreateBookingDto'];
export type BookingActionDto = Schemas['BookingActionDto'];

export interface BookingViewModel {
  id: string;
  status: BookingDto['status'];
  statusLabel: string;
  propertyId: string;
  propertyTitle: string;
  coverImage: string;
  locality: string;
  citySlug: string;
  roomType: string;
  roomTypeLabel: string;
  moveInDate: string;
  durationMonths: number;
  endDate: string;
  occupants: number;
  agreedRentPaise: number;
  agreedDepositPaise: number;
  message?: string;
  history: {
    status: string;
    statusLabel: string;
    at: string;
    by: string;
    note?: string;
  }[];
  expiresAt: string;
  createdAt: string;
  contact?: {
    name: string;
    phone?: string;
    email?: string;
  };
  address?: {
    locality: string;
    city: string;
    citySlug: string;
    state: string;
    pincode: string;
    line1?: string;
    line2?: string;
  };
}

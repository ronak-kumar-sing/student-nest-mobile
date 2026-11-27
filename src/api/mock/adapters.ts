/**
 * Mock-to-DTO adapters for Student Nest Mobile.
 *
 * Bridges the in-memory mock DB types (MockProperty, MockBooking, MockUser)
 * into strict OpenAPI DTO schemas (RoomCardDto, PropertyPublicDto, PropertyOwnerDto,
 * FavoriteCardDto, BookingDto).
 */

import type { Schemas } from '@/api/http/types';
import { getDB, type MockBooking, type MockProperty, type MockUser } from './db';
import { useSessionStore } from '@/stores/session';

export type RoomCardDto = Schemas['RoomCardDto'];
export type PropertyPublicDto = Schemas['PropertyPublicDto'];
export type PropertyOwnerDto = Schemas['PropertyOwnerDto'];
export type FavoriteCardDto = Schemas['FavoriteCardDto'];
export type BookingDto = Schemas['BookingDto'];
export type CityDto = Schemas['CityDto'];

// ─── Enums & Value Mapping ──────────────────────────────────────────

export type ApiRoomType = RoomCardDto['roomType'];
export type ApiTenancyType = RoomCardDto['tenancyType'];
export type ApiGenderPolicy = RoomCardDto['genderPolicy'];
export type ApiAmenity = NonNullable<Schemas['CreatePropertyDto']['amenities']>[number];

export function adaptRoomType(rawType: string): ApiRoomType {
  switch (rawType.toLowerCase()) {
    case 'single_room':
    case '1rk':
      return '1rk';
    case '1bhk':
      return '1bhk';
    case 'flat':
    case '2bhk':
      return '2bhk';
    case '3bhk':
      return '3bhk';
    case 'pg':
      return 'pg';
    case 'hostel':
      return 'hostel';
    case 'double_sharing':
    case 'triple_sharing':
    case 'shared_room':
      return 'shared_room';
    default:
      return '1rk';
  }
}

export function adaptTenancyType(roomType: ApiRoomType): ApiTenancyType {
  if (roomType === 'shared_room' || roomType === 'pg' || roomType === 'hostel') {
    return 'per_bed';
  }
  return 'whole_unit';
}

export function adaptGenderPolicy(rawPolicy: string): ApiGenderPolicy {
  switch (rawPolicy.toLowerCase()) {
    case 'male':
    case 'male_only':
      return 'male_only';
    case 'female':
    case 'female_only':
      return 'female_only';
    case 'unisex':
    case 'co-ed':
    case 'any':
    default:
      return 'any';
  }
}

const AMENITY_NAME_TO_SLUG: Record<string, ApiAmenity> = {
  WiFi: 'wifi',
  wifi: 'wifi',
  AC: 'ac',
  ac: 'ac',
  Geyser: 'geyser',
  geyser: 'geyser',
  'Power Backup': 'power_backup',
  power_backup: 'power_backup',
  'Washing Machine': 'washing_machine',
  washing_machine: 'washing_machine',
  CCTV: 'cctv',
  cctv: 'cctv',
  'Attached Washroom': 'attached_bathroom',
  attached_bathroom: 'attached_bathroom',
  Balcony: 'balcony',
  balcony: 'balcony',
  'Cleaning Service': 'housekeeping',
  housekeeping: 'housekeeping',
  'Security Guard': 'security_guard',
  security_guard: 'security_guard',
  'Biometric Entry': 'security_guard',
  Fridge: 'fridge',
  fridge: 'fridge',
  TV: 'tv',
  tv: 'tv',
  Parking: 'parking',
  parking: 'parking',
  Lift: 'lift',
  lift: 'lift',
  Gym: 'gym',
  gym: 'gym',
  'Study Table': 'study_table',
  study_table: 'study_table',
  Kitchen: 'kitchen',
  kitchen: 'kitchen',
};

export function adaptAmenities(rawAmenities: string[]): ApiAmenity[] {
  const result = new Set<ApiAmenity>();
  for (const item of rawAmenities) {
    const slug = AMENITY_NAME_TO_SLUG[item];
    if (slug) {
      result.add(slug);
    }
  }
  return Array.from(result);
}

// ─── Current User Helper ────────────────────────────────────────────

export function getMockCurrentUserId(preferredRole: 'student' | 'owner' = 'student'): string {
  const user = useSessionStore.getState().user;
  const db = getDB();
  if (user && db.users.some((u) => u.id === user.id)) {
    return user.id;
  }
  return preferredRole === 'owner' ? 'owner-1' : 'student-1';
}

function checkAddressRevealed(property: MockProperty, currentUserId: string): boolean {
  if (property.ownerId === currentUserId) {
    return true;
  }
  const db = getDB();
  const hasApprovedBooking = db.bookings.some(
    (b) =>
      b.propertyId === property.id &&
      b.studentId === currentUserId &&
      (b.status === 'approved' || b.status === 'checked_in' || b.status === 'completed'),
  );
  return hasApprovedBooking;
}

// ─── Geo & Coordinates ──────────────────────────────────────────────

const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  indore: { lat: 22.7196, lng: 75.8577 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  pune: { lat: 18.5204, lng: 73.8567 },
};

function getPublicLocation(citySlug: string): { lat: number; lng: number } {
  const base = CITY_COORDINATES[citySlug] ?? { lat: 22.7196, lng: 75.8577 };
  // Fuzzed slightly (200-400m)
  return {
    lat: Number((base.lat + 0.0025).toFixed(4)),
    lng: Number((base.lng + 0.0025).toFixed(4)),
  };
}

// ─── Adapters ───────────────────────────────────────────────────────

export function mockUserToPublicUserDto(user: MockUser | undefined): Schemas['PublicUserDto'] | undefined {
  if (!user) return undefined;
  return {
    id: user.id,
    displayName: user.displayName,
    avatarUrl: (user.avatarUrl ? (user.avatarUrl as unknown as Record<string, never>) : null),
    role: user.role,
    memberSince: '2026-01-01T00:00:00.000Z',
    ownerBadge:
      user.role === 'owner'
        ? {
            verified: user.isVerified,
            responseRate: 0.95,
          }
        : undefined,
  };
}

export function mockPropertyToRoomCardDto(
  property: MockProperty,
  isFavoriteOverride?: boolean,
): RoomCardDto {
  const db = getDB();
  const citySlug = property.city.toLowerCase();
  const roomType = adaptRoomType(property.roomType);
  const tenancyType = adaptTenancyType(roomType);
  const genderPolicy = adaptGenderPolicy(property.genderPolicy);
  const isFavorite = isFavoriteOverride ?? db.favorites.includes(property.id);

  return {
    id: property.id,
    title: property.title,
    coverImageUrl: property.images[0] ?? '',
    roomType,
    tenancyType,
    rentPaise: property.rentPaise,
    depositPaise: property.depositPaise,
    genderPolicy,
    locality: property.locality,
    citySlug,
    publicLocation: getPublicLocation(citySlug),
    ratingAvg: property.rating,
    ratingCount: property.reviewCount,
    availableFrom: '2026-11-01T00:00:00.000Z',
    isFavorite,
  };
}

export function mockPropertyToPublicDto(
  property: MockProperty,
  currentUserId: string = getMockCurrentUserId('student'),
): PropertyPublicDto {
  const db = getDB();
  const citySlug = property.city.toLowerCase();
  const roomType = adaptRoomType(property.roomType);
  const tenancyType = adaptTenancyType(roomType);
  const genderPolicy = adaptGenderPolicy(property.genderPolicy);
  const isFavorite = db.favorites.includes(property.id);
  const addressRevealed = checkAddressRevealed(property, currentUserId);
  const owner = db.users.find((u) => u.id === property.ownerId);

  // billsPaise > 0 approximates billsIncluded: [] (tenant pays bills separately),
  // whereas billsPaise === 0 means electricity and water are included in rent.
  const billsIncluded: ('electricity' | 'water' | 'wifi' | 'gas')[] =
    property.billsPaise > 0 ? [] : ['electricity', 'water'];

  const nearby: Schemas['NearbyPlaceViewDto'][] = (property.nearbyColleges ?? []).map((name) => ({
    name,
    kind: 'college',
    distanceKm: 1.2,
  }));

  const images: Schemas['PropertyImageViewDto'][] = property.images.map((url, index) => ({
    url,
    order: index,
    isCover: index === 0,
  }));

  const publicLocation = getPublicLocation(citySlug);
  const exactLocation = { lat: 22.721, lng: 75.859 };

  return {
    id: property.id,
    status: property.status as PropertyPublicDto['status'],
    title: property.title,
    description: `Spacious ${property.roomType.replace('_', ' ')} in ${property.locality}, ${property.city}. Fully furnished with modern amenities and peaceful neighborhood.`,
    roomType,
    tenancyType,
    capacity: 2,
    availableSlots: 1,
    genderPolicy,
    rentPaise: property.rentPaise,
    depositPaise: property.depositPaise,
    maintenancePaise: property.maintenancePaise,
    billsIncluded,
    foodIncluded: 'none',
    nearby,
    amenities: adaptAmenities(property.amenities),
    houseRules: {
      smoking: false,
      drinking: false,
      pets: false,
      visitors: true,
      nonVeg: true,
      curfew: '22:30',
    },
    minStayMonths: 6,
    noticePeriodDays: 30,
    availableFrom: '2026-11-01T00:00:00.000Z',
    images,
    ratingAvg: property.rating,
    ratingCount: property.reviewCount,
    publishedAt: '2026-10-01T00:00:00.000Z',
    createdAt: '2026-09-15T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    address: {
      locality: property.locality,
      city: property.city,
      citySlug,
      state: 'Madhya Pradesh',
      pincode: '452010',
      line1: addressRevealed ? property.address : undefined,
    },
    publicLocation,
    exactLocation: addressRevealed ? exactLocation : undefined,
    addressRevealed,
    owner: mockUserToPublicUserDto(owner),
    isFavorite,
  };
}

export function mockPropertyToOwnerDto(property: MockProperty): PropertyOwnerDto {
  const publicDto = mockPropertyToPublicDto(property, property.ownerId);
  const location = { lat: 22.721, lng: 75.859 };

  return {
    ...publicDto,
    ownerId: property.ownerId,
    location,
    showWhenFull: false,
    needsReReview: false,
    searchVersion: 1,
    stats: {
      views: 142,
      favorites: 18,
      inquiries: 6,
      tours: 4,
      bookingRequests: 3,
      bookings: 1,
    },
  };
}

export function mockPropertyToFavoriteCardDto(
  property: MockProperty,
  savedAt: string = '2026-10-28T12:00:00.000Z',
): FavoriteCardDto {
  const citySlug = property.city.toLowerCase();
  const roomType = adaptRoomType(property.roomType);
  const tenancyType = adaptTenancyType(roomType);
  const genderPolicy = adaptGenderPolicy(property.genderPolicy);
  const available = property.status === 'published';

  return {
    id: property.id,
    title: property.title,
    coverImageUrl: property.images[0] ?? '',
    roomType,
    tenancyType,
    rentPaise: property.rentPaise,
    depositPaise: property.depositPaise,
    genderPolicy,
    locality: property.locality,
    citySlug,
    available,
    savedAt,
    publicLocation: getPublicLocation(citySlug),
    ratingAvg: property.rating,
    ratingCount: property.reviewCount,
    availableFrom: '2026-11-01T00:00:00.000Z',
    isFavorite: true,
  };
}

export function mockBookingToBookingDto(booking: MockBooking): BookingDto {
  const db = getDB();
  const property = db.properties.find((p) => p.id === booking.propertyId);
  const owner = db.users.find((u) => u.id === booking.ownerId);
  const citySlug = property ? property.city.toLowerCase() : 'indore';
  const roomType = property ? adaptRoomType(property.roomType) : '1rk';

  const isApproved =
    booking.status === 'approved' ||
    booking.status === 'checked_in' ||
    booking.status === 'completed';

  const bookingProperty: Schemas['BookingPropertyDto'] = {
    id: booking.propertyId,
    title: property?.title ?? 'Student Room',
    coverImage: property?.images[0] ?? '',
    locality: property?.locality ?? 'Vijay Nagar',
    citySlug,
    roomType,
    address: isApproved
      ? {
          locality: property?.locality ?? 'Vijay Nagar',
          city: property?.city ?? 'Indore',
          citySlug,
          state: 'Madhya Pradesh',
          pincode: '452010',
          line1: property?.address ?? 'House #100, Vijay Nagar',
        }
      : undefined,
    exactLocation: isApproved ? { lat: 22.721, lng: 75.859 } : undefined,
  };

  const contact: Schemas['BookingContactDto'] | undefined = isApproved
    ? {
        name: owner?.displayName ?? 'Amit Kumar',
        phone: owner?.phone ?? '+919876543212',
        email: owner?.email ?? 'owner@example.com',
      }
    : undefined;

  const history: Schemas['BookingHistoryEntryDto'][] = booking.history.map((h) => ({
    status: h.status as Schemas['BookingHistoryEntryDto']['status'],
    at: h.at,
    by: h.by,
    note: h.note,
  }));

  // moveInDate in MockBooking may be full ISO, DTO expects date only: YYYY-MM-DD
  const moveInDateFormatted = booking.moveInDate.slice(0, 10);
  const endDateFormatted = '2027-05-15';

  return {
    id: booking.id,
    status: booking.status as BookingDto['status'],
    propertyId: booking.propertyId,
    studentId: booking.studentId,
    ownerId: booking.ownerId,
    property: bookingProperty,
    moveInDate: moveInDateFormatted,
    durationMonths: booking.durationMonths,
    endDate: endDateFormatted,
    occupants: booking.occupants,
    agreedRentPaise: booking.agreedRentPaise,
    agreedDepositPaise: booking.agreedRentPaise * 2,
    history,
    expiresAt: '2026-11-01T10:00:00.000Z',
    createdAt: booking.createdAt,
    updatedAt: booking.createdAt,
    contact,
  };
}

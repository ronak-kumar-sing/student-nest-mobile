import {
  adaptAmenities,
  adaptGenderPolicy,
  adaptRoomType,
  adaptTenancyType,
  mockPropertyToRoomCardDto,
} from '@/api/mock/adapters';
import type { MockProperty } from '@/api/mock/db';

describe('mock adapters', () => {
  it('correctly maps roomType strings to API enums', () => {
    expect(adaptRoomType('single_room')).toBe('1rk');
    expect(adaptRoomType('1rk')).toBe('1rk');
    expect(adaptRoomType('1bhk')).toBe('1bhk');
    expect(adaptRoomType('flat')).toBe('2bhk');
    expect(adaptRoomType('2bhk')).toBe('2bhk');
    expect(adaptRoomType('3bhk')).toBe('3bhk');
    expect(adaptRoomType('pg')).toBe('pg');
    expect(adaptRoomType('hostel')).toBe('hostel');
    expect(adaptRoomType('double_sharing')).toBe('shared_room');
    expect(adaptRoomType('triple_sharing')).toBe('shared_room');
    expect(adaptRoomType('unknown_type')).toBe('1rk');
  });

  it('maps tenancyType from roomType', () => {
    expect(adaptTenancyType('shared_room')).toBe('per_bed');
    expect(adaptTenancyType('pg')).toBe('per_bed');
    expect(adaptTenancyType('hostel')).toBe('per_bed');
    expect(adaptTenancyType('1rk')).toBe('whole_unit');
    expect(adaptTenancyType('1bhk')).toBe('whole_unit');
    expect(adaptTenancyType('2bhk')).toBe('whole_unit');
  });

  it('maps genderPolicy strings to API enums', () => {
    expect(adaptGenderPolicy('male')).toBe('male_only');
    expect(adaptGenderPolicy('male_only')).toBe('male_only');
    expect(adaptGenderPolicy('female')).toBe('female_only');
    expect(adaptGenderPolicy('female_only')).toBe('female_only');
    expect(adaptGenderPolicy('unisex')).toBe('any');
    expect(adaptGenderPolicy('co-ed')).toBe('any');
    expect(adaptGenderPolicy('any')).toBe('any');
  });

  it('maps amenity display names to API slugs', () => {
    const raw = ['WiFi', 'AC', 'Power Backup', 'Washing Machine', 'Geyser', 'CCTV'];
    const slugs = adaptAmenities(raw);

    expect(slugs).toContain('wifi');
    expect(slugs).toContain('ac');
    expect(slugs).toContain('power_backup');
    expect(slugs).toContain('washing_machine');
    expect(slugs).toContain('geyser');
    expect(slugs).toContain('cctv');
  });

  it('adapts MockProperty to RoomCardDto without loss', () => {
    const mockProp: MockProperty = {
      id: 'property-1',
      title: 'SINGLE ROOM in Vijay Nagar, Indore',
      rentPaise: 850000,
      depositPaise: 1700000,
      maintenancePaise: 50000,
      billsPaise: 0,
      city: 'Indore',
      locality: 'Vijay Nagar',
      address: 'House #100, Vijay Nagar',
      roomType: 'single_room',
      genderPolicy: 'male',
      status: 'published',
      ownerId: 'owner-1',
      images: ['https://example.com/p1.jpg'],
      amenities: ['WiFi', 'AC'],
      rating: 4.5,
      reviewCount: 12,
      nearbyColleges: ['IET-DAVV'],
    };

    const card = mockPropertyToRoomCardDto(mockProp, false);

    expect(card.id).toBe('property-1');
    expect(card.roomType).toBe('1rk');
    expect(card.tenancyType).toBe('whole_unit');
    expect(card.genderPolicy).toBe('male_only');
    expect(card.citySlug).toBe('indore');
    expect(card.rentPaise).toBe(850000);
    expect(card.coverImageUrl).toBe('https://example.com/p1.jpg');
    expect(card.isFavorite).toBe(false);
  });
});

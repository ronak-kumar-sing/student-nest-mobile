import { propertyPublicDtoToViewModel } from '@/features/properties/mappers';
import type { PropertyPublicDto } from '@/features/properties/types';

describe('property mappers', () => {
  const baseDto: PropertyPublicDto = {
    id: 'prop-101',
    status: 'published',
    title: 'Spacious 2 BHK near IIT',
    description: 'A great flat for students.',
    roomType: '2bhk',
    tenancyType: 'whole_unit',
    capacity: 4,
    availableSlots: 2,
    genderPolicy: 'any',
    rentPaise: 1800000,
    depositPaise: 3600000,
    maintenancePaise: 50000,
    billsIncluded: ['electricity', 'water'],
    foodIncluded: 'none',
    nearby: [{ name: 'IIT Indore', kind: 'college', distanceKm: 0.8 }],
    amenities: ['wifi', 'ac', 'power_backup'],
    houseRules: {
      smoking: false,
      drinking: false,
      pets: false,
      visitors: true,
      nonVeg: true,
    },
    minStayMonths: 6,
    noticePeriodDays: 30,
    availableFrom: '2026-11-01T00:00:00.000Z',
    images: [{ url: 'https://example.com/img1.jpg', order: 0, isCover: true }],
    ratingAvg: 4.8,
    ratingCount: 15,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    address: {
      locality: 'Simrol',
      city: 'Indore',
      citySlug: 'indore',
      state: 'Madhya Pradesh',
      pincode: '453552',
      line1: 'House 42, Campus View',
      line2: 'Opposite Main Gate',
    },
    publicLocation: { lat: 22.52, lng: 75.92 },
    addressRevealed: false,
    owner: {
      id: 'owner-1',
      displayName: 'Rajesh Verma',
      avatarUrl: null,
      role: 'owner',
      memberSince: '2026-01-01T00:00:00.000Z',
      ownerBadge: { verified: true, responseRate: 0.94 },
    },
    isFavorite: false,
  };

  it('hides address line1 and line2 when addressRevealed is false', () => {
    const vm = propertyPublicDtoToViewModel({
      ...baseDto,
      addressRevealed: false,
    });

    expect(vm.addressRevealed).toBe(false);
    expect(vm.address.line1).toBeUndefined();
    expect(vm.address.line2).toBeUndefined();
    expect(vm.address.locality).toBe('Simrol');
    expect(vm.address.city).toBe('Indore');
  });

  it('reveals address line1 and line2 when addressRevealed is true', () => {
    const vm = propertyPublicDtoToViewModel({
      ...baseDto,
      addressRevealed: true,
    });

    expect(vm.addressRevealed).toBe(true);
    expect(vm.address.line1).toBe('House 42, Campus View');
    expect(vm.address.line2).toBe('Opposite Main Gate');
  });

  it('keeps monetary values as integer paise', () => {
    const vm = propertyPublicDtoToViewModel(baseDto);

    expect(vm.rentPaise).toBe(1800000);
    expect(vm.depositPaise).toBe(3600000);
    expect(vm.maintenancePaise).toBe(50000);
  });

  it('maps amenities to readable label objects', () => {
    const vm = propertyPublicDtoToViewModel(baseDto);

    expect(vm.amenities).toEqual([
      { slug: 'wifi', label: 'WiFi' },
      { slug: 'ac', label: 'Air Conditioning' },
      { slug: 'power_backup', label: 'Power Backup' },
    ]);
  });
});

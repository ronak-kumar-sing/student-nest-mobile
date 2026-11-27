import { buildSearchParams, roomCardDtoToViewModel } from '@/features/search/mappers';
import type { RoomCardDto } from '@/features/search/types';

describe('search mappers', () => {
  describe('buildSearchParams', () => {
    it('rounds paise to rupees correctly (min floor, max ceil)', () => {
      const params = buildSearchParams({
        city: 'indore',
        query: '',
        budgetMin: 855050, // 8550.50 rupees -> floor 8550
        budgetMax: 1200025, // 12000.25 rupees -> ceil 12001
        roomTypes: [],
        genderPolicy: null,
        amenities: [],
        foodIncluded: null,
        availableBy: null,
        sortBy: 'relevance',
      });

      expect(params['minRent']).toBe(8550);
      expect(params['maxRent']).toBe(12001);
    });

    it('maps gender policy, food, and sort options correctly', () => {
      const params = buildSearchParams({
        city: 'bengaluru',
        query: 'Koramangala',
        budgetMin: null,
        budgetMax: null,
        roomTypes: ['1bhk', '2bhk', 'invalid_type'],
        genderPolicy: 'male',
        amenities: ['wifi', 'ac'],
        foodIncluded: true,
        availableBy: '2026-12-01T00:00:00.000Z',
        sortBy: 'price_asc',
      });

      expect(params['city']).toBe('bengaluru');
      expect(params['q']).toBe('Koramangala');
      expect(params['genderPolicy']).toBe('male_only');
      expect(params['food']).toBe('included');
      expect(params['sort']).toBe('rent_asc');
      expect(params['roomType']).toEqual(['1bhk', '2bhk']);
      expect(params['amenities']).toEqual(['wifi', 'ac']);
      expect(params['availableBy']).toBe('2026-12-01');
    });

    it('omits empty, null, and default values', () => {
      const params = buildSearchParams({
        city: null,
        query: '   ',
        budgetMin: null,
        budgetMax: null,
        roomTypes: [],
        genderPolicy: null,
        amenities: [],
        foodIncluded: null,
        availableBy: null,
        sortBy: 'relevance',
      });

      expect(params['city']).toBeUndefined();
      expect(params['q']).toBeUndefined();
      expect(params['minRent']).toBeUndefined();
      expect(params['maxRent']).toBeUndefined();
      expect(params['roomType']).toBeUndefined();
      expect(params['genderPolicy']).toBeUndefined();
      expect(params['food']).toBeUndefined();
    });
  });

  describe('roomCardDtoToViewModel', () => {
    const baseDto: RoomCardDto = {
      id: 'prop-1',
      title: 'Cozy Room in Palasia',
      coverImageUrl: 'https://example.com/cover.jpg',
      roomType: '1rk',
      tenancyType: 'whole_unit',
      rentPaise: 800000,
      depositPaise: 1600000,
      genderPolicy: 'male_only',
      locality: 'Palasia',
      citySlug: 'indore',
      publicLocation: { lat: 22.72, lng: 75.86 },
      ratingAvg: 4.5,
      ratingCount: 10,
      availableFrom: '2026-11-01T00:00:00.000Z',
      isFavorite: true,
    };

    it('maps room type labels and rating properly', () => {
      const vm = roomCardDtoToViewModel(baseDto, 'Indore');

      expect(vm.roomTypeLabel).toBe('1 RK');
      expect(vm.genderPolicyLabel).toBe('Boys only');
      expect(vm.ratingDisplay).toBe('★ 4.5 (10)');
      expect(vm.cityDisplayName).toBe('Indore');
      expect(vm.isFavorite).toBe(true);
    });

    it('displays "New" when ratingCount or ratingAvg is 0', () => {
      const newListingDto: RoomCardDto = {
        ...baseDto,
        ratingAvg: 0,
        ratingCount: 0,
      };

      const vm = roomCardDtoToViewModel(newListingDto);
      expect(vm.ratingDisplay).toBe('New');
    });

    it('handles empty coverImageUrl safely', () => {
      const noImageDto: RoomCardDto = {
        ...baseDto,
        coverImageUrl: '',
      };

      const vm = roomCardDtoToViewModel(noImageDto);
      expect(vm.coverImageUrl).toBe('');
    });
  });
});

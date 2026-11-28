import {
  slugify,
  slugToTitle,
  getInitials,
  formValuesToUpsertDto,
  profileDtoToFormValues,
  matchDtoToCardViewModel,
  requestDtoToCardViewModel,
} from '@/features/roommates/mappers';
import { paiseToRupees, rupeesToPaise } from '@/lib/money';
import type {
  RoommateMatchDto,
  RoommateProfileDto,
  RoommateRequestDto,
  RoommateWizardFormValues,
} from '@/features/roommates/types';

describe('Roommates Mappers', () => {
  describe('Rupees <-> Paise conversion', () => {
    it('converts between rupees and paise without precision loss', () => {
      const rupees = 7500;
      const paise = rupeesToPaise(rupees);
      expect(paise).toBe(750000);
      expect(paiseToRupees(paise)).toBe(7500);
    });

    it('round trips form values and profile DTO', () => {
      const formValues: RoommateWizardFormValues = {
        citySlug: 'indore',
        preferredLocalities: ['vijay-nagar', 'palasia'],
        budgetMinRupees: 6000,
        budgetMaxRupees: 8500,
        moveInBy: '2026-12-01',
        preferredGender: 'same',
        lifestyle: {
          smoking: false,
          drinking: false,
          pets: true,
          diet: 'veg',
          sleepSchedule: 'early',
          cleanliness: 4,
          guests: 'sometimes',
          studyHabits: 'quiet',
        },
        bio: '   Looking for flatmates   ',
        interests: ['music', 'reading'],
        college: '  IIPS Indore  ',
      };

      const dto = formValuesToUpsertDto(formValues);
      expect(dto.budgetMinPaise).toBe(600000);
      expect(dto.budgetMaxPaise).toBe(850000);
      expect(dto.bio).toBe('Looking for flatmates');
      expect(dto.college).toBe('IIPS Indore');

      const profileDto: RoommateProfileDto = {
        ...dto,
        gender: 'male',
        isActive: true,
        createdAt: '2026-11-28T00:00:00.000Z',
        updatedAt: '2026-11-28T00:00:00.000Z',
      };

      const reconstructedForm = profileDtoToFormValues(profileDto);
      expect(reconstructedForm.budgetMinRupees).toBe(6000);
      expect(reconstructedForm.budgetMaxRupees).toBe(8500);
      expect(reconstructedForm.preferredLocalities).toEqual(['vijay-nagar', 'palasia']);
      expect(reconstructedForm.college).toBe('IIPS Indore');
    });

    it('omits empty college string when converting form values to DTO', () => {
      const formValues: RoommateWizardFormValues = {
        citySlug: 'indore',
        preferredLocalities: [],
        budgetMinRupees: 5000,
        budgetMaxRupees: 7000,
        moveInBy: '2026-12-01',
        preferredGender: 'any',
        lifestyle: {
          smoking: false,
          drinking: false,
          pets: false,
          diet: 'veg',
          sleepSchedule: 'flexible',
          cleanliness: 3,
          guests: 'rarely',
          studyHabits: 'quiet',
        },
        bio: 'Bio',
        interests: ['music'],
        college: '   ',
      };

      const dto = formValuesToUpsertDto(formValues);
      expect(dto.college).toBeUndefined();
    });
  });

  describe('Initials helper', () => {
    it('extracts initials from single and multi-word names', () => {
      expect(getInitials('Asha V.')).toBe('AV');
      expect(getInitials('Rahul Sharma')).toBe('RS');
      expect(getInitials('Priya')).toBe('P');
      expect(getInitials('Amit Kumar Singh')).toBe('AS');
      expect(getInitials('')).toBe('?');
    });
  });

  describe('Slug helpers', () => {
    it('slugifies titles and formats titles from slugs', () => {
      expect(slugify('Vijay Nagar')).toBe('vijay-nagar');
      expect(slugify('  MP Nagar - Zone 1  ')).toBe('mp-nagar-zone-1');
      expect(slugToTitle('vijay-nagar')).toBe('Vijay Nagar');
      expect(slugToTitle('sapna-sangeeta')).toBe('Sapna Sangeeta');
      expect(slugToTitle('')).toBe('');
    });
  });

  describe('MatchCard view model', () => {
    it('maps match DTO into presentation view model', () => {
      const matchDto: RoommateMatchDto = {
        profile: {
          id: 'stud_123',
          displayName: 'Asha V.',
          avatarUrl: null,
          citySlug: 'indore',
          preferredLocalities: ['vijay-nagar', 'palasia'],
          budgetMinPaise: 600000,
          budgetMaxPaise: 800000,
          moveInBy: '2026-12-01',
          gender: 'female',
          preferredGender: 'same',
          lifestyle: {
            smoking: false,
            drinking: false,
            pets: false,
            diet: 'veg',
            sleepSchedule: 'early',
            cleanliness: 4,
            guests: 'sometimes',
            studyHabits: 'quiet',
          },
          bio: 'CS Student',
          interests: ['music', 'reading'],
        },
        score: 86.4,
        reasons: [
          'Budgets overlap ₹6,000–₹8,000',
          'Both vegetarian',
          'Similar cleanliness',
          'Fourth reason to be omitted',
        ],
      };

      const vm = matchDtoToCardViewModel(matchDto);
      expect(vm.id).toBe('stud_123');
      expect(vm.displayName).toBe('Asha V.');
      expect(vm.initials).toBe('AV');
      expect(vm.score).toBe(86);
      expect(vm.budgetLabel).toContain('6,000');
      expect(vm.budgetLabel).toContain('8,000');
      expect(vm.localities).toEqual(['Vijay Nagar', 'Palasia']);
      expect(vm.cityName).toBe('Indore');
      expect(vm.reasons.length).toBe(3);
    });
  });

  describe('RequestCard view model', () => {
    const contactData = {
      from: {
        uid: 'user_from',
        displayName: 'From Student',
        phone: '+919876543201',
        email: 'from@example.com',
        college: 'IIPS Indore',
      },
      to: {
        uid: 'user_to',
        displayName: 'To Student',
        phone: '+919876543202',
        email: 'to@example.com',
        college: 'SGSITS Indore',
      },
    };

    it('handles incoming pending request', () => {
      const req: RoommateRequestDto = {
        id: 'user_from_user_to',
        fromUid: 'user_from',
        toUid: 'user_to',
        message: 'Looking for a roommate!',
        status: 'pending',
        expiresAt: '2026-12-12T00:00:00.000Z',
        counterpart: {
          id: 'user_from',
          displayName: 'From Student',
          avatarUrl: null,
          citySlug: 'indore',
          preferredLocalities: ['vijay-nagar'],
          budgetMinPaise: 600000,
          budgetMaxPaise: 800000,
          moveInBy: '2026-12-01',
          gender: 'female',
          preferredGender: 'any',
          lifestyle: {
            smoking: false,
            drinking: false,
            pets: false,
            diet: 'veg',
            sleepSchedule: 'early',
            cleanliness: 4,
            guests: 'rarely',
            studyHabits: 'quiet',
          },
          bio: 'Bio',
          interests: ['music'],
        },
        createdAt: '2026-11-28T00:00:00.000Z',
        updatedAt: '2026-11-28T00:00:00.000Z',
      };

      const vm = requestDtoToCardViewModel(req, 'incoming');
      expect(vm.canAccept).toBe(true);
      expect(vm.canDecline).toBe(true);
      expect(vm.canCancel).toBe(false);
      expect(vm.contact).toBeNull();
      expect(vm.counterpartName).toBe('From Student');
    });

    it('handles outgoing pending request', () => {
      const req: RoommateRequestDto = {
        id: 'user_to_user_from',
        fromUid: 'user_to',
        toUid: 'user_from',
        message: 'Hi there!',
        status: 'pending',
        expiresAt: '2026-12-12T00:00:00.000Z',
        counterpart: {
          id: 'user_from',
          displayName: 'Target Student',
          avatarUrl: null,
          citySlug: 'indore',
          preferredLocalities: ['palasia'],
          budgetMinPaise: 500000,
          budgetMaxPaise: 700000,
          moveInBy: '2026-12-01',
          gender: 'female',
          preferredGender: 'same',
          lifestyle: {
            smoking: false,
            drinking: false,
            pets: false,
            diet: 'veg',
            sleepSchedule: 'flexible',
            cleanliness: 4,
            guests: 'rarely',
            studyHabits: 'quiet',
          },
          bio: 'Bio',
          interests: ['reading'],
        },
        createdAt: '2026-11-28T00:00:00.000Z',
        updatedAt: '2026-11-28T00:00:00.000Z',
      };

      const vm = requestDtoToCardViewModel(req, 'outgoing');
      expect(vm.canAccept).toBe(false);
      expect(vm.canDecline).toBe(false);
      expect(vm.canCancel).toBe(true);
      expect(vm.contact).toBeNull();
    });

    it('reveals contact.from for accepted incoming request', () => {
      const req: RoommateRequestDto = {
        id: 'user_from_user_to',
        fromUid: 'user_from',
        toUid: 'user_to',
        message: 'Accepted match!',
        status: 'accepted',
        expiresAt: '2026-12-12T00:00:00.000Z',
        counterpart: null,
        contact: contactData,
        createdAt: '2026-11-28T00:00:00.000Z',
        updatedAt: '2026-11-28T00:00:00.000Z',
      };

      const vm = requestDtoToCardViewModel(req, 'incoming');
      expect(vm.canAccept).toBe(false);
      expect(vm.canDecline).toBe(false);
      expect(vm.canCancel).toBe(false);
      expect(vm.contact).toEqual(contactData.from);
      expect(vm.contact?.phone).toBe('+919876543201');
    });

    it('reveals contact.to for accepted outgoing request', () => {
      const req: RoommateRequestDto = {
        id: 'user_from_user_to',
        fromUid: 'user_from',
        toUid: 'user_to',
        message: 'Accepted match!',
        status: 'accepted',
        expiresAt: '2026-12-12T00:00:00.000Z',
        counterpart: null,
        contact: contactData,
        createdAt: '2026-11-28T00:00:00.000Z',
        updatedAt: '2026-11-28T00:00:00.000Z',
      };

      const vm = requestDtoToCardViewModel(req, 'outgoing');
      expect(vm.contact).toEqual(contactData.to);
      expect(vm.contact?.phone).toBe('+919876543202');
    });

    it('does not reveal contact for declined request', () => {
      const req: RoommateRequestDto = {
        id: 'user_from_user_to',
        fromUid: 'user_from',
        toUid: 'user_to',
        message: 'Hello',
        status: 'declined',
        expiresAt: '2026-12-12T00:00:00.000Z',
        counterpart: null,
        contact: contactData,
        createdAt: '2026-11-28T00:00:00.000Z',
        updatedAt: '2026-11-28T00:00:00.000Z',
      };

      const vm = requestDtoToCardViewModel(req, 'incoming');
      expect(vm.contact).toBeNull();
      expect(vm.canAccept).toBe(false);
      expect(vm.canDecline).toBe(false);
    });
  });
});

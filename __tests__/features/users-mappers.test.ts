import {
  userMeToProfileViewModel,
  toUpdateProfileDto,
  profileToFormDefaults,
  getInitials,
  getCityDisplayName,
} from '@/features/users/mappers';
import type { UserMeDto } from '@/features/users/types';

describe('Users Mappers', () => {
  const baseStudentDto: UserMeDto = {
    id: 'student-1',
    role: 'student',
    status: 'active',
    email: 'rahul.sharma@example.com',
    emailVerified: true,
    phone: '+919876543210',
    phoneVerified: true,
    displayName: 'Rahul Sharma',
    avatarUrl: 'https://example.com/avatar.jpg' as unknown as UserMeDto['avatarUrl'],
    bio: 'CS student at IIPS',
    gender: 'male',
    college: 'IIPS Indore',
    city: 'indore',
    kycStatus: undefined,
    claims: { role: 'student', status: 'active' },
    notificationPrefs: { channels: { email: true, sms: false, push: true }, types: {} },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const baseOwnerDto: UserMeDto = {
    id: 'owner-1',
    role: 'owner',
    status: 'active',
    email: 'amit.kumar@example.com',
    emailVerified: true,
    phone: '+919876543212',
    phoneVerified: true,
    displayName: 'Amit Kumar Sharma',
    avatarUrl: null,
    bio: 'Property owner in Vijay Nagar',
    gender: 'male',
    city: 'indore',
    kycStatus: 'approved',
    ownerProfile: {
      kycStatus: 'approved',
      businessName: 'Kumar Residency',
      listedPropertyCount: 3,
      responseRate: 0.98,
      avgResponseMins: 15,
    },
    claims: { role: 'owner', status: 'active', kycStatus: 'approved' },
    notificationPrefs: { channels: { email: true, sms: true, push: true }, types: {} },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  describe('getInitials', () => {
    it('extracts two initials from multi-word names', () => {
      expect(getInitials('Rahul Sharma')).toBe('RS');
      expect(getInitials('Amit Kumar Sharma')).toBe('AS');
    });

    it('extracts one initial from a single word name', () => {
      expect(getInitials('Rahul')).toBe('R');
    });

    it('returns empty string for empty or null inputs', () => {
      expect(getInitials('')).toBe('');
      expect(getInitials(null)).toBe('');
      expect(getInitials(undefined)).toBe('');
    });
  });

  describe('getCityDisplayName', () => {
    it('returns capitalized display names for supported city slugs', () => {
      expect(getCityDisplayName('indore')).toBe('Indore');
      expect(getCityDisplayName('bhopal')).toBe('Bhopal');
      expect(getCityDisplayName('pune')).toBe('Pune');
      expect(getCityDisplayName('bengaluru')).toBe('Bengaluru');
    });

    it('capitalizes custom slugs or returns null for empty', () => {
      expect(getCityDisplayName('delhi')).toBe('Delhi');
      expect(getCityDisplayName('')).toBeNull();
      expect(getCityDisplayName(null)).toBeNull();
    });
  });

  describe('userMeToProfileViewModel', () => {
    it('maps student UserMeDto correctly with initials and null ownerStats', () => {
      const vm = userMeToProfileViewModel(baseStudentDto);

      expect(vm.id).toBe('student-1');
      expect(vm.displayName).toBe('Rahul Sharma');
      expect(vm.initials).toBe('RS');
      expect(vm.email).toBe('rahul.sharma@example.com');
      expect(vm.phone).toBe('+919876543210');
      expect(vm.phoneVerified).toBe(true);
      expect(vm.role).toBe('student');
      expect(vm.college).toBe('IIPS Indore');
      expect(vm.gender).toBe('male');
      expect(vm.genderLabelKey).toBe('profile.gender.male');
      expect(vm.city).toBe('indore');
      expect(vm.cityDisplayName).toBe('Indore');
      expect(vm.bio).toBe('CS student at IIPS');
      expect(vm.avatarUrl).toBe('https://example.com/avatar.jpg');
      expect(vm.ownerStats).toBeNull();
    });

    it('maps owner UserMeDto correctly with ownerStats from ownerProfile', () => {
      const vm = userMeToProfileViewModel(baseOwnerDto);

      expect(vm.id).toBe('owner-1');
      expect(vm.displayName).toBe('Amit Kumar Sharma');
      expect(vm.initials).toBe('AS');
      expect(vm.role).toBe('owner');
      expect(vm.kycStatus).toBe('approved');
      expect(vm.ownerStats).toEqual({
        listedPropertyCount: 3,
        responseRate: 0.98,
        avgResponseMins: 15,
      });
    });

    it('handles unverified phone and missing optional fields gracefully', () => {
      const minimalDto: UserMeDto = {
        ...baseStudentDto,
        displayName: undefined,
        phone: undefined,
        phoneVerified: false,
        avatarUrl: null,
        college: undefined,
        city: undefined,
        bio: undefined,
        gender: undefined,
      };

      const vm = userMeToProfileViewModel(minimalDto);

      expect(vm.displayName).toBe('');
      expect(vm.initials).toBe('');
      expect(vm.phone).toBeNull();
      expect(vm.phoneVerified).toBe(false);
      expect(vm.gender).toBeNull();
      expect(vm.genderLabelKey).toBe('profile.gender.undisclosed');
      expect(vm.city).toBeNull();
      expect(vm.cityDisplayName).toBeNull();
      expect(vm.college).toBeNull();
      expect(vm.bio).toBeNull();
      expect(vm.avatarUrl).toBeNull();
    });
  });

  describe('profileToFormDefaults', () => {
    it('populates form defaults from UserMeDto', () => {
      const defaults = profileToFormDefaults(baseStudentDto);

      expect(defaults).toEqual({
        displayName: 'Rahul Sharma',
        bio: 'CS student at IIPS',
        gender: 'male',
        college: 'IIPS Indore',
        city: 'indore',
      });
    });

    it('returns empty defaults when dto is null or undefined', () => {
      expect(profileToFormDefaults(null)).toEqual({
        displayName: '',
        bio: '',
        gender: 'undisclosed',
        college: '',
        city: '',
      });
    });
  });

  describe('toUpdateProfileDto', () => {
    it('sends only changed fields when values differ from original', () => {
      const values = {
        displayName: 'Rahul S.',
        college: 'SGSITS',
        bio: 'CS student at IIPS', // unchanged
        gender: 'male' as const, // unchanged
        city: 'indore' as const, // unchanged
      };

      const patch = toUpdateProfileDto(values, baseStudentDto);

      expect(patch).toEqual({
        displayName: 'Rahul S.',
        college: 'SGSITS',
      });
    });

    it('returns empty object when no fields were modified', () => {
      const values = {
        displayName: 'Rahul Sharma',
        college: 'IIPS Indore',
        bio: 'CS student at IIPS',
        gender: 'male' as const,
        city: 'indore' as const,
      };

      const patch = toUpdateProfileDto(values, baseStudentDto);

      expect(patch).toEqual({});
    });

    it('omits empty strings and trimmed-empty values', () => {
      const values = {
        displayName: 'Rahul Sharma', // unchanged
        college: '   ', // changed to empty whitespace -> omit
        bio: '', // changed to empty -> omit
        gender: 'male' as const,
        city: '' as const,
      };

      const patch = toUpdateProfileDto(values, baseStudentDto);

      expect(patch).toEqual({});
    });
  });
});

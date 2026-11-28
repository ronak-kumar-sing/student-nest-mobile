import { addDays, format } from 'date-fns';
import { useDevSettingsStore } from '@/stores/dev-settings';
import { useSessionStore } from '@/stores/session';
import {
  getRoommatesMock,
  resetRoommatesMock,
  computeCompatibilityScore,
} from '@/api/mock/roommates';
import { mockRoommatesApi } from '@/features/roommates/api';
import { isApiError, ErrorCodes } from '@/api/errors';
import type { UpsertRoommateProfileDto } from '@/features/roommates/types';

describe('Roommates Mock Backend & Scoring', () => {
  beforeEach(() => {
    useDevSettingsStore.setState({ mockLatency: 0, forceError: null, isOffline: false });
    useSessionStore.setState({
      user: {
        id: 'student-1',
        email: 'rahul.sharma@example.com',
        displayName: 'Rahul Sharma',
        avatarUrl: null,
        phone: '+919876543210',
        role: 'student',
      },
      isAuthenticated: true,
      role: 'student',
    });
    resetRoommatesMock();
  });

  describe('Mock API Profile & Matches Lifecycle', () => {
    it('returns null on getProfile when no profile exists initially', async () => {
      const profile = await mockRoommatesApi.getProfile();
      expect(profile).toBeNull();
    });

    it('upserts a profile and retrieves matches', async () => {
      const upsertDto: UpsertRoommateProfileDto = {
        citySlug: 'indore',
        preferredLocalities: ['vijay-nagar', 'bhawarkua'],
        budgetMinPaise: 600000,
        budgetMaxPaise: 850000,
        moveInBy: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
        preferredGender: 'any',
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
        bio: 'Rahul looking for room',
        interests: ['coding', 'music'],
        college: 'IIPS Indore',
      };

      const created = await mockRoommatesApi.upsertProfile(upsertDto);
      expect(created.citySlug).toBe('indore');
      expect(created.isActive).toBe(true);

      const matches = await mockRoommatesApi.getMatches();
      expect(matches.items.length).toBeGreaterThan(0);
      const topMatch = matches.items[0];
      expect(topMatch).toBeDefined();
      expect(topMatch!.score).toBeGreaterThan(0);
      expect(topMatch!.reasons.length).toBeGreaterThan(0);
    });
  });

  describe('Roommate Requests State Machine', () => {
    beforeEach(async () => {
      // Create profile for student-1 so requests can be sent
      await mockRoommatesApi.upsertProfile({
        citySlug: 'indore',
        preferredLocalities: ['vijay-nagar'],
        budgetMinPaise: 600000,
        budgetMaxPaise: 900000,
        moveInBy: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
        preferredGender: 'any',
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
        bio: 'Active student',
        interests: ['coding'],
      });
    });

    it('send request -> accept reveals contact', async () => {
      // Send a new request to rm-student-1 (Asha V.)
      const newReq = await mockRoommatesApi.sendRequest({
        toUid: 'rm-student-1',
        message: 'Hi Asha! Would love to team up.',
      });

      expect(newReq.status).toBe('pending');
      expect(newReq.fromUid).toBe('student-1');
      expect(newReq.toUid).toBe('rm-student-1');
      expect(newReq.contact).toBeUndefined();

      // Switch session to recipient (rm-student-1)
      useSessionStore.setState({
        user: {
          id: 'rm-student-1',
          email: 'asha.v@example.com',
          displayName: 'Asha Verma',
          avatarUrl: null,
          phone: '+919876543201',
          role: 'student',
        },
      });

      // Recipient accepts request
      const acceptedReq = await mockRoommatesApi.actOnRequest(newReq.id, 'accept');
      expect(acceptedReq.status).toBe('accepted');
      expect(acceptedReq.contact).toBeDefined();
      expect(acceptedReq.contact?.from.displayName).toBe('Rahul Sharma');
      expect(acceptedReq.contact?.to.displayName).toBe('Asha Verma');
    });

    it('rejects duplicate request with 409 DUPLICATE_REQUEST', async () => {
      // Initial seeds have pending request from rm-student-2 to student-1
      // If student-1 tries to send request to rm-student-2 while it's already pending reverse
      // sending auto-accepts mutual match!
      // But sending twice to the same user:
      await mockRoommatesApi.sendRequest({ toUid: 'rm-student-1' });

      await expect(
        mockRoommatesApi.sendRequest({ toUid: 'rm-student-1' }),
      ).rejects.toMatchObject({
        code: ErrorCodes.DUPLICATE_REQUEST,
        statusCode: 409,
      });
    });

    it('sender can cancel a pending request', async () => {
      const sent = await mockRoommatesApi.sendRequest({
        toUid: 'rm-student-1',
        message: 'Let us connect',
      });
      expect(sent.status).toBe('pending');

      const cancelled = await mockRoommatesApi.actOnRequest(sent.id, 'cancel');
      expect(cancelled.status).toBe('cancelled');
    });

    it('rejects cancel by non-sender with 403 FORBIDDEN', async () => {
      // Initial seed has incoming pending request from rm-student-2 to student-1
      const incomingPendingId = 'rm-student-2_student-1';

      // student-1 is recipient, so cannot cancel
      await expect(
        mockRoommatesApi.actOnRequest(incomingPendingId, 'cancel'),
      ).rejects.toMatchObject({
        code: ErrorCodes.FORBIDDEN,
        statusCode: 403,
      });
    });
  });

  describe('Pure Compatibility Scoring', () => {
    it('returns null when cities differ', () => {
      const p1 = {
        uid: 'u1',
        citySlug: 'indore',
        preferredLocalities: [],
        budgetMinPaise: 600000,
        budgetMaxPaise: 800000,
        moveInBy: '2026-12-01',
        gender: 'male' as const,
        preferredGender: 'any' as const,
        lifestyle: {
          smoking: false,
          drinking: false,
          pets: false,
          diet: 'veg' as const,
          sleepSchedule: 'early' as const,
          cleanliness: 4,
          guests: 'sometimes' as const,
          studyHabits: 'quiet' as const,
        },
        bio: '',
        interests: [],
        isActive: true,
        createdAt: '',
        updatedAt: '',
        phone: '',
        email: '',
        fullName: 'User 1',
      };

      const p2 = { ...p1, uid: 'u2', citySlug: 'bhopal' };
      const result = computeCompatibilityScore(p1, p2);
      expect(result).toBeNull();
    });

    it('returns high score for identical profiles in the same city', () => {
      const p1 = {
        uid: 'u1',
        citySlug: 'indore',
        preferredLocalities: ['vijay-nagar'],
        budgetMinPaise: 600000,
        budgetMaxPaise: 800000,
        moveInBy: '2026-12-01',
        gender: 'male' as const,
        preferredGender: 'any' as const,
        lifestyle: {
          smoking: false,
          drinking: false,
          pets: false,
          diet: 'veg' as const,
          sleepSchedule: 'early' as const,
          cleanliness: 4,
          guests: 'sometimes' as const,
          studyHabits: 'quiet' as const,
        },
        bio: '',
        interests: ['coding' as const, 'music' as const],
        college: 'IIPS Indore',
        isActive: true,
        createdAt: '',
        updatedAt: '',
        phone: '',
        email: '',
        fullName: 'User 1',
      };

      const p2 = { ...p1, uid: 'u2' };
      const result = computeCompatibilityScore(p1, p2);
      expect(result).not.toBeNull();
      expect(result!.score).toBeGreaterThanOrEqual(95);
      expect(result!.reasons.length).toBeGreaterThan(0);
    });
  });
});

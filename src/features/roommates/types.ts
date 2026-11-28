import type { Schemas, Page } from '@/api/http/types';

// ─── DTO Aliases from OpenAPI Schema ────────────────────────────────

export type UpsertRoommateProfileDto = Schemas['UpsertRoommateProfileDto'];
export type RoommateProfileDto = Schemas['RoommateProfileDto'];
export type LifestyleDto = Schemas['LifestyleDto'];
export type PublicRoommateDto = Schemas['PublicRoommateDto'];
export type RoommateMatchDto = Schemas['RoommateMatchDto'];
export type RoommateMatchesDto = Schemas['RoommateMatchesDto'];
export type SendRoommateRequestDto = Schemas['SendRoommateRequestDto'];
export type RoommateRequestDto = Schemas['RoommateRequestDto'];
export type RoommateRequestContactDto = Schemas['RoommateRequestContactDto'];
export type RoommateContactDto = Schemas['RoommateContactDto'];
export type RoommateRequestActionDto = Schemas['RoommateRequestActionDto'];
export type ProfileActionDto = Schemas['ProfileActionDto'];

// ─── Enums & Constants ──────────────────────────────────────────────

export type RoommateDiet = 'veg' | 'non_veg' | 'eggetarian';
export type RoommateSleepSchedule = 'early' | 'late' | 'flexible';
export type RoommateGuests = 'rarely' | 'sometimes' | 'often';
export type RoommateStudyHabits = 'quiet' | 'music' | 'flexible';
export type RoommatePreferredGender = 'any' | 'same';

export const ROOMMATE_INTERESTS = [
  'music',
  'movies',
  'reading',
  'gaming',
  'sports',
  'fitness',
  'cooking',
  'travel',
  'coding',
  'art',
  'photography',
  'dance',
  'anime',
  'yoga',
  'writing',
  'theatre',
] as const;

export type RoommateInterest = (typeof ROOMMATE_INTERESTS)[number];

// ─── View Models ────────────────────────────────────────────────────

export interface RoommateMatchCardViewModel {
  id: string;
  displayName: string;
  initials: string;
  avatarUrl: string | null;
  score: number;
  budgetLabel: string;
  moveInLabel: string;
  reasons: string[];
  localities: string[];
  cityName: string;
  gender: string;
  preferredGender: RoommatePreferredGender;
  bio: string;
  interests: RoommateInterest[];
  lifestyle: LifestyleDto;
  raw: RoommateMatchDto;
}

export interface RoommateRequestCardViewModel {
  id: string;
  fromUid: string;
  toUid: string;
  direction: 'incoming' | 'outgoing';
  status: RoommateRequestDto['status'];
  message: string;
  counterpartName: string;
  counterpartInitials: string;
  counterpartAvatarUrl: string | null;
  canAccept: boolean;
  canDecline: boolean;
  canCancel: boolean;
  contact: RoommateContactDto | null;
  createdAt: string;
  expiresAt: string;
  respondedAt?: string;
  raw: RoommateRequestDto;
}

// ─── Form Types ─────────────────────────────────────────────────────

export interface RoommateWizardFormValues {
  citySlug: string;
  preferredLocalities: string[];
  budgetMinRupees: number;
  budgetMaxRupees: number;
  moveInBy: string;
  preferredGender: RoommatePreferredGender;
  lifestyle: LifestyleDto;
  bio: string;
  interests: RoommateInterest[];
  college?: string;
}

// ─── API Interface ──────────────────────────────────────────────────

export interface RoommatesApi {
  getProfile(signal?: AbortSignal): Promise<RoommateProfileDto | null>;
  upsertProfile(dto: UpsertRoommateProfileDto, signal?: AbortSignal): Promise<RoommateProfileDto>;
  setProfileActive(active: boolean, signal?: AbortSignal): Promise<RoommateProfileDto>;
  getMatches(signal?: AbortSignal, limit?: number): Promise<RoommateMatchesDto>;
  sendRequest(params: { toUid: string; message?: string }, signal?: AbortSignal): Promise<RoommateRequestDto>;
  listRequests(
    params?: { direction?: 'incoming' | 'outgoing'; status?: string; cursor?: string | null; limit?: number },
    signal?: AbortSignal,
  ): Promise<Page<RoommateRequestDto>>;
  actOnRequest(
    id: string,
    action: RoommateRequestActionDto['action'],
    signal?: AbortSignal,
  ): Promise<RoommateRequestDto>;
}

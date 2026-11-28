import type { Schemas } from '@/api/http/types';

export type UserMeDto = Schemas['UserMeDto'];
export type UpdateProfileDto = Schemas['UpdateProfileDto'];
export type BecomeOwnerDto = Schemas['BecomeOwnerDto'];
export type BecomeOwnerResponseDto = Schemas['BecomeOwnerResponseDto'];
export type OwnerProfileDto = Schemas['OwnerProfileDto'];

export interface OwnerStatsViewModel {
  listedPropertyCount: number;
  responseRate?: number | null;
  avgResponseMins?: number | null;
}

export interface ProfileViewModel {
  id: string;
  displayName: string;
  initials: string;
  email: string;
  phone: string | null;
  phoneVerified: boolean;
  role: 'student' | 'owner' | 'admin';
  college: string | null;
  gender: 'male' | 'female' | 'non_binary' | 'undisclosed' | null;
  genderLabelKey: string;
  city: string | null;
  cityDisplayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  kycStatus: 'none' | 'pending' | 'approved' | 'rejected';
  ownerStats: OwnerStatsViewModel | null;
}

export interface UsersApi {
  getMe: (signal?: AbortSignal) => Promise<UserMeDto>;
  updateMe: (patch: UpdateProfileDto) => Promise<UserMeDto>;
  becomeOwner: (input?: BecomeOwnerDto) => Promise<BecomeOwnerResponseDto>;
}

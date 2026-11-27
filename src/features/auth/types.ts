import type { components } from '@/api/generated/schema';

export type UserMeDto = components['schemas']['UserMeDto'];
export type SendOtpResponseDto = components['schemas']['SendOtpResponseDto'];
export type VerifyOtpResponseDto = components['schemas']['VerifyOtpResponseDto'];
export type SignupDto = components['schemas']['SignupDto'];
export type SignupResponseDto = components['schemas']['SignupResponseDto'];
export type UpdateProfileDto = components['schemas']['UpdateProfileDto'];

export interface SendEmailOtpInput {
  email: string;
}

export interface VerifyEmailOtpInput {
  email: string;
  code: string;
}

export interface SignupInput {
  role: 'student' | 'owner';
  displayName: string;
  acceptedTermsVersion: string;
  marketingOptIn?: boolean;
}

export interface AuthApi {
  sendEmailOtp: (email: string) => Promise<SendOtpResponseDto>;
  verifyEmailOtp: (email: string, code: string) => Promise<{ isNewUser: boolean }>;
  signup: (input: SignupInput) => Promise<SignupResponseDto>;
  updateProfile: (patch: UpdateProfileDto) => Promise<UserMeDto>;
  getMe: (signal?: AbortSignal) => Promise<UserMeDto>;
  signOut: () => Promise<void>;
}

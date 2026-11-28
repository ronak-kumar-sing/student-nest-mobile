import type { components } from '@/api/generated/schema';

export type UserMeDto = components['schemas']['UserMeDto'];
export type SendOtpResponseDto = components['schemas']['SendOtpResponseDto'];
export type VerifyOtpResponseDto = components['schemas']['VerifyOtpResponseDto'];
export type SignupDto = components['schemas']['SignupDto'];
export type SignupResponseDto = components['schemas']['SignupResponseDto'];
export type UpdateProfileDto = components['schemas']['UpdateProfileDto'];

export type DemoPersona = components['schemas']['DemoPersona'];
export type DemoConfigDto = components['schemas']['DemoStatusDto'];
export type DemoSignInResponseDto = components['schemas']['DemoSignInResponseDto'];

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
  getDemoConfig: (signal?: AbortSignal) => Promise<DemoConfigDto>;
  demoSignIn: (persona: DemoPersona) => Promise<DemoSignInResponseDto>;
}

import { z } from 'zod';

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Please enter your email')
  .email('Please enter a valid email address');

export const otpSchema = z
  .string()
  .trim()
  .length(6, 'Verification code must be 6 digits')
  .regex(/^\d{6}$/, 'Verification code must be numeric');

export const roleSchema = z.enum(['student', 'owner']);

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be at most 50 characters');

export const genderSchema = z.enum(['male', 'female', 'non_binary', 'undisclosed']);

export const signupSchema = z.object({
  role: roleSchema,
  displayName: displayNameSchema,
  acceptedTermsVersion: z
    .string()
    .regex(/^[\w.-]{1,32}$/, 'Invalid terms version format'),
  marketingOptIn: z.boolean().optional(),
});

export const profileSetupSchema = z.object({
  displayName: displayNameSchema,
  gender: genderSchema,
  college: z.string().max(100).optional(),
  city: z.string().optional(),
});

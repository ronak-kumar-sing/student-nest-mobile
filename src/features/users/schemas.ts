import { z } from 'zod';

export const VALID_CITIES = ['indore', 'bhopal', 'pune', 'bengaluru'] as const;

export const profileEditSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'profile.errors.nameMin')
    .max(50, 'profile.errors.nameMax'),
  bio: z
    .string()
    .max(300, 'profile.errors.bioMax')
    .optional(),
  gender: z
    .enum(['male', 'female', 'non_binary', 'undisclosed']),
  college: z
    .string()
    .max(100, 'profile.errors.collegeMax')
    .optional(),
  city: z
    .enum(['indore', 'bhopal', 'pune', 'bengaluru', ''])
    .optional(),
});

export type ProfileFormValues = z.infer<typeof profileEditSchema>;

export const becomeOwnerSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(2, 'profile.businessNameTooShort')
    .max(80, 'profile.errors.businessNameMax')
    .optional()
    .or(z.literal('')),
});

export type BecomeOwnerFormValues = z.infer<typeof becomeOwnerSchema>;

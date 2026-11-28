import { z } from 'zod';

// Validation messages are i18n keys (en.json → roommates.validation.*); screens render them with t().
import { format } from 'date-fns';
import { TZDate } from '@date-fns/tz';
import { IST_TIMEZONE } from '@/lib/dates';
import { ROOMMATE_INTERESTS } from './types';

export function getTodayIST(): string {
  const ist = new TZDate(new Date(), IST_TIMEZONE);
  return format(ist, 'yyyy-MM-dd');
}

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidCalendarDate(dateStr: string): boolean {
  if (!DATE_REGEX.test(dateStr)) return false;
  const parts = dateStr.split('-');
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) return false;
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

// ─── Step 1: City & Localities ──────────────────────────────────────

export const step1Schema = z.object({
  citySlug: z
    .string()
    .trim()
    .min(1, 'roommates.validation.cityRequired')
    .regex(SLUG_REGEX, 'roommates.validation.citySlug'),
  preferredLocalities: z
    .array(
      z
        .string()
        .trim()
        .min(1, 'roommates.validation.localityEmpty')
        .regex(SLUG_REGEX, 'roommates.validation.localitySlug'),
    )
    .max(5, 'roommates.validation.localitiesMax'),
});

// ─── Step 2: Budget & Move-in ───────────────────────────────────────

export function makeStep2Schema(today: string = getTodayIST()) {
  return z
    .object({
      budgetMinRupees: z
        .number({ error: 'roommates.validation.budgetNumber' })
        .int('roommates.validation.budgetInteger')
        .min(0, 'roommates.validation.budgetMinNegative'),
      budgetMaxRupees: z
        .number({ error: 'roommates.validation.budgetNumber' })
        .int('roommates.validation.budgetInteger')
        .min(0, 'roommates.validation.budgetMaxNegative'),
      moveInBy: z
        .string()
        .regex(DATE_REGEX, 'roommates.validation.dateFormat')
        .refine(isValidCalendarDate, 'roommates.validation.dateInvalid')
        .refine((val) => val >= today, 'roommates.validation.datePast'),
      preferredGender: z.enum(['any', 'same'], { error: 'roommates.validation.preferredGender' }),
    })
    .refine((data) => data.budgetMinRupees <= data.budgetMaxRupees, {
      message: 'roommates.validation.budgetRange',
      path: ['budgetMaxRupees'],
    });
}

export const step2Schema = makeStep2Schema();

// ─── Step 3: Lifestyle ──────────────────────────────────────────────

export const step3Schema = z.object({
  lifestyle: z.object({
    smoking: z.boolean(),
    drinking: z.boolean(),
    pets: z.boolean(),
    diet: z.enum(['veg', 'non_veg', 'eggetarian']),
    sleepSchedule: z.enum(['early', 'late', 'flexible']),
    cleanliness: z
      .number({ error: 'roommates.validation.cleanlinessRequired' })
      .int()
      .min(1, 'roommates.validation.cleanlinessRange')
      .max(5, 'roommates.validation.cleanlinessRange'),
    guests: z.enum(['rarely', 'sometimes', 'often']),
    studyHabits: z.enum(['quiet', 'music', 'flexible']),
  }),
});

// ─── Step 4: Bio, Interests, College ────────────────────────────────

export const step4Schema = z.object({
  bio: z.string().max(300, 'roommates.validation.bioMax'),
  interests: z
    .array(z.enum(ROOMMATE_INTERESTS))
    .max(10, 'roommates.validation.interestsMax'),
  college: z.string().max(100, 'roommates.validation.collegeMax').optional(),
});

// ─── Combined Wizard Schema ─────────────────────────────────────────

export function makeRoommateWizardSchema(today: string = getTodayIST()) {
  return z
    .object({
      citySlug: step1Schema.shape.citySlug,
      preferredLocalities: step1Schema.shape.preferredLocalities,
      budgetMinRupees: z
        .number({ error: 'roommates.validation.budgetNumber' })
        .int('roommates.validation.budgetInteger')
        .min(0, 'roommates.validation.budgetMinNegative'),
      budgetMaxRupees: z
        .number({ error: 'roommates.validation.budgetNumber' })
        .int('roommates.validation.budgetInteger')
        .min(0, 'roommates.validation.budgetMaxNegative'),
      moveInBy: z
        .string()
        .regex(DATE_REGEX, 'roommates.validation.dateFormat')
        .refine(isValidCalendarDate, 'roommates.validation.dateInvalid')
        .refine((val) => val >= today, 'roommates.validation.datePast'),
      preferredGender: z.enum(['any', 'same']),
      lifestyle: step3Schema.shape.lifestyle,
      bio: step4Schema.shape.bio,
      interests: step4Schema.shape.interests,
      college: step4Schema.shape.college,
    })
    .refine((data) => data.budgetMinRupees <= data.budgetMaxRupees, {
      message: 'roommates.validation.budgetRange',
      path: ['budgetMaxRupees'],
    });
}

export const roommateWizardSchema = makeRoommateWizardSchema();

// ─── Step Field Lists for trigger() ─────────────────────────────────

export const step1Fields = ['citySlug', 'preferredLocalities'] as const;
export const step2Fields = [
  'budgetMinRupees',
  'budgetMaxRupees',
  'moveInBy',
  'preferredGender',
] as const;
export const step3Fields = ['lifestyle'] as const;
export const step4Fields = ['bio', 'interests', 'college'] as const;

// ─── Send Request Schema ────────────────────────────────────────────

export const sendRoommateRequestSchema = z.object({
  message: z.string().max(300, 'roommates.validation.messageMax').optional(),
});

import {
  makeRoommateWizardSchema,
  step1Schema,
  makeStep2Schema,
  step3Schema,
  step4Schema,
} from '@/features/roommates/schemas';

describe('Roommates Schema Validation', () => {
  const referenceToday = '2026-11-28';
  const wizardSchema = makeRoommateWizardSchema(referenceToday);
  const step2Schema = makeStep2Schema(referenceToday);

  const validFullProfile = {
    citySlug: 'indore',
    preferredLocalities: ['vijay-nagar', 'palasia', 'bhawarkua'],
    budgetMinRupees: 6000,
    budgetMaxRupees: 9000,
    moveInBy: '2026-12-05',
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
    bio: 'Third year student at IIPS.',
    interests: ['coding', 'reading', 'music'],
    college: 'IIPS Indore',
  };

  it('passes validation for a valid complete profile', () => {
    const result = wizardSchema.safeParse(validFullProfile);
    expect(result.success).toBe(true);
  });

  describe('Step 1 (City & Localities)', () => {
    it('rejects empty city', () => {
      const result = step1Schema.safeParse({
        citySlug: '',
        preferredLocalities: ['vijay-nagar'],
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid city slug format', () => {
      const result = step1Schema.safeParse({
        citySlug: 'Indore City!',
        preferredLocalities: [],
      });
      expect(result.success).toBe(false);
    });

    it('rejects more than 5 localities', () => {
      const result = step1Schema.safeParse({
        citySlug: 'indore',
        preferredLocalities: ['loc-1', 'loc-2', 'loc-3', 'loc-4', 'loc-5', 'loc-6'],
      });
      expect(result.success).toBe(false);
    });

    it('accepts up to 5 valid localities', () => {
      const result = step1Schema.safeParse({
        citySlug: 'indore',
        preferredLocalities: ['loc-1', 'loc-2', 'loc-3', 'loc-4', 'loc-5'],
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Step 2 (Budget & Move-in)', () => {
    it('rejects min budget > max budget', () => {
      const result = step2Schema.safeParse({
        budgetMinRupees: 10000,
        budgetMaxRupees: 8000,
        moveInBy: '2026-12-05',
        preferredGender: 'any',
      });
      expect(result.success).toBe(false);
    });

    it('rejects negative budgets', () => {
      const result = step2Schema.safeParse({
        budgetMinRupees: -500,
        budgetMaxRupees: 8000,
        moveInBy: '2026-12-05',
        preferredGender: 'any',
      });
      expect(result.success).toBe(false);
    });

    it('rejects past move-in dates relative to reference today', () => {
      const result = step2Schema.safeParse({
        budgetMinRupees: 6000,
        budgetMaxRupees: 8000,
        moveInBy: '2026-11-20', // in the past relative to 2026-11-28
        preferredGender: 'any',
      });
      expect(result.success).toBe(false);
    });

    it('rejects malformed move-in dates', () => {
      const invalidDates = ['invalid-date', '2026-02-31', '2026/12/01', '26-12-01'];
      for (const d of invalidDates) {
        const result = step2Schema.safeParse({
          budgetMinRupees: 6000,
          budgetMaxRupees: 8000,
          moveInBy: d,
          preferredGender: 'any',
        });
        expect(result.success).toBe(false);
      }
    });

    it('accepts move-in date on or after reference today', () => {
      const result = step2Schema.safeParse({
        budgetMinRupees: 6000,
        budgetMaxRupees: 8000,
        moveInBy: '2026-11-28',
        preferredGender: 'same',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Step 3 (Lifestyle)', () => {
    it('rejects cleanliness of 0 or 6', () => {
      const baseLifestyle = {
        smoking: false,
        drinking: false,
        pets: false,
        diet: 'veg',
        sleepSchedule: 'early',
        guests: 'sometimes',
        studyHabits: 'quiet',
      };

      const res0 = step3Schema.safeParse({
        lifestyle: { ...baseLifestyle, cleanliness: 0 },
      });
      expect(res0.success).toBe(false);

      const res6 = step3Schema.safeParse({
        lifestyle: { ...baseLifestyle, cleanliness: 6 },
      });
      expect(res6.success).toBe(false);

      const resValid = step3Schema.safeParse({
        lifestyle: { ...baseLifestyle, cleanliness: 5 },
      });
      expect(resValid.success).toBe(true);
    });

    it('rejects invalid lifestyle enums', () => {
      const baseLifestyle = {
        smoking: false,
        drinking: false,
        pets: false,
        cleanliness: 3,
        guests: 'sometimes',
        studyHabits: 'quiet',
        sleepSchedule: 'early',
      };

      const invalidDiet = step3Schema.safeParse({
        lifestyle: { ...baseLifestyle, diet: 'carnivore' },
      });
      expect(invalidDiet.success).toBe(false);
    });
  });

  describe('Step 4 (Bio, Interests, College)', () => {
    it('rejects bio longer than 300 characters', () => {
      const longBio = 'a'.repeat(301);
      const result = step4Schema.safeParse({
        bio: longBio,
        interests: ['music'],
      });
      expect(result.success).toBe(false);

      const maxBio = 'a'.repeat(300);
      const validResult = step4Schema.safeParse({
        bio: maxBio,
        interests: ['music'],
      });
      expect(validResult.success).toBe(true);
    });

    it('rejects more than 10 interests', () => {
      const elevenInterests = [
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
      ];
      const result = step4Schema.safeParse({
        bio: 'Hello',
        interests: elevenInterests,
      });
      expect(result.success).toBe(false);
    });

    it('rejects unknown interest', () => {
      const result = step4Schema.safeParse({
        bio: 'Hello',
        interests: ['skydiving'], // not in the 16 closed enum
      });
      expect(result.success).toBe(false);
    });

    it('rejects college name longer than 100 characters', () => {
      const result = step4Schema.safeParse({
        bio: 'Hello',
        interests: ['music'],
        college: 'c'.repeat(101),
      });
      expect(result.success).toBe(false);
    });
  });
});

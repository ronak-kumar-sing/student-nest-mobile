import { useSessionStore } from '@/stores/session';
import { ErrorCodes } from '@/api/errors';
import { simulateLatency } from '@/api/mock/latency';
import { shouldInjectError, getInjectedError, createMockError } from '@/api/mock/errors';
import type { Page } from '@/api/http/types';
import type {
  RoommateProfileDto,
  UpsertRoommateProfileDto,
  RoommateMatchesDto,
  RoommateMatchDto,
  RoommateRequestDto,
  RoommateContactDto,
  PublicRoommateDto,
  RoommateRequestActionDto,
} from '@/features/roommates/types';
import { parseISO, differenceInCalendarDays, addDays, format } from 'date-fns';
import { formatINR } from '@/lib/money';

// ─── Seed Data Types ────────────────────────────────────────────────

interface StoredRoommateProfile extends RoommateProfileDto {
  uid: string;
  phone: string;
  email: string;
  fullName: string;
}

interface StoredRoommateRequest extends RoommateRequestDto {
  blocked?: boolean;
}

// ─── Helper: Date & Cursor ──────────────────────────────────────────

function encodeCursor(offset: number): string {
  return typeof btoa === 'function' ? btoa(String(offset)) : String(offset);
}

function decodeCursor(cursor: string | null | undefined): number {
  if (!cursor) return 0;
  try {
    const raw = typeof atob === 'function' ? atob(cursor) : cursor;
    const num = parseInt(raw, 10);
    return isNaN(num) ? 0 : num;
  } catch {
    return 0;
  }
}

function getRelativeDateStr(daysFromNow: number): string {
  return format(addDays(new Date(), daysFromNow), 'yyyy-MM-dd');
}

// ─── Initial Seed Profiles ──────────────────────────────────────────

function createInitialSeedProfiles(): StoredRoommateProfile[] {
  const now = new Date().toISOString();

  return [
    // 1. Asha V. — Indore (Vijay Nagar)
    {
      uid: 'rm-student-1',
      citySlug: 'indore',
      preferredLocalities: ['vijay-nagar', 'bhawarkua'],
      budgetMinPaise: 600000,
      budgetMaxPaise: 800000,
      moveInBy: getRelativeDateStr(14),
      gender: 'female',
      preferredGender: 'any',
      lifestyle: {
        smoking: false,
        drinking: false,
        diet: 'veg',
        pets: true,
        sleepSchedule: 'early',
        cleanliness: 4,
        guests: 'sometimes',
        studyHabits: 'quiet',
      },
      bio: 'Final year CS student at IIPS. Looking for a neat 2BHK flatmate near Vijay Nagar.',
      interests: ['music', 'reading', 'coding', 'yoga'],
      college: 'IIPS Indore',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      phone: '+919876543201',
      email: 'asha.v@example.com',
      fullName: 'Asha Verma',
    },
    // 2. Rohan M. — Indore (Palasia)
    {
      uid: 'rm-student-2',
      citySlug: 'indore',
      preferredLocalities: ['vijay-nagar', 'palasia'],
      budgetMinPaise: 700000,
      budgetMaxPaise: 900000,
      moveInBy: getRelativeDateStr(20),
      gender: 'male',
      preferredGender: 'same',
      lifestyle: {
        smoking: false,
        drinking: false,
        diet: 'non_veg',
        pets: false,
        sleepSchedule: 'late',
        cleanliness: 3,
        guests: 'often',
        studyHabits: 'music',
      },
      bio: 'SGSITS 3rd year. Chill guy, love gaming on weekends and searching for a flat near Palasia.',
      interests: ['gaming', 'coding', 'fitness', 'movies'],
      college: 'SGSITS Indore',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      phone: '+919876543202',
      email: 'rohan.m@example.com',
      fullName: 'Rohan Mehta',
    },
    // 3. Priya S. — Indore (Sapna Sangeeta)
    {
      uid: 'rm-student-3',
      citySlug: 'indore',
      preferredLocalities: ['palasia', 'sapna-sangeeta'],
      budgetMinPaise: 500000,
      budgetMaxPaise: 750000,
      moveInBy: getRelativeDateStr(10),
      gender: 'female',
      preferredGender: 'same',
      lifestyle: {
        smoking: false,
        drinking: false,
        diet: 'veg',
        pets: true,
        sleepSchedule: 'flexible',
        cleanliness: 4,
        guests: 'rarely',
        studyHabits: 'quiet',
      },
      bio: 'DAVV student. Quiet, vegetarian, loves reading and plant parenting.',
      interests: ['yoga', 'reading', 'cooking', 'art'],
      college: 'DAVV Indore',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      phone: '+919876543203',
      email: 'priya.s@example.com',
      fullName: 'Priya Sharma',
    },
    // 4. Ankit K. — Indore (Bhawarkua) — SAME COLLEGE as student-1!
    {
      uid: 'rm-student-4',
      citySlug: 'indore',
      preferredLocalities: ['bhawarkua', 'vijay-nagar'],
      budgetMinPaise: 650000,
      budgetMaxPaise: 850000,
      moveInBy: getRelativeDateStr(16),
      gender: 'male',
      preferredGender: 'any',
      lifestyle: {
        smoking: false,
        drinking: false,
        diet: 'eggetarian',
        pets: false,
        sleepSchedule: 'early',
        cleanliness: 4,
        guests: 'sometimes',
        studyHabits: 'quiet',
      },
      bio: 'MCA student at IIPS. Focused on studies, early riser, looking for peaceful roommate.',
      interests: ['coding', 'sports', 'travel', 'fitness'],
      college: 'IIPS Indore',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      phone: '+919876543204',
      email: 'ankit.k@example.com',
      fullName: 'Ankit Kumar',
    },
    // 5. Vikram S. — Bhopal (MP Nagar)
    {
      uid: 'rm-student-5',
      citySlug: 'bhopal',
      preferredLocalities: ['mp-nagar', 'arera-colony'],
      budgetMinPaise: 600000,
      budgetMaxPaise: 800000,
      moveInBy: getRelativeDateStr(15),
      gender: 'male',
      preferredGender: 'same',
      lifestyle: {
        smoking: false,
        drinking: false,
        diet: 'veg',
        pets: false,
        sleepSchedule: 'early',
        cleanliness: 4,
        guests: 'rarely',
        studyHabits: 'quiet',
      },
      bio: 'MANIT Bhopal undergrad. Looking for a neat 2BHK roommate around MP Nagar.',
      interests: ['gaming', 'reading', 'sports'],
      college: 'MANIT Bhopal',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      phone: '+919876543205',
      email: 'vikram.s@example.com',
      fullName: 'Vikram Singh',
    },
    // 6. Sneha P. — Bhopal (Arera Colony)
    {
      uid: 'rm-student-6',
      citySlug: 'bhopal',
      preferredLocalities: ['arera-colony', 'kolar-road'],
      budgetMinPaise: 800000,
      budgetMaxPaise: 1200000,
      moveInBy: getRelativeDateStr(30),
      gender: 'female',
      preferredGender: 'same',
      lifestyle: {
        smoking: false,
        drinking: false,
        diet: 'eggetarian',
        pets: true,
        sleepSchedule: 'flexible',
        cleanliness: 5,
        guests: 'sometimes',
        studyHabits: 'music',
      },
      bio: 'AIIMS Bhopal student. Neat, love music, studying for clinicals.',
      interests: ['dance', 'art', 'music', 'travel'],
      college: 'AIIMS Bhopal',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      phone: '+919876543206',
      email: 'sneha.p@example.com',
      fullName: 'Sneha Patel',
    },
    // 7. Aditya N. — Bhopal (Kolar Road)
    {
      uid: 'rm-student-7',
      citySlug: 'bhopal',
      preferredLocalities: ['mp-nagar', 'kolar-road'],
      budgetMinPaise: 500000,
      budgetMaxPaise: 700000,
      moveInBy: getRelativeDateStr(25),
      gender: 'male',
      preferredGender: 'any',
      lifestyle: {
        smoking: true,
        drinking: true,
        diet: 'non_veg',
        pets: true,
        sleepSchedule: 'late',
        cleanliness: 3,
        guests: 'often',
        studyHabits: 'flexible',
      },
      bio: 'BU Bhopal final year student. Social, friendly, looking for budget rooms.',
      interests: ['sports', 'fitness', 'gaming'],
      college: 'Barkatullah University Bhopal',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      phone: '+919876543207',
      email: 'aditya.n@example.com',
      fullName: 'Aditya Nair',
    },
    // 8. Neha G. — Pune (Kothrud)
    {
      uid: 'rm-student-8',
      citySlug: 'pune',
      preferredLocalities: ['kothrud', 'viman-nagar'],
      budgetMinPaise: 900000,
      budgetMaxPaise: 1400000,
      moveInBy: getRelativeDateStr(22),
      gender: 'female',
      preferredGender: 'same',
      lifestyle: {
        smoking: false,
        drinking: false,
        diet: 'veg',
        pets: false,
        sleepSchedule: 'early',
        cleanliness: 4,
        guests: 'sometimes',
        studyHabits: 'quiet',
      },
      bio: 'COEP techie. Looking for clean flatmates in Kothrud area.',
      interests: ['anime', 'coding', 'art', 'reading'],
      college: 'COEP Pune',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      phone: '+919876543208',
      email: 'neha.g@example.com',
      fullName: 'Neha Gupta',
    },
    // 9. Tanmay J. — Pune (Hinjewadi)
    {
      uid: 'rm-student-9',
      citySlug: 'pune',
      preferredLocalities: ['kothrud', 'hinjewadi'],
      budgetMinPaise: 800000,
      budgetMaxPaise: 1200000,
      moveInBy: getRelativeDateStr(35),
      gender: 'male',
      preferredGender: 'any',
      lifestyle: {
        smoking: false,
        drinking: false,
        diet: 'non_veg',
        pets: false,
        sleepSchedule: 'flexible',
        cleanliness: 3,
        guests: 'sometimes',
        studyHabits: 'music',
      },
      bio: 'MIT WPU student interning in Hinjewadi. Easy-going, loves road trips and music.',
      interests: ['travel', 'photography', 'music', 'coding'],
      college: 'MIT WPU Pune',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      phone: '+919876543209',
      email: 'tanmay.j@example.com',
      fullName: 'Tanmay Joshi',
    },
  ];
}

// ─── Initial Seed Requests ──────────────────────────────────────────

function createInitialSeedRequests(): StoredRoommateRequest[] {
  const now = new Date();
  const tMinus1d = new Date(now.getTime() - 86400000).toISOString();
  const tMinus3d = new Date(now.getTime() - 3 * 86400000).toISOString();
  const tMinus5d = new Date(now.getTime() - 5 * 86400000).toISOString();
  const expiresAt = new Date(now.getTime() + 14 * 86400000).toISOString();

  return [
    // 1. Incoming pending request from Rohan M. (rm-student-2) to student-1
    {
      id: 'rm-student-2_student-1',
      fromUid: 'rm-student-2',
      toUid: 'student-1',
      message:
        'Hey Rahul! Saw you are looking for a place near Vijay Nagar. I am also checking 2BHKs there. Let me know if you would like to team up!',
      status: 'pending',
      expiresAt,
      counterpart: {
        id: 'rm-student-2',
        displayName: 'Rohan M.',
        avatarUrl: null,
        citySlug: 'indore',
        preferredLocalities: ['vijay-nagar', 'palasia'],
        budgetMinPaise: 700000,
        budgetMaxPaise: 900000,
        moveInBy: getRelativeDateStr(20),
        gender: 'male',
        preferredGender: 'same',
        lifestyle: {
          smoking: false,
          drinking: false,
          diet: 'non_veg',
          pets: false,
          sleepSchedule: 'late',
          cleanliness: 3,
          guests: 'often',
          studyHabits: 'music',
        },
        bio: 'SGSITS 3rd year. Chill guy, love gaming on weekends and searching for a flat near Palasia.',
        interests: ['gaming', 'coding', 'fitness', 'movies'],
      },
      createdAt: tMinus1d,
      updatedAt: tMinus1d,
    },
    // 2. Incoming accepted request from Ankit K. (rm-student-4) to student-1
    {
      id: 'rm-student-4_student-1',
      fromUid: 'rm-student-4',
      toUid: 'student-1',
      message: 'Hi Rahul! We both study at IIPS and prefer early schedules. Would love to share an apartment.',
      status: 'accepted',
      expiresAt,
      respondedAt: tMinus3d,
      counterpart: {
        id: 'rm-student-4',
        displayName: 'Ankit K.',
        avatarUrl: null,
        citySlug: 'indore',
        preferredLocalities: ['bhawarkua', 'vijay-nagar'],
        budgetMinPaise: 650000,
        budgetMaxPaise: 850000,
        moveInBy: getRelativeDateStr(16),
        gender: 'male',
        preferredGender: 'any',
        lifestyle: {
          smoking: false,
          drinking: false,
          diet: 'eggetarian',
          pets: false,
          sleepSchedule: 'early',
          cleanliness: 4,
          guests: 'sometimes',
          studyHabits: 'quiet',
        },
        bio: 'MCA student at IIPS. Focused on studies, early riser, looking for peaceful roommate.',
        interests: ['coding', 'sports', 'travel', 'fitness'],
      },
      contact: {
        from: {
          uid: 'rm-student-4',
          displayName: 'Ankit Kumar',
          phone: '+919876543204',
          email: 'ankit.k@example.com',
          college: 'IIPS Indore',
        },
        to: {
          uid: 'student-1',
          displayName: 'Rahul Sharma',
          phone: '+919876543210',
          email: 'rahul.sharma@example.com',
          college: 'IIPS Indore',
        },
      },
      createdAt: tMinus5d,
      updatedAt: tMinus3d,
    },
    // 3. Outgoing declined request from student-1 to Priya S. (rm-student-3)
    {
      id: 'student-1_rm-student-3',
      fromUid: 'student-1',
      toUid: 'rm-student-3',
      message: 'Hi Priya, let me know if you are looking for flatmates around Palasia.',
      status: 'declined',
      expiresAt,
      respondedAt: tMinus5d,
      counterpart: {
        id: 'rm-student-3',
        displayName: 'Priya S.',
        avatarUrl: null,
        citySlug: 'indore',
        preferredLocalities: ['palasia', 'sapna-sangeeta'],
        budgetMinPaise: 500000,
        budgetMaxPaise: 750000,
        moveInBy: getRelativeDateStr(10),
        gender: 'female',
        preferredGender: 'same',
        lifestyle: {
          smoking: false,
          drinking: false,
          diet: 'veg',
          pets: true,
          sleepSchedule: 'flexible',
          cleanliness: 4,
          guests: 'rarely',
          studyHabits: 'quiet',
        },
        bio: 'DAVV student. Quiet, vegetarian, loves reading and plant parenting.',
        interests: ['yoga', 'reading', 'cooking', 'art'],
      },
      createdAt: tMinus5d,
      updatedAt: tMinus5d,
    },
  ];
}

// ─── Compatibility Scoring Pure Function ────────────────────────────

export interface ScoreResult {
  score: number;
  reasons: string[];
}

export function computeCompatibilityScore(
  viewer: StoredRoommateProfile,
  candidate: StoredRoommateProfile,
): ScoreResult | null {
  // Hard filters
  if (viewer.citySlug !== candidate.citySlug) return null;
  if (!candidate.isActive) return null;
  if (candidate.uid === viewer.uid) return null;

  // Gender preference satisfied both ways
  const viewerSatisfied =
    viewer.preferredGender === 'any' ||
    (viewer.preferredGender === 'same' &&
      viewer.gender !== 'undisclosed' &&
      candidate.gender === viewer.gender);

  const candidateSatisfied =
    candidate.preferredGender === 'any' ||
    (candidate.preferredGender === 'same' &&
      candidate.gender !== 'undisclosed' &&
      viewer.gender === candidate.gender);

  if (!viewerSatisfied || !candidateSatisfied) return null;

  // Budget overlap
  const overlapMin = Math.max(viewer.budgetMinPaise, candidate.budgetMinPaise);
  const overlapMax = Math.min(viewer.budgetMaxPaise, candidate.budgetMaxPaise);
  if (overlapMin > overlapMax) return null; // No overlap

  // |moveInBy Δ| <= 45 days
  const viewerDate = parseISO(viewer.moveInBy);
  const candidateDate = parseISO(candidate.moveInBy);
  const diffDays = Math.abs(differenceInCalendarDays(viewerDate, candidateDate));
  if (diffDays > 45) return null;

  // Weighted score calculation & reasons candidate pool
  interface ComponentScore {
    name: string;
    points: number;
    reason: string | null;
  }
  const components: ComponentScore[] = [];

  // 1. Budget overlap (Weight: 20)
  const overlap = overlapMax - overlapMin;
  const viewerRange = viewer.budgetMaxPaise - viewer.budgetMinPaise;
  const candidateRange = candidate.budgetMaxPaise - candidate.budgetMinPaise;
  const smallerRange = Math.min(viewerRange, candidateRange);
  let budgetScore = 0;
  if (smallerRange === 0) {
    budgetScore = 20;
  } else {
    budgetScore = Math.min(20, (overlap / smallerRange) * 20);
  }
  const overlapLabel = `Budgets overlap ${formatINR(overlapMin)}–${formatINR(overlapMax)}`;
  components.push({
    name: 'budget',
    points: budgetScore,
    reason: budgetScore > 0 ? overlapLabel : null,
  });

  // 2. Move-in proximity (Weight: 10)
  const moveInScore = Math.max(0, (1 - diffDays / 45) * 10);
  components.push({
    name: 'moveIn',
    points: moveInScore,
    reason:
      diffDays === 0
        ? 'Same move-in date'
        : diffDays <= 15
          ? `Move-in within ${diffDays} days`
          : 'Similar move-in timeline',
  });

  // 3. Locality overlap (Weight: 15, Jaccard, neutral 0.5 if either empty)
  let localityScore = 7.5;
  let localityReason: string | null = null;
  if (viewer.preferredLocalities.length > 0 && candidate.preferredLocalities.length > 0) {
    const vSet = new Set(viewer.preferredLocalities);
    const cSet = new Set(candidate.preferredLocalities);
    const intersection = [...vSet].filter((x) => cSet.has(x)).length;
    const union = new Set([...vSet, ...cSet]).size;
    const jaccard = union > 0 ? intersection / union : 0.5;
    localityScore = jaccard * 15;
    if (intersection > 0) {
      localityReason = 'Overlapping preferred localities';
    }
  } else {
    localityReason = 'Flexible on localities';
  }
  components.push({
    name: 'locality',
    points: localityScore,
    reason: localityReason,
  });

  // 4. Smoking / drinking / pets (Weight: 15, 5 each)
  let habitPoints = 0;
  let habitReason: string | null = null;
  if (viewer.lifestyle.smoking === candidate.lifestyle.smoking) {
    habitPoints += 5;
    if (!viewer.lifestyle.smoking) habitReason = 'Both non-smokers';
  }
  if (viewer.lifestyle.drinking === candidate.lifestyle.drinking) {
    habitPoints += 5;
    if (!viewer.lifestyle.drinking && !habitReason) habitReason = 'Both non-drinkers';
  }
  if (viewer.lifestyle.pets === candidate.lifestyle.pets) {
    habitPoints += 5;
    if (viewer.lifestyle.pets && !habitReason) habitReason = 'Both pet friendly';
  }
  components.push({
    name: 'habits',
    points: habitPoints,
    reason: habitReason ?? (habitPoints > 0 ? 'Compatible household habits' : null),
  });

  // 5. Diet (Weight: 5)
  let dietPoints = 0;
  let dietReason: string | null = null;
  if (
    (viewer.lifestyle.diet === 'veg' && candidate.lifestyle.diet === 'non_veg') ||
    (viewer.lifestyle.diet === 'non_veg' && candidate.lifestyle.diet === 'veg')
  ) {
    dietPoints = 0;
  } else {
    dietPoints = 5;
    if (viewer.lifestyle.diet === 'veg' && candidate.lifestyle.diet === 'veg') {
      dietReason = 'Both vegetarian';
    } else {
      dietReason = 'Compatible diet preferences';
    }
  }
  components.push({
    name: 'diet',
    points: dietPoints,
    reason: dietReason,
  });

  // 6. Sleep schedule (Weight: 10)
  let sleepPoints = 0;
  let sleepReason: string | null = null;
  if (
    viewer.lifestyle.sleepSchedule === candidate.lifestyle.sleepSchedule ||
    viewer.lifestyle.sleepSchedule === 'flexible' ||
    candidate.lifestyle.sleepSchedule === 'flexible'
  ) {
    sleepPoints = 10;
    if (
      viewer.lifestyle.sleepSchedule === 'early' &&
      candidate.lifestyle.sleepSchedule === 'early'
    ) {
      sleepReason = 'Both early risers';
    } else if (
      viewer.lifestyle.sleepSchedule === 'late' &&
      candidate.lifestyle.sleepSchedule === 'late'
    ) {
      sleepReason = 'Both night owls';
    } else {
      sleepReason = 'Compatible sleep schedules';
    }
  }
  components.push({
    name: 'sleep',
    points: sleepPoints,
    reason: sleepReason,
  });

  // 7. Cleanliness (Weight: 10, 1 - abs(Δ)/4)
  const cleanDelta = Math.abs(viewer.lifestyle.cleanliness - candidate.lifestyle.cleanliness);
  const cleanScore = Math.max(0, (1 - cleanDelta / 4) * 10);
  components.push({
    name: 'cleanliness',
    points: cleanScore,
    reason: cleanDelta <= 1 ? 'Similar cleanliness standards' : null,
  });

  // 8. Guests / study habits (Weight: 5)
  const guestsMatch = viewer.lifestyle.guests === candidate.lifestyle.guests ? 1 : 0;
  const studyMatch =
    viewer.lifestyle.studyHabits === candidate.lifestyle.studyHabits ||
    viewer.lifestyle.studyHabits === 'flexible' ||
    candidate.lifestyle.studyHabits === 'flexible'
      ? 1
      : 0;
  const guestStudyPoints = ((guestsMatch + studyMatch) / 2) * 5;
  components.push({
    name: 'guestStudy',
    points: guestStudyPoints,
    reason: guestStudyPoints >= 3 ? 'Compatible study & guest habits' : null,
  });

  // 9. Interests (Weight: 5, Jaccard, neutral 0.5 if either empty)
  let interestPoints = 2.5;
  let interestReason: string | null = null;
  if (viewer.interests.length > 0 && candidate.interests.length > 0) {
    const cSet = new Set(candidate.interests);
    const shared = viewer.interests.filter((x) => cSet.has(x));
    const union = new Set([...viewer.interests, ...candidate.interests]).size;
    const jaccard = union > 0 ? shared.length / union : 0.5;
    interestPoints = jaccard * 5;
    if (shared.length > 0) {
      interestReason = 'Shared interests';
    }
  }
  components.push({
    name: 'interests',
    points: interestPoints,
    reason: interestReason,
  });

  // 10. Same college (Weight: 5 bonus)
  let collegePoints = 0;
  let collegeReason: string | null = null;
  if (
    viewer.college &&
    candidate.college &&
    viewer.college.trim().toLowerCase() === candidate.college.trim().toLowerCase()
  ) {
    collegePoints = 5;
    collegeReason = 'Same college';
  }
  components.push({
    name: 'college',
    points: collegePoints,
    reason: collegeReason,
  });

  const rawTotal = components.reduce((acc, c) => acc + c.points, 0);
  const finalScore = Math.max(0, Math.min(100, Math.round(rawTotal)));

  // Select up to 3 highest scoring reasons with positive match
  const eligible = components
    .filter((c) => c.points > 0 && c.reason !== null)
    .sort((a, b) => b.points - a.points);

  const reasons = eligible.slice(0, 3).map((c) => c.reason as string);

  return {
    score: finalScore,
    reasons,
  };
}

// ─── Roommates Mock Backend Store ───────────────────────────────────

class RoommatesMockStore {
  private profiles: Map<string, StoredRoommateProfile> = new Map();
  private requests: StoredRoommateRequest[] = [];
  private blockedPairs: Set<string> = new Set();

  constructor() {
    this.reset();
  }

  reset() {
    this.profiles.clear();
    for (const p of createInitialSeedProfiles()) {
      this.profiles.set(p.uid, { ...p });
    }
    this.requests = createInitialSeedRequests();
    this.blockedPairs.clear();
  }

  private getCurrentUserId(): string {
    const user = useSessionStore.getState().user;
    return user?.id || 'student-1';
  }

  private getPublicRoommateDto(profile: StoredRoommateProfile): PublicRoommateDto {
    const parts = profile.fullName.trim().split(/\s+/);
    const first = parts[0] ?? '';
    const lastInitial = parts.length > 1 ? ` ${parts[parts.length - 1]?.charAt(0)}.` : '';
    const displayName = `${first}${lastInitial}`.trim() || profile.fullName;

    return {
      id: profile.uid,
      displayName,
      avatarUrl: null,
      citySlug: profile.citySlug,
      preferredLocalities: profile.preferredLocalities,
      budgetMinPaise: profile.budgetMinPaise,
      budgetMaxPaise: profile.budgetMaxPaise,
      moveInBy: profile.moveInBy,
      gender: profile.gender,
      preferredGender: profile.preferredGender,
      lifestyle: profile.lifestyle,
      bio: profile.bio,
      interests: profile.interests,
    };
  }

  // ─── Endpoints ──────────────────────────────────────────────────

  async getProfile(): Promise<RoommateProfileDto> {
    await simulateLatency();
    if (shouldInjectError()) throw getInjectedError();

    const currentUid = this.getCurrentUserId();
    const profile = this.profiles.get(currentUid);
    if (!profile) {
      throw createMockError(404, ErrorCodes.NOT_FOUND, 'Profile not found');
    }

    return {
      citySlug: profile.citySlug,
      preferredLocalities: profile.preferredLocalities,
      budgetMinPaise: profile.budgetMinPaise,
      budgetMaxPaise: profile.budgetMaxPaise,
      moveInBy: profile.moveInBy,
      gender: profile.gender,
      preferredGender: profile.preferredGender,
      lifestyle: profile.lifestyle,
      bio: profile.bio,
      interests: profile.interests,
      college: profile.college,
      isActive: profile.isActive,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  async upsertProfile(dto: UpsertRoommateProfileDto): Promise<RoommateProfileDto> {
    await simulateLatency();
    if (shouldInjectError()) throw getInjectedError();

    const currentUid = this.getCurrentUserId();
    const existing = this.profiles.get(currentUid);

    // Gender check: if preferredGender is same and gender is undisclosed
    const sessionUser = useSessionStore.getState().user;
    const gender = existing?.gender ?? 'male'; // student-1 is male
    if (dto.preferredGender === 'same' && gender === 'undisclosed') {
      throw createMockError(400, ErrorCodes.GENDER_REQUIRED, 'Gender required');
    }

    const now = new Date().toISOString();
    const isActive = existing ? existing.isActive : true;

    const stored: StoredRoommateProfile = {
      uid: currentUid,
      citySlug: dto.citySlug,
      preferredLocalities: dto.preferredLocalities,
      budgetMinPaise: dto.budgetMinPaise,
      budgetMaxPaise: dto.budgetMaxPaise,
      moveInBy: dto.moveInBy,
      gender,
      preferredGender: dto.preferredGender,
      lifestyle: dto.lifestyle,
      bio: dto.bio,
      interests: dto.interests,
      college: dto.college,
      isActive,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
      phone: sessionUser?.phone ?? '+919876543210',
      email: sessionUser?.email ?? 'rahul.sharma@example.com',
      fullName: sessionUser?.displayName ?? 'Rahul Sharma',
    };

    this.profiles.set(currentUid, stored);

    return {
      citySlug: stored.citySlug,
      preferredLocalities: stored.preferredLocalities,
      budgetMinPaise: stored.budgetMinPaise,
      budgetMaxPaise: stored.budgetMaxPaise,
      moveInBy: stored.moveInBy,
      gender: stored.gender,
      preferredGender: stored.preferredGender,
      lifestyle: stored.lifestyle,
      bio: stored.bio,
      interests: stored.interests,
      college: stored.college,
      isActive: stored.isActive,
      createdAt: stored.createdAt,
      updatedAt: stored.updatedAt,
    };
  }

  async setProfileActive(active: boolean): Promise<RoommateProfileDto> {
    await simulateLatency();
    if (shouldInjectError()) throw getInjectedError();

    const currentUid = this.getCurrentUserId();
    const profile = this.profiles.get(currentUid);
    if (!profile) {
      throw createMockError(404, ErrorCodes.NOT_FOUND, 'Profile not found');
    }

    if (active && profile.preferredGender === 'same' && profile.gender === 'undisclosed') {
      throw createMockError(400, ErrorCodes.GENDER_REQUIRED, 'Gender required');
    }

    profile.isActive = active;
    profile.updatedAt = new Date().toISOString();

    if (!active) {
      // Deactivating: decline incoming pending, cancel outgoing pending
      for (const req of this.requests) {
        if (req.toUid === currentUid && req.status === 'pending') {
          req.status = 'declined';
          req.updatedAt = new Date().toISOString();
        } else if (req.fromUid === currentUid && req.status === 'pending') {
          req.status = 'cancelled';
          req.updatedAt = new Date().toISOString();
        }
      }
    }

    return {
      citySlug: profile.citySlug,
      preferredLocalities: profile.preferredLocalities,
      budgetMinPaise: profile.budgetMinPaise,
      budgetMaxPaise: profile.budgetMaxPaise,
      moveInBy: profile.moveInBy,
      gender: profile.gender,
      preferredGender: profile.preferredGender,
      lifestyle: profile.lifestyle,
      bio: profile.bio,
      interests: profile.interests,
      college: profile.college,
      isActive: profile.isActive,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  async getMatches(limit: number = 50): Promise<RoommateMatchesDto> {
    await simulateLatency();
    if (shouldInjectError()) throw getInjectedError();

    const currentUid = this.getCurrentUserId();
    const viewer = this.profiles.get(currentUid);
    if (!viewer || !viewer.isActive) {
      throw createMockError(403, ErrorCodes.PROFILE_REQUIRED, 'Active profile required');
    }

    const scoredItems: RoommateMatchDto[] = [];

    for (const [uid, candidate] of this.profiles.entries()) {
      if (uid === currentUid) continue;
      if (
        this.blockedPairs.has(`${currentUid}_${uid}`) ||
        this.blockedPairs.has(`${uid}_${currentUid}`)
      ) {
        continue;
      }

      const result = computeCompatibilityScore(viewer, candidate);
      if (result) {
        scoredItems.push({
          profile: this.getPublicRoommateDto(candidate),
          score: result.score,
          reasons: result.reasons,
        });
      }
    }

    // Sort descending by score, tiebreak by id
    scoredItems.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.profile.id.localeCompare(b.profile.id);
    });

    const items = scoredItems.slice(0, limit);

    return {
      items,
      computedAt: new Date().toISOString(),
    };
  }

  async sendRequest(params: { toUid: string; message?: string }): Promise<RoommateRequestDto> {
    await simulateLatency();
    if (shouldInjectError()) throw getInjectedError();

    const currentUid = this.getCurrentUserId();
    const viewer = this.profiles.get(currentUid);
    if (!viewer || !viewer.isActive) {
      throw createMockError(403, ErrorCodes.PROFILE_REQUIRED, 'Active profile required');
    }

    if (params.toUid === currentUid) {
      throw createMockError(400, ErrorCodes.CANNOT_ACT_ON_SELF, 'Cannot send request to yourself');
    }

    const target = this.profiles.get(params.toUid);
    if (!target || !target.isActive) {
      throw createMockError(400, ErrorCodes.TARGET_INACTIVE, 'Target profile is inactive');
    }

    if (
      this.blockedPairs.has(`${currentUid}_${params.toUid}`) ||
      this.blockedPairs.has(`${params.toUid}_${currentUid}`)
    ) {
      throw createMockError(403, ErrorCodes.BLOCKED, 'User is blocked');
    }

    // Check gender policy compatibility
    const viewerSatisfied =
      viewer.preferredGender === 'any' ||
      (viewer.preferredGender === 'same' &&
        viewer.gender !== 'undisclosed' &&
        target.gender === viewer.gender);

    const targetSatisfied =
      target.preferredGender === 'any' ||
      (target.preferredGender === 'same' &&
        target.gender !== 'undisclosed' &&
        viewer.gender === target.gender);

    if (!viewerSatisfied || !targetSatisfied) {
      throw createMockError(400, ErrorCodes.GENDER_POLICY_MISMATCH, 'Gender preference mismatch');
    }

    // Check duplicate request
    const existingDirect = this.requests.find(
      (r) => r.fromUid === currentUid && r.toUid === params.toUid,
    );
    if (
      existingDirect &&
      (existingDirect.status === 'pending' ||
        existingDirect.status === 'accepted' ||
        existingDirect.status === 'declined')
    ) {
      throw createMockError(409, ErrorCodes.DUPLICATE_REQUEST, 'Duplicate request');
    }

    const existingReverse = this.requests.find(
      (r) => r.fromUid === params.toUid && r.toUid === currentUid,
    );
    if (existingReverse && existingReverse.status === 'accepted') {
      throw createMockError(409, ErrorCodes.DUPLICATE_REQUEST, 'Already matched');
    }

    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 14 * 86400000).toISOString();

    // Mutual match auto-accept
    if (existingReverse && existingReverse.status === 'pending') {
      const contact: { from: RoommateContactDto; to: RoommateContactDto } = {
        from: {
          uid: currentUid,
          displayName: viewer.fullName,
          phone: viewer.phone,
          email: viewer.email,
          college: viewer.college,
        },
        to: {
          uid: target.uid,
          displayName: target.fullName,
          phone: target.phone,
          email: target.email,
          college: target.college,
        },
      };

      existingReverse.status = 'accepted';
      existingReverse.respondedAt = now;
      existingReverse.contact = {
        from: contact.to,
        to: contact.from,
      };
      existingReverse.updatedAt = now;

      const newReq: StoredRoommateRequest = {
        id: `${currentUid}_${params.toUid}`,
        fromUid: currentUid,
        toUid: params.toUid,
        message: params.message?.trim() ?? '',
        status: 'accepted',
        expiresAt,
        respondedAt: now,
        counterpart: this.getPublicRoommateDto(target),
        contact,
        createdAt: now,
        updatedAt: now,
      };
      this.requests.push(newReq);
      return newReq;
    }

    // Standard pending request
    const newReq: StoredRoommateRequest = {
      id: `${currentUid}_${params.toUid}`,
      fromUid: currentUid,
      toUid: params.toUid,
      message: params.message?.trim() ?? '',
      status: 'pending',
      expiresAt,
      counterpart: this.getPublicRoommateDto(target),
      createdAt: now,
      updatedAt: now,
    };

    // If an old cancelled/expired request exists, replace it
    const existingIndex = this.requests.findIndex(
      (r) => r.fromUid === currentUid && r.toUid === params.toUid,
    );
    if (existingIndex >= 0) {
      this.requests[existingIndex] = newReq;
    } else {
      this.requests.push(newReq);
    }

    return newReq;
  }

  async listRequests(params?: {
    direction?: 'incoming' | 'outgoing';
    status?: string;
    cursor?: string | null;
    limit?: number;
  }): Promise<Page<RoommateRequestDto>> {
    await simulateLatency();
    if (shouldInjectError()) throw getInjectedError();

    const currentUid = this.getCurrentUserId();
    const direction = params?.direction ?? 'incoming';
    const limit = params?.limit ?? 20;
    const offset = decodeCursor(params?.cursor);

    let filtered = this.requests.filter((r) => {
      if (direction === 'incoming') {
        return r.toUid === currentUid;
      } else {
        return r.fromUid === currentUid;
      }
    });

    if (params?.status) {
      filtered = filtered.filter((r) => r.status === params.status);
    }

    // Sort newest first
    filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const total = filtered.length;
    const paged = filtered.slice(offset, offset + limit);
    const hasMore = offset + limit < total;
    const nextCursor = hasMore ? encodeCursor(offset + limit) : null;

    // Build counterpart & contact if needed
    const items = paged.map((req) => {
      const counterpartUid = direction === 'incoming' ? req.fromUid : req.toUid;
      const counterpartProfile = this.profiles.get(counterpartUid);
      const counterpart = counterpartProfile
        ? this.getPublicRoommateDto(counterpartProfile)
        : null;

      return {
        ...req,
        counterpart,
      };
    });

    return {
      items,
      nextCursor,
      hasMore,
    };
  }

  async actOnRequest(
    id: string,
    action: RoommateRequestActionDto['action'],
  ): Promise<RoommateRequestDto> {
    await simulateLatency();
    if (shouldInjectError()) throw getInjectedError();

    const currentUid = this.getCurrentUserId();
    const req = this.requests.find((r) => r.id === id);
    if (!req) {
      throw createMockError(404, ErrorCodes.NOT_FOUND, 'Request not found');
    }

    const isRecipient = req.toUid === currentUid;
    const isSender = req.fromUid === currentUid;

    if (!isRecipient && !isSender) {
      throw createMockError(404, ErrorCodes.NOT_FOUND, 'Not party to request');
    }

    const now = new Date().toISOString();

    if (action === 'accept') {
      if (!isRecipient) {
        throw createMockError(403, ErrorCodes.FORBIDDEN, 'Only recipient can accept');
      }
      if (req.status !== 'pending') {
        throw createMockError(409, ErrorCodes.INVALID_TRANSITION, 'Request is not pending');
      }

      const senderProfile = this.profiles.get(req.fromUid);
      const recipientProfile = this.profiles.get(req.toUid);

      req.status = 'accepted';
      req.respondedAt = now;
      req.updatedAt = now;
      req.contact = {
        from: {
          uid: req.fromUid,
          displayName: senderProfile?.fullName ?? 'Student',
          phone: senderProfile?.phone,
          email: senderProfile?.email,
          college: senderProfile?.college,
        },
        to: {
          uid: req.toUid,
          displayName: recipientProfile?.fullName ?? 'Student',
          phone: recipientProfile?.phone,
          email: recipientProfile?.email,
          college: recipientProfile?.college,
        },
      };

      return req;
    }

    if (action === 'decline') {
      if (!isRecipient) {
        throw createMockError(403, ErrorCodes.FORBIDDEN, 'Only recipient can decline');
      }
      if (req.status !== 'pending') {
        throw createMockError(409, ErrorCodes.INVALID_TRANSITION, 'Request is not pending');
      }

      req.status = 'declined';
      req.respondedAt = now;
      req.updatedAt = now;
      return req;
    }

    if (action === 'cancel') {
      if (!isSender) {
        throw createMockError(403, ErrorCodes.FORBIDDEN, 'Only sender can cancel');
      }
      if (req.status !== 'pending') {
        throw createMockError(409, ErrorCodes.INVALID_TRANSITION, 'Request is not pending');
      }

      req.status = 'cancelled';
      req.updatedAt = now;
      return req;
    }

    if (action === 'block') {
      if (!isRecipient) {
        throw createMockError(403, ErrorCodes.FORBIDDEN, 'Only recipient can block');
      }
      if (req.status !== 'pending' && req.status !== 'declined') {
        throw createMockError(409, ErrorCodes.INVALID_TRANSITION, 'Cannot block in this state');
      }

      req.status = 'declined';
      req.blocked = true;
      req.updatedAt = now;
      this.blockedPairs.add(`${req.toUid}_${req.fromUid}`);
      this.blockedPairs.add(`${req.fromUid}_${req.toUid}`);
      return req;
    }

    throw createMockError(400, ErrorCodes.VALIDATION_FAILED, 'Unknown action');
  }
}

// ─── Singleton & Public Exports ─────────────────────────────────────

let mockInstance: RoommatesMockStore | null = null;

export function getRoommatesMock(): RoommatesMockStore {
  if (!mockInstance) {
    mockInstance = new RoommatesMockStore();
  }
  return mockInstance;
}

export function resetRoommatesMock(): void {
  if (!mockInstance) {
    mockInstance = new RoommatesMockStore();
  } else {
    mockInstance.reset();
  }
}

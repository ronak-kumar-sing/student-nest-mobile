/**
 * Search / explore filters store.
 *
 * All budget values are in **paise**.
 * Dates are ISO 8601 UTC strings.
 */

import { create } from 'zustand';

// ─── Types ──────────────────────────────────────────────────────────

export type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest';

export interface FiltersState {
  /** Selected city filter */
  city: string | null;

  /** Free-text search query */
  query: string;

  /** Minimum budget in paise */
  budgetMin: number | null;

  /** Maximum budget in paise */
  budgetMax: number | null;

  /** Room types: single, double, triple, dormitory, etc. */
  roomTypes: string[];

  /** Gender policy: male, female, co-ed */
  genderPolicy: string | null;

  /** Selected amenity slugs */
  amenities: string[];

  /** Whether food is included — `null` means "any" */
  foodIncluded: boolean | null;

  /** Rooms available by this ISO date */
  availableBy: string | null;

  /** Current sort order */
  sortBy: SortOption;

  /** Set a single filter value */
  setFilter: <
    K extends keyof Omit<FiltersState, 'setFilter' | 'resetFilters' | 'activeFilterCount'>,
  >(
    key: K,
    value: FiltersState[K],
  ) => void;

  /** Reset all filters to defaults */
  resetFilters: () => void;

  /** Count of non-default filters (for the badge) */
  activeFilterCount: () => number;
}

// ─── Defaults ───────────────────────────────────────────────────────

const defaultFilters = {
  city: null,
  query: '',
  budgetMin: null,
  budgetMax: null,
  roomTypes: [] as string[],
  genderPolicy: null,
  amenities: [] as string[],
  foodIncluded: null,
  availableBy: null,
  sortBy: 'relevance' as SortOption,
} as const;

// ─── Store ──────────────────────────────────────────────────────────

export const useFiltersStore = create<FiltersState>()((set, get) => ({
  ...defaultFilters,

  setFilter: (key, value) => set({ [key]: value }),

  resetFilters: () => set({ ...defaultFilters }),

  activeFilterCount: () => {
    const state = get();
    let count = 0;

    if (state.city !== null) count++;
    if (state.budgetMin !== null) count++;
    if (state.budgetMax !== null) count++;
    if (state.roomTypes.length > 0) count++;
    if (state.genderPolicy !== null) count++;
    if (state.amenities.length > 0) count++;
    if (state.foodIncluded !== null) count++;
    if (state.availableBy !== null) count++;
    if (state.sortBy !== 'relevance') count++;

    return count;
  },
}));

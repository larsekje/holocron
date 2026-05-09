import { create } from 'zustand';

export type SpotlightEntityType =
  | 'talent'
  | 'rule'
  | 'weapon'
  | 'adversary'
  | 'gear'
  | 'armor'
  | 'skill'
  | 'vehicle'
  | 'career'
  | 'specialization'
  | 'species'
  | 'forcepower'
  | 'attachment'
  | 'quality';

export interface SpotlightResult {
  id: string;
  type: SpotlightEntityType;
  name: string;
  subtitle?: string;
  tags?: string[];
  named?: boolean; // Adversary-only: whether the entry is a named character.
  matches?: number[]; // Match indexes against `name`, for highlighted rendering.
  detail?: SpotlightDetail;
}

export interface SpotlightDetail {
  id: string;
  type: SpotlightEntityType;
  name: string;
  html?: string;
  markdown?: string;
  description?: string;
  category?: string;
  [k: string]: any;
}

interface SpotlightState {
  isOpen: boolean;
  /** When set, the next open should pre-scope the type filter to these
   * entries (e.g. "Add starship" → only `vehicle`). Cleared on close. */
  initialTypes?: SpotlightEntityType[];
  open: (initialTypes?: SpotlightEntityType[]) => void;
  close: () => void;
}

export const useSpotlightStore = create<SpotlightState>((set) => ({
  isOpen: false,
  initialTypes: undefined,
  open: (initialTypes) => set({ isOpen: true, initialTypes }),
  close: () => set({ isOpen: false, initialTypes: undefined }),
}));

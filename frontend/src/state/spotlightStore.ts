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
  open: () => void;
  close: () => void;
}

export const useSpotlightStore = create<SpotlightState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));

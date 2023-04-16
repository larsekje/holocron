import { create } from 'zustand'

import talents from './assets/data/talents.json';
import {nanoid} from "nanoid";

export interface Talent {
  name: string;
  description: string;
  ranked?: boolean;
}

interface DataStore {
  talents: Talent[];
}

// enforce id
const idify = <T>(data: T[]) => {
  return data.map(item => ({
    id: nanoid(),
    ...item,
  }))
}


export const useDataStore = create<DataStore>(set => ({
  talents: idify(talents),
}));

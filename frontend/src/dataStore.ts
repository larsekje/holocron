import {create} from 'zustand'

import talents from './assets/data/talents.json';

export const id = function id(input: string) {
  return input.trim().normalize("NFD").replace(/[^a-z0-9\-\s]/gi, '').replace(/\s{1,}/g, "-").toLowerCase();
}

export interface Data {
  id: string;
  name: string;
}

export interface Talent extends Data {
  name: string;
  description: string;
  ranked?: boolean;
}

interface DataStore {
  talents: Talent[];
  getTalent: (name: string) => Talent | undefined;
}

// enforce id
const idify = <T extends Data>(data: Omit<T, 'id'>[]) => {
  return data.map(item => ({
    ...item,
    id: id(item.name),
  }))
}


export const useDataStore = create<DataStore>((set, get) => ({
  talents: idify(talents) as Talent[],
  getTalent: (name) => {
    const lookUpId = id(name.replace(/\s\d+$/, ""));
    return get().talents.find(i => i.id === lookUpId);
  }
}));

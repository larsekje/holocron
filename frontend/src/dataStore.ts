import {create} from 'zustand'

import talents from './assets/data/talents.json';
import {useEffect} from "react";

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

// enforce id
const idify = <T extends Data>(data: Omit<T, 'id'>[]) => {
  return data.map(item => ({
    ...item,
    id: id(item.name),
  }))
}

interface DataStore {
  loading: boolean;
  setLoading: (loading: boolean) => void;

  talents: Talent[];
  getTalent: (name: string) => Talent | undefined;
  setTalents: (talents: Talent[]) => void;
}

export const useDataStore = create<DataStore>((set, get) => ({
  loading: true,
  setLoading: loading => set({loading}),

  talents: [],
  setTalents: talents => set({talents}),
  getTalent: (name) => {
    const lookUpId = id(name.replace(/\s\d+$/, ""));
    return get().talents.find(i => i.id === lookUpId);
  },
}));

// load from public/assets/data/${file}.json and store in zustand
export function useLoadData() {
  const setLoading = useDataStore(state => state.setLoading);
  const setTalents = useDataStore(state => state.setTalents);

  // files to load (and their setters)
  const files: string[] = ["talents"];
  const setters = [setTalents];

  useEffect(() => {
    Promise.all(
      files.map((file, index) =>
        fetch(`/assets/data/${file}.json`)
          .then(response => response.json())
          .then((data: Omit<Talent, 'id'>[]) => idify<Talent>(data) as Talent[])
          .then(data => setters[index](data))
      )
    )
      .then(() => setLoading(false))
      .catch(error => console.error(error));
  }, [files, setters, setLoading]);
}


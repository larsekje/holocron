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

export interface Adversary extends Data {
  name: string;
  description: string;
  type: string;
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

  adversaries: Adversary[];
  getAdversary: (name: string) => Adversary | undefined;
  setAdversaries: (adversaries: Adversary[]) => void;
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

  adversaries: [],
  setAdversaries: adversaries => set({adversaries}),
  getAdversary: (name) => {
    const lookUpId = id(name);
    return get().adversaries.find(i => i.id === lookUpId);
  },
}));

type SetData<T> = (data: T[]) => void;

// load from public/assets/data/${file}.json and store in zustand
export function useLoadData() {
  const setLoading = useDataStore(state => state.setLoading);
  const setTalents = useDataStore(state => state.setTalents);
  const setAdversaries = useDataStore(state => state.setAdversaries);

  // files to load (and their setters)
  const files: string[] = ["talents", "adversaries"];
  const setters = [setTalents, setAdversaries].map(fn => fn as SetData<Data>);

  useEffect(() => {
    Promise.all(
      files.map((file, index) =>
        fetch(`/assets/data/${file}.json`)
          .then(response => response.json())
          .then((data: Omit<Data, 'id'>[]) => idify<Data>(data) as Data[])
          .then(data => setters[index](data))
      )
    )
      .then(() => setLoading(false))
      .catch(error => console.error(error));
  }, [files, setters, setLoading]);
}


/**
 * activeVehicleStore — instance-level state for vehicles currently in the
 * encounter. The Spotlight index (immutable library) is the source of vehicle
 * specs; `add()` creates an instance here that tracks per-encounter mutable
 * state (hull, system strain, crits). Vehicles are first-class encounter
 * entities and render in their own "Ships and vehicles" target subsection.
 *
 * Multi-crew is a first-class case: multiple Participants can share the same
 * ActiveVehicle.id (Han + Chewie + passengers on the Falcon). Damage applied
 * to the ship routes to the shared instance — every occupant sees it.
 *
 * Crew linkage: a Participant can `enter` a vehicle (their `equippedVehicleId`
 * + `vehicleRole` get set) and `removeOccupant`/leave to clear it. Entering
 * does not transform the participant's combat surface — the *ship* is the
 * one that takes hits in starship combat; the participant remains a
 * participant.
 */
import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { CritInjury } from '@/data/critTable';
import useParticipantStore, { type VehicleRole } from './participantsStore';

/** Visible reminder of a maneuver/action that's currently in play (Evasive
 * Maneuvers, Boost Shields, etc.). Tracked on the vehicle as a chip the GM
 * can clear when its window has passed. No automatic decay or rules-engine
 * influence — pure mental-load aid per the holocron scope. */
export interface VehicleEffect {
  id: string;
  /** The move id this effect originated from (for de-duplication and the
   * eventual auto-decay hookup). */
  moveId: string;
  /** Display name shown in the chip. */
  name: string;
  /** Optional one-line note shown in the tooltip. */
  note?: string;
  appliedAt: number;
}

export interface VehicleWeapon {
  name: string;
  damage?: number | null;
  critical?: number | null;
  range?: string;
  qualities?: string[];
}

export interface ActiveVehicle {
  id: string;
  /** Stable id from the spotlight entry — lets us re-render detail
   * state if the same vehicle is referenced again. */
  vehicleId: string;
  name: string;
  // Immutable spec — copied off the spotlight entry on add
  silhouette: number;
  speed: number;
  handling: string;
  armor: number;
  /** Single Genesys defense value (per-arc collapsed by the converter). */
  defense: number;
  hullThreshold: number;
  systemThreshold: number;
  weapons: VehicleWeapon[];
  vehicleInfo: Record<string, any>;
  // Mutable state
  hullCurrent: number;
  systemCurrent: number;
  /** Pilot-controlled throttle, 0..speed (max). Independent of damage —
   * "full throttle" isn't a bad state. Adjusted by the GM/pilot during play. */
  currentSpeed: number;
  criticalInjuries: CritInjury[];
  /** Active maneuver/action reminders (Evasive, Boost Shields, etc.). */
  activeEffects: VehicleEffect[];
}

export type VehicleSpec = Omit<
  ActiveVehicle,
  | 'id'
  | 'hullCurrent'
  | 'systemCurrent'
  | 'currentSpeed'
  | 'criticalInjuries'
  | 'activeEffects'
>;

export interface Occupant {
  participantId: string;
  role: VehicleRole;
}

interface ActiveVehicleStore {
  vehicles: Record<string, ActiveVehicle>;
  /** The vehicle currently shown in the right "Targeted" pane. Mutually
   * exclusive with the participant selection — clicking either kind of row
   * cross-clears the other at the call site (TargetListOld /
   * VehicleTargetCardOld). */
  selectedVehicleId: string | null;
  selectVehicle: (id: string | null) => void;
  /** Add a new vehicle to the encounter, optionally with starting occupants.
   * An empty `occupants` is valid — the ship sits in the encounter unmanned
   * until someone enters it. Returns the instance id. */
  add: (spec: VehicleSpec, occupants?: Occupant[]) => string;
  /** Remove the vehicle from the encounter and clear
   * `equippedVehicleId`/`vehicleRole` on every linked participant. */
  remove: (vehicleId: string) => void;
  addOccupant: (vehicleId: string, participantId: string, role: VehicleRole) => void;
  /** Detach a participant from the vehicle. The vehicle stays in the
   * encounter even if it becomes unmanned. */
  removeOccupant: (vehicleId: string, participantId: string) => void;
  addHull: (vehicleId: string, n: number) => void;
  removeHull: (vehicleId: string, n: number) => void;
  addSystemStrain: (vehicleId: string, n: number) => void;
  removeSystemStrain: (vehicleId: string, n: number) => void;
  /** Throttle controls — clamp to 0..speed (max). */
  addSpeed: (vehicleId: string, n: number) => void;
  removeSpeed: (vehicleId: string, n: number) => void;
  addCrit: (vehicleId: string, injury: CritInjury) => void;
  removeCrit: (vehicleId: string, injuryId: string) => void;
  /** Apply (or refresh) a maneuver/action effect on the vehicle. If an
   * effect from the same `moveId` is already present, it's replaced — we
   * don't stack identical reminders. */
  applyVehicleEffect: (vehicleId: string, effect: Omit<VehicleEffect, 'id' | 'appliedAt'>) => void;
  removeVehicleEffect: (vehicleId: string, effectId: string) => void;
}

/** Build a VehicleSpec from a Spotlight detail entry. The detail's data has
 * already been Genesys-converted at build time, so the values land directly. */
export function buildVehicleSpecFromSpotlight(detail: any): VehicleSpec {
  const characteristics = detail?.characteristics ?? {};
  const derived = detail?.derived ?? {};
  return {
    vehicleId: detail?.id ?? '',
    name: detail?.fullName ?? detail?.name ?? 'Vehicle',
    silhouette: typeof characteristics.Silhouette === 'number' ? characteristics.Silhouette : 3,
    speed: typeof characteristics.Speed === 'number' ? characteristics.Speed : 0,
    handling:
      typeof characteristics.Handling === 'string'
        ? characteristics.Handling
        : String(characteristics.Handling ?? '+0'),
    armor: typeof derived.armour === 'number' ? derived.armour : 0,
    defense: typeof derived.defense === 'number' ? derived.defense : 0,
    hullThreshold: typeof derived.hull === 'number' ? derived.hull : 10,
    systemThreshold: typeof derived.system === 'number' ? derived.system : 8,
    weapons: Array.isArray(detail?.weapons) ? detail.weapons : [],
    vehicleInfo: detail?.info ?? {},
  };
}

// Helpers that write to participantsStore — kept inline so the store has full
// responsibility for keeping participant-side flags in sync.
function setParticipantVehicle(
  participantId: string,
  vehicleId: string | undefined,
  role: VehicleRole | undefined,
) {
  const ps = useParticipantStore.getState();
  const next = ps.participants.map((p) =>
    p.id === participantId
      ? { ...p, equippedVehicleId: vehicleId, vehicleRole: role }
      : p,
  );
  ps.updateParticipants(next);
}

const useActiveVehicleStore = create<ActiveVehicleStore>((set, get) => ({
  vehicles: {},
  selectedVehicleId: null,

  selectVehicle: (id) => set({ selectedVehicleId: id }),

  add: (spec, occupants = []) => {
    const id = nanoid();
    const vehicle: ActiveVehicle = {
      ...spec,
      id,
      hullCurrent: 0,
      systemCurrent: 0,
      currentSpeed: 0,
      criticalInjuries: [],
      activeEffects: [],
    };
    set((state) => ({ vehicles: { ...state.vehicles, [id]: vehicle } }));
    for (const occ of occupants) {
      setParticipantVehicle(occ.participantId, id, occ.role);
    }
    return id;
  },

  remove: (vehicleId) => {
    const vehicle = get().vehicles[vehicleId];
    if (!vehicle) return;
    // Find every linked participant and clear their vehicle fields.
    const linked = useParticipantStore
      .getState()
      .participants.filter((p) => p.equippedVehicleId === vehicleId);
    for (const p of linked) {
      setParticipantVehicle(p.id, undefined, undefined);
    }
    set((state) => {
      const next = { ...state.vehicles };
      delete next[vehicleId];
      return {
        vehicles: next,
        selectedVehicleId:
          state.selectedVehicleId === vehicleId ? null : state.selectedVehicleId,
      };
    });
  },

  addOccupant: (vehicleId, participantId, role) => {
    if (!get().vehicles[vehicleId]) return;
    setParticipantVehicle(participantId, vehicleId, role);
  },

  removeOccupant: (_vehicleId, participantId) => {
    setParticipantVehicle(participantId, undefined, undefined);
    // No auto-purge: empty ships remain in the encounter as targets.
  },

  addHull: (vehicleId, n) =>
    set((state) => {
      const v = state.vehicles[vehicleId];
      if (!v) return state;
      return {
        vehicles: {
          ...state.vehicles,
          [vehicleId]: { ...v, hullCurrent: v.hullCurrent + n },
        },
      };
    }),

  removeHull: (vehicleId, n) =>
    set((state) => {
      const v = state.vehicles[vehicleId];
      if (!v) return state;
      return {
        vehicles: {
          ...state.vehicles,
          [vehicleId]: { ...v, hullCurrent: Math.max(0, v.hullCurrent - n) },
        },
      };
    }),

  addSystemStrain: (vehicleId, n) =>
    set((state) => {
      const v = state.vehicles[vehicleId];
      if (!v) return state;
      return {
        vehicles: {
          ...state.vehicles,
          [vehicleId]: { ...v, systemCurrent: v.systemCurrent + n },
        },
      };
    }),

  removeSystemStrain: (vehicleId, n) =>
    set((state) => {
      const v = state.vehicles[vehicleId];
      if (!v) return state;
      return {
        vehicles: {
          ...state.vehicles,
          [vehicleId]: { ...v, systemCurrent: Math.max(0, v.systemCurrent - n) },
        },
      };
    }),

  addSpeed: (vehicleId, n) =>
    set((state) => {
      const v = state.vehicles[vehicleId];
      if (!v) return state;
      return {
        vehicles: {
          ...state.vehicles,
          [vehicleId]: { ...v, currentSpeed: Math.min(v.speed, v.currentSpeed + n) },
        },
      };
    }),

  removeSpeed: (vehicleId, n) =>
    set((state) => {
      const v = state.vehicles[vehicleId];
      if (!v) return state;
      return {
        vehicles: {
          ...state.vehicles,
          [vehicleId]: { ...v, currentSpeed: Math.max(0, v.currentSpeed - n) },
        },
      };
    }),

  addCrit: (vehicleId, injury) =>
    set((state) => {
      const v = state.vehicles[vehicleId];
      if (!v) return state;
      return {
        vehicles: {
          ...state.vehicles,
          [vehicleId]: {
            ...v,
            criticalInjuries: [...v.criticalInjuries, injury],
          },
        },
      };
    }),

  removeCrit: (vehicleId, injuryId) =>
    set((state) => {
      const v = state.vehicles[vehicleId];
      if (!v) return state;
      return {
        vehicles: {
          ...state.vehicles,
          [vehicleId]: {
            ...v,
            criticalInjuries: v.criticalInjuries.filter((c) => c.id !== injuryId),
          },
        },
      };
    }),

  applyVehicleEffect: (vehicleId, effect) =>
    set((state) => {
      const v = state.vehicles[vehicleId];
      if (!v) return state;
      const newEffect: VehicleEffect = {
        id: nanoid(),
        appliedAt: Date.now(),
        ...effect,
      };
      // Replace any existing effect from the same move so duplicate clicks
      // refresh rather than stack.
      const filtered = v.activeEffects.filter((e) => e.moveId !== newEffect.moveId);
      return {
        vehicles: {
          ...state.vehicles,
          [vehicleId]: {
            ...v,
            activeEffects: [...filtered, newEffect],
          },
        },
      };
    }),

  removeVehicleEffect: (vehicleId, effectId) =>
    set((state) => {
      const v = state.vehicles[vehicleId];
      if (!v) return state;
      return {
        vehicles: {
          ...state.vehicles,
          [vehicleId]: {
            ...v,
            activeEffects: v.activeEffects.filter((e) => e.id !== effectId),
          },
        },
      };
    }),
}));

export default useActiveVehicleStore;

/**
 * activeVehicleStore — instance-level state for vehicles currently equipped on
 * one or more participants. The Spotlight index (immutable library) is the
 * source of vehicle specs; equipping a vehicle creates an instance here that
 * tracks per-encounter mutable state (hull, system strain, crits).
 *
 * Multi-crew is a first-class case: multiple Participants can share the same
 * ActiveVehicle.id (Han + Chewie + passengers on the Falcon). Damage applied
 * to one routes to the shared instance — every occupant sees it.
 *
 * The "hat" framing: Participants are still the actors (skills, dice pouch,
 * talents unchanged). The vehicle replaces their *derived* combat surface —
 * HP becomes hull, soak becomes armor, weapons become the vehicle's. When the
 * hat comes off (`removeOccupant` clears `equippedVehicleId`), the participant
 * reverts.
 */
import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { CritInjury } from '@/data/critTable';
import useParticipantStore, { type VehicleRole } from './participantsStore';

export interface VehicleWeapon {
  name: string;
  arc?: string;
  damage?: number | null;
  critical?: number | null;
  range?: string;
  qualities?: string[];
}

export interface ActiveVehicle {
  id: string;
  /** Stable id from the spotlight entry — lets us re-render detail/equip
   * state if the same vehicle is referenced again. */
  vehicleId: string;
  name: string;
  // Immutable spec — copied off the spotlight entry on equip
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
  criticalInjuries: CritInjury[];
}

export type VehicleSpec = Omit<
  ActiveVehicle,
  'id' | 'hullCurrent' | 'systemCurrent' | 'criticalInjuries'
>;

export interface Occupant {
  participantId: string;
  role: VehicleRole;
}

interface ActiveVehicleStore {
  vehicles: Record<string, ActiveVehicle>;
  /** Create a new instance and link the given occupants. Returns the
   * instance id so the caller can reference it. */
  equip: (spec: VehicleSpec, occupants: Occupant[]) => string;
  /** Tear down an instance and clear `equippedVehicleId`/`vehicleRole` on
   * every linked participant. Called on the "End vehicle" / scuttle path. */
  unequip: (vehicleId: string) => void;
  addOccupant: (vehicleId: string, participantId: string, role: VehicleRole) => void;
  /** Remove a single occupant. If they were the last one, the instance is
   * auto-purged (no orphans). */
  removeOccupant: (vehicleId: string, participantId: string) => void;
  addHull: (vehicleId: string, n: number) => void;
  removeHull: (vehicleId: string, n: number) => void;
  addSystemStrain: (vehicleId: string, n: number) => void;
  removeSystemStrain: (vehicleId: string, n: number) => void;
  addCrit: (vehicleId: string, injury: CritInjury) => void;
  removeCrit: (vehicleId: string, injuryId: string) => void;
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

  equip: (spec, occupants) => {
    const id = nanoid();
    const vehicle: ActiveVehicle = {
      ...spec,
      id,
      hullCurrent: 0,
      systemCurrent: 0,
      criticalInjuries: [],
    };
    set((state) => ({ vehicles: { ...state.vehicles, [id]: vehicle } }));
    for (const occ of occupants) {
      setParticipantVehicle(occ.participantId, id, occ.role);
    }
    return id;
  },

  unequip: (vehicleId) => {
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
      return { vehicles: next };
    });
  },

  addOccupant: (vehicleId, participantId, role) => {
    if (!get().vehicles[vehicleId]) return;
    setParticipantVehicle(participantId, vehicleId, role);
  },

  removeOccupant: (vehicleId, participantId) => {
    setParticipantVehicle(participantId, undefined, undefined);
    // Auto-purge the instance if there are no occupants left.
    const stillLinked = useParticipantStore
      .getState()
      .participants.some((p) => p.equippedVehicleId === vehicleId);
    if (!stillLinked) {
      set((state) => {
        const next = { ...state.vehicles };
        delete next[vehicleId];
        return { vehicles: next };
      });
    }
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
}));

export default useActiveVehicleStore;

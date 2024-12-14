import create from 'zustand';

export enum Phase {
  Idle = 'idle',
  RollingInitiative = 'rollingInitiative',
  PlayerTurn = 'playerTurn',
  NPCTurn = 'npcTurn',
  TurnResolution = 'turnResolution',
  CombatEnd = 'combatEnd',
}

interface GameStore {
  phase: Phase;
  initiativeOrder: string[];
  activeTurnIndex: number | null;
  isCombatActive: boolean;
  transitionTo: (newPhase: Phase) => void;
  setInitiativeOrder: (order: string[]) => void;
  nextTurn: () => void;
  resetGame: () => void;
}

// Zustand `gameStore` with Combat Logic
const useGameStore = create<GameStore>((set, get) => ({
  phase: Phase.Idle,
  initiativeOrder: [],
  activeTurnIndex: null,
  isCombatActive: false,

  transitionTo: (newPhase) => {
    const allowedTransitions: Record<Phase, Phase[]> = {
      [Phase.Idle]: [Phase.RollingInitiative],
      [Phase.RollingInitiative]: [Phase.PlayerTurn, Phase.NPCTurn],
      [Phase.PlayerTurn]: [Phase.TurnResolution],
      [Phase.NPCTurn]: [Phase.TurnResolution],
      [Phase.TurnResolution]: [Phase.PlayerTurn, Phase.NPCTurn, Phase.CombatEnd],
      [Phase.CombatEnd]: [Phase.Idle],
    };

    const currentPhase = get().phase;
    if (allowedTransitions[currentPhase]?.includes(newPhase)) {
      set({ phase: newPhase });
      console.log(`Transitioned from ${currentPhase} to ${newPhase}`);
    } else {
      console.error(`Invalid transition from ${currentPhase} to ${newPhase}`);
    }
  },

  setInitiativeOrder: (order) => {
    set({ initiativeOrder: order, activeTurnIndex: 0, isCombatActive: true });
    console.log(`Initiative order set: ${order.join(', ')}`);
  },

  nextTurn: () => {
    const { initiativeOrder, activeTurnIndex, isCombatActive } = get();
    if (!isCombatActive || initiativeOrder.length === 0) {
      console.warn('Cannot proceed to the next turn: Combat is inactive or initiative order is empty.');
      return;
    }

    const nextIndex = activeTurnIndex !== null ? (activeTurnIndex + 1) % initiativeOrder.length : 0;
    set({ activeTurnIndex: nextIndex });
    console.log(`Active turn moved to: ${initiativeOrder[nextIndex]} (Index: ${nextIndex})`);
  },

  resetGame: () => {
    set({
      phase: Phase.Idle,
      initiativeOrder: [],
      activeTurnIndex: null,
      isCombatActive: false,
    });
    console.log('Game reset to initial state');
  },
}));

export default useGameStore;
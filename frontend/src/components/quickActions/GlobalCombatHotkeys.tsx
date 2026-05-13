import React, { useEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import useParticipantStore, { isParticipantDead } from '@/state/participantsStore';
import useGameplayStore from '@/state/newGameplayStore';
import { useQuickActionsStore } from '@/state/quickActionsStore';
import { useSymbolSpendsStore } from '@/state/symbolSpendsStore';
import { useNarrativeJuiceStore } from '@/state/narrativeJuiceStore';
import CritRollerModal from '@components/crit/CritRollerModal';
import ApplyEffectsModal from '@components/effects/ApplyEffectsModal';

// Returns true if any Chakra modal is currently mounted as an open dialog.
// Lets us gate the global verbs so they don't fire while the dice roller,
// spotlight, narrative juice, etc. are catching the GM's attention.
function isAnyDialogOpen(): boolean {
  if (typeof document === 'undefined') return false;
  return document.querySelector('[role="dialog"][aria-modal="true"]') !== null;
}

// Returns true if the focused element is text-input-ish. react-hotkeys-hook
// excludes <input>/<textarea>/<select> by default but we also want to skip
// when a contenteditable surface (e.g. some Chakra editable fields) is the
// active element.
function isEditingText(): boolean {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

// Evaluated at keypress time (not render time) so it stays accurate as the
// focus moves between buttons, sheets, sidebars, etc.
function shouldHandleKeystroke(): boolean {
  if (isAnyDialogOpen()) return false;
  if (isEditingText()) return false;
  return true;
}

const GlobalCombatHotkeys: React.FC = () => {
  const participants = useParticipantStore((s) => s.participants);
  const selectedId = useParticipantStore((s) => s.selectedParticipantId);
  const selectParticipant = useParticipantStore((s) => s.selectParticipant);
  const setActiveParticipantId = useGameplayStore((s) => s.setActiveParticipantId);
  const transition = useGameplayStore((s) => s.transition);
  const canTransition = useGameplayStore((s) => s.canTransition);
  const setInitiativeModalOpen = useGameplayStore((s) => s.setInitiativeModalOpen);
  const enterDamage = useQuickActionsStore((s) => s.enterDamage);
  const enterPouch = useQuickActionsStore((s) => s.enterPouch);
  const openCrit = useQuickActionsStore((s) => s.openCrit);
  const openEffects = useQuickActionsStore((s) => s.openEffects);
  const closeEffects = useQuickActionsStore((s) => s.closeEffects);
  const effectsModalOpen = useQuickActionsStore((s) => s.effectsModalOpen);
  const closeCrit = useQuickActionsStore((s) => s.closeCrit);
  const cancel = useQuickActionsStore((s) => s.cancel);
  const critModalOpen = useQuickActionsStore((s) => s.critModalOpen);
  const mode = useQuickActionsStore((s) => s.mode);

  // Document-level keydown for the verbs. We attach once and re-read state
  // from the stores on every keystroke, so focus changes between renders
  // don't leave the listener with a stale enabled flag — that was the bug
  // where arrow nav stopped working depending on what was focused.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Respect modifier-bearing combos so we don't fight Cmd+D, Ctrl+P, etc.
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (!shouldHandleKeystroke()) return;

      const { mode: liveMode, critModalOpen: liveCrit } = useQuickActionsStore.getState();
      const { participants: liveParticipants, selectedParticipantId: liveSelectedId } =
        useParticipantStore.getState();

      // Weapon-picker mode: only digit keys (1-9) pick a weapon; everything
      // else (other than Esc, handled elsewhere) is swallowed so the GM can
      // type a number to choose.
      if (liveMode === 'weapon') {
        if (/^[1-9]$/.test(e.key)) {
          e.preventDefault();
          e.stopPropagation();
          useQuickActionsStore.getState().pickWeapon(parseInt(e.key, 10) - 1);
        }
        return;
      }

      // Damage/pouch input modes and the crit modal own keyboard focus while
      // open — suppress all other verbs.
      if (liveMode !== 'idle' || liveCrit) return;

      // ─── Turn-flow verbs (no target required) ──────────────────────────
      const k = e.key;
      // Space drives turn flow. Shift+Space steps back. Need stopPropagation
      // too because plain Space would otherwise trigger any focused button.
      if (k === ' ' || k === 'Spacebar') {
        const event = e.shiftKey ? 'PREV_TURN' : 'NEXT_TURN';
        if (canTransition(event)) {
          e.preventDefault();
          e.stopPropagation();
          transition(event);
        }
        return;
      }
      if (k === 'i' || k === 'I') {
        e.preventDefault();
        setInitiativeModalOpen(true);
        return;
      }
      // W rolls the *active* participant's weapon — no target needed.
      if (k === 'w' || k === 'W') {
        e.preventDefault();
        useQuickActionsStore.getState().enterWeapon();
        return;
      }
      // R opens the Symbol Spends reference modal. No target required; this
      // is a pure lookup. Once the modal is open, shouldHandleKeystroke()
      // bails on any open dialog so R won't fire again to toggle it.
      if (k === 'r' || k === 'R') {
        e.preventDefault();
        useSymbolSpendsStore.getState().open();
        return;
      }
      // J opens the Narrative Juice panel. Same pattern as R — no target, no
      // re-trigger while open.
      if (k === 'j' || k === 'J') {
        e.preventDefault();
        useNarrativeJuiceStore.getState().open();
        return;
      }

      // ─── Target cycling (works with no selection — picks first/last) ───
      const cycle = (dir: 1 | -1) => {
        // Match TargetListOld's visible order: live PCs first, then live NPCs,
        // each in insertion order. Dead participants live in the graveyard
        // and are skipped. Pressing arrows with nothing selected lands on the
        // first (Down) or last (Up) live participant.
        const live = liveParticipants.filter((p) => !isParticipantDead(p));
        const ordered = [
          ...live.filter((p) => p.isPC),
          ...live.filter((p) => !p.isPC),
        ];
        if (ordered.length === 0) return;
        const idx = liveSelectedId
          ? ordered.findIndex((p) => p.id === liveSelectedId)
          : -1;
        const next = idx < 0
          ? (dir === 1 ? 0 : ordered.length - 1)
          : (idx + dir + ordered.length) % ordered.length;
        selectParticipant(ordered[next].id);
      };

      if (k === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        cycle(1);
        return;
      }
      if (k === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        cycle(-1);
        return;
      }

      // ─── Target-scoped verbs (require a selected participant) ──────────
      if (!liveSelectedId) return;

      const store = useParticipantStore.getState();

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowLeft': {
          // Plain arrows: ±1 wound. Shift+arrows: ±1 strain, but only on
          // characters that actually track a strain pool (PCs and Nemeses).
          // Minions/Rivals get an inline note instead so the GM knows the
          // keystroke landed but had nowhere to go.
          e.preventDefault();
          e.stopPropagation();
          const dir = e.key === 'ArrowRight' ? 1 : -1;
          if (e.shiftKey) {
            const target = liveParticipants.find((p) => p.id === liveSelectedId);
            const tracksStrain =
              !!target && (target.isPC || target.stats?.type === 'Nemesis');
            if (!tracksStrain) {
              useQuickActionsStore.getState().noteResult({
                ok: false,
                message: `${target?.name ?? 'Target'} has no strain pool — Minions/Rivals don't track strain.`,
              });
              return;
            }
            if (dir === 1) store.addStrain(liveSelectedId, 1);
            else store.removeStrain(liveSelectedId, 1);
          } else {
            if (dir === 1) store.addWounds(liveSelectedId, 1);
            else store.removeWounds(liveSelectedId, 1);
          }
          return;
        }
        case 'd':
        case 'D':
          e.preventDefault();
          enterDamage();
          return;
        case 'p':
        case 'P':
          e.preventDefault();
          enterPouch();
          return;
        case 'c':
        case 'C':
          e.preventDefault();
          openCrit();
          return;
        case 'e':
        case 'E':
          e.preventDefault();
          openEffects();
          return;
        case 's':
        case 'S':
          e.preventDefault();
          useQuickActionsStore.getState().enterStrain();
          return;
        case 'a':
        case 'A':
          e.preventDefault();
          setActiveParticipantId(liveSelectedId);
          return;
        case 'f':
        case 'F':
          e.preventDefault();
          useQuickActionsStore.getState().openFullSheet();
          return;
      }
    };
    // Capture phase: run before bubble-phase listeners registered elsewhere
    // (e.g. Spotlight's `useHotkeys('up' / 'down')` from react-hotkeys-hook).
    // Without this, arrow nav races those listeners and stops working when
    // some component has stale handlers attached.
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
    // selectParticipant / enterDamage / etc. are stable zustand actions;
    // we still list them so eslint-rules-of-hooks is happy.
  }, [
    selectParticipant,
    enterDamage,
    enterPouch,
    openCrit,
    openEffects,
    setActiveParticipantId,
    transition,
    canTransition,
    setInitiativeModalOpen,
  ]);

  // Escape always cancels an open quick-action input — independent of focus
  // gating because the input is the focused element while in damage/pouch
  // mode. react-hotkeys-hook handles this fine with enableOnFormTags.
  useHotkeys(
    'escape',
    () => {
      if (mode !== 'idle') cancel();
    },
    { enableOnFormTags: true },
    [mode, cancel],
  );

  const selectedParticipant = participants.find((p) => p.id === selectedId) ?? null;

  return (
    <>
      <CritRollerModal
        isOpen={critModalOpen}
        onClose={closeCrit}
        participantId={selectedId ?? undefined}
      />
      {selectedParticipant && (
        <ApplyEffectsModal
          isOpen={effectsModalOpen}
          onClose={closeEffects}
          participant={selectedParticipant}
        />
      )}
    </>
  );
};

export default GlobalCombatHotkeys;

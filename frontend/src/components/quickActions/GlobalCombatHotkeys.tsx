import React, { useEffect, useRef } from 'react';
import { Box, Text, useToast } from '@chakra-ui/react';
import { useHotkeys } from 'react-hotkeys-hook';
import useParticipantStore, { isParticipantDead } from '@/state/participantsStore';
import useGameplayStore from '@/state/newGameplayStore';
import { useQuickActionsStore } from '@/state/quickActionsStore';
import { useSymbolSpendsStore } from '@/state/symbolSpendsStore';
import { useNarrativeJuiceStore } from '@/state/narrativeJuiceStore';
import { useGalaxyMapStore } from '@/state/galaxyMapStore';
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

// How long the A verb stays "armed" after the first tap. A second tap of A
// on the same target within this window confirms the override; otherwise the
// arm lapses. Matches the muscle-memory of the old digit double-tap.
const ACTIVE_OVERRIDE_WINDOW_MS = 1200;

// Compact, low-key toast for the A verb — Chakra's default status toasts are
// too bright and bulky for this dark, hand-styled surface. A small dark pill
// with one accent dot: gold (the active-participant colour) on confirm, a
// muted dot while armed. Returns a `render` function for the toast options.
const activeToast =
  (message: string, tone: 'confirm' | 'arm') => () => (
    <Box
      bg="#2A2C30"
      color="whiteAlpha.900"
      border="1px solid"
      borderColor="whiteAlpha.200"
      borderRadius="md"
      boxShadow="0 6px 16px rgba(0,0,0,0.45)"
      px={3}
      py={1.5}
      fontSize="xs"
      display="flex"
      alignItems="center"
      gap={2}
    >
      <Box
        w="6px"
        h="6px"
        borderRadius="full"
        flexShrink={0}
        bg={tone === 'confirm' ? '#f1c043' : 'whiteAlpha.400'}
      />
      <Text>{message}</Text>
    </Box>
  );

const GlobalCombatHotkeys: React.FC = () => {
  const participants = useParticipantStore((s) => s.participants);
  const selectedId = useParticipantStore((s) => s.selectedParticipantId);
  const selectParticipant = useParticipantStore((s) => s.selectParticipant);
  const transition = useGameplayStore((s) => s.transition);
  const canTransition = useGameplayStore((s) => s.canTransition);
  const setInitiativeModalOpen = useGameplayStore((s) => s.setInitiativeModalOpen);
  const setActiveParticipantId = useGameplayStore((s) => s.setActiveParticipantId);
  const toast = useToast();
  // A verb arm-state: the target staged by the first tap of A, plus its
  // auto-clear timer. Held in a ref so it survives re-renders and the
  // keydown listener can read/update it without re-binding.
  const activeArmRef = useRef<{ id: string; timer: number } | null>(null);
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
      // G opens the interactive galaxy map. No target required; pure
      // reference, and it won't re-trigger while open — shouldHandleKeystroke
      // bails on any open dialog.
      if (k === 'g' || k === 'G') {
        e.preventDefault();
        useGalaxyMapStore.getState().open();
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
        case 'f':
        case 'F':
          e.preventDefault();
          useQuickActionsStore.getState().openFullSheet();
          return;
        case 'a':
        case 'A': {
          // A makes the currently selected target the active character.
          // With no active character yet, a single press claims it. Once
          // someone is already active, overriding needs a confirming second
          // tap of A on the same target (the digit hotkeys no longer
          // override) so a stray keypress can't yank the active mid-turn.
          e.preventDefault();
          const liveActiveId =
            useGameplayStore.getState().context.activeParticipantId ?? null;
          const targetName =
            liveParticipants.find((p) => p.id === liveSelectedId)?.name ?? 'Target';
          const arm = activeArmRef.current;
          const clearArm = () => {
            if (arm) window.clearTimeout(arm.timer);
            activeArmRef.current = null;
          };
          const makeActive = () => {
            clearArm();
            toast.close('active-override-arm');
            setActiveParticipantId(liveSelectedId);
            toast({
              duration: 1800,
              render: activeToast(
                `${targetName} is now the active character.`,
                'confirm',
              ),
            });
          };

          // Already the active character — nothing to confirm.
          if (liveActiveId === liveSelectedId) {
            clearArm();
            return;
          }
          // Open, unclaimed slot — a single press claims it.
          if (!liveActiveId) {
            makeActive();
            return;
          }
          // Override: a confirming second tap of A on the same target.
          if (arm?.id === liveSelectedId) {
            makeActive();
            return;
          }
          // First tap on a new target — arm and prompt for confirmation.
          if (arm) window.clearTimeout(arm.timer);
          activeArmRef.current = {
            id: liveSelectedId,
            timer: window.setTimeout(() => {
              activeArmRef.current = null;
            }, ACTIVE_OVERRIDE_WINDOW_MS),
          };
          const armRender = activeToast(
            `Tap A again to make ${targetName} the active character`,
            'arm',
          );
          if (toast.isActive('active-override-arm')) {
            toast.update('active-override-arm', {
              duration: ACTIVE_OVERRIDE_WINDOW_MS,
              render: armRender,
            });
          } else {
            toast({
              id: 'active-override-arm',
              duration: ACTIVE_OVERRIDE_WINDOW_MS,
              render: armRender,
            });
          }
          return;
        }
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
    transition,
    canTransition,
    setInitiativeModalOpen,
    setActiveParticipantId,
    toast,
  ]);

  // A focused text input swallows every global verb (the isEditingText gate
  // in shouldHandleKeystroke). The session-prep running-notes textarea is
  // the first persistent *ambient* text input that lives next to the Targets
  // column — and target rows are plain onClick divs that don't take focus,
  // so a GM who types a note and then clicks a target leaves the textarea
  // focused, silently killing arrow-cycling and the rest. Drop focus out of
  // an ambient text input the moment the GM presses down on a non-form
  // surface.
  //
  // Crucially this must NOT touch mode-driving inputs: the quick-action
  // damage/pouch/strain field and the crit / initiative / spotlight modals
  // own focus on purpose. Blurring those would orphan their mode — the
  // input loses focus but `mode` stays non-idle, so `liveMode !== 'idle'`
  // keeps gating every hotkey with no visible cause. So: only blur while
  // the app is otherwise idle.
  useEffect(() => {
    const isFormElement = (el: Element | null): boolean => {
      if (!el) return false;
      const tag = el.tagName;
      return (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        (el as HTMLElement).isContentEditable
      );
    };
    const onPointerDown = (e: PointerEvent) => {
      // A modal or a quick-action mode owns focus deliberately — leave it.
      if (isAnyDialogOpen()) return;
      const { mode: qMode, critModalOpen } = useQuickActionsStore.getState();
      if (qMode !== 'idle' || critModalOpen) return;

      const active = document.activeElement;
      if (!isFormElement(active)) return;
      const target = e.target as Node | null;
      // Clicking inside the same field, or onto another form field, should
      // keep / move focus naturally — only blur when landing elsewhere.
      if (target && active!.contains(target)) return;
      if (isFormElement(target as Element | null)) return;
      (active as HTMLElement).blur();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () =>
      document.removeEventListener('pointerdown', onPointerDown, true);
  }, []);

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

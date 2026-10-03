import React, { useEffect } from 'react';
import { Box, Flex, Heading, Kbd, Text, VStack } from '@chakra-ui/react';
import { useHelpOverlayStore } from '@/state/helpOverlayStore';
import useGameplayStore from '@/state/newGameplayStore';

// Chakra's default Kbd renders gray.100 bg / gray.800 text in light theme and
// flips in dark; on this hand-styled dark modal both paths can collapse to
// near-white-on-white. Force explicit colors so the keys are always readable.
const K: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Kbd bg="gray.700" color="gray.100" borderColor="whiteAlpha.300" px="6px" fontSize="xs">
    {children}
  </Kbd>
);

interface HotkeyRow {
  keys: React.ReactNode;
  label: string;
}

const SECTIONS: { title: string; rows: HotkeyRow[] }[] = [
  {
    title: 'Target navigation',
    rows: [
      { keys: <><K>↑</K> / <K>↓</K></>, label: 'Cycle through live targets (skip graveyard)' },
    ],
  },
  {
    title: 'Target nudges',
    rows: [
      { keys: <><K>←</K> / <K>→</K></>, label: '−1 / +1 wound' },
      { keys: <><K>Shift</K>+<K>←</K> / <K>→</K></>, label: '−1 / +1 strain (PC / Nemesis only)' },
    ],
  },
  {
    title: 'Target actions',
    rows: [
      { keys: <K>A</K>, label: 'Active — make the targeted character active (double-tap to override)' },
      { keys: <K>D</K>, label: 'Damage — raw input, soak applied automatically' },
      { keys: <K>S</K>, label: 'Strain — raw input (PC / Nemesis only)' },
      { keys: <K>P</K>, label: 'Pouch — add symbols (e.g. 3a, 1 triumph)' },
      { keys: <K>C</K>, label: 'Crit — roll a critical injury on the target' },
      { keys: <K>E</K>, label: 'Effects — open the apply-effects modal' },
      { keys: <K>W</K>, label: 'Weapon roll — for the ACTIVE participant (picker if multiple)' },
      { keys: <K>F</K>, label: 'Full sheet — open the targeted character\'s full sheet' },
    ],
  },
  {
    title: 'Turn flow',
    rows: [
      { keys: <K>Space</K>, label: 'Next turn' },
      { keys: <><K>Shift</K>+<K>Space</K></>, label: 'Previous turn' },
      { keys: <K>I</K>, label: 'Open the initiative modal' },
    ],
  },
  {
    title: 'Reference',
    rows: [
      { keys: <K>R</K>, label: 'Rules reference — symbol spends, skills, maneuvers & range' },
      { keys: <K>J</K>, label: 'Juice — roll a scene of narrative juice' },
      { keys: <K>G</K>, label: 'Galaxy map — interactive map of the galaxy' },
    ],
  },
  {
    title: 'Misc',
    rows: [
      { keys: <K>?</K>, label: 'Hold to show this help' },
      { keys: <K>Esc</K>, label: 'Cancel a damage/pouch input' },
    ],
  },
];

const INIT_MODAL_SECTION = {
  title: 'Initiative modal',
  rows: [
    { keys: <K>R</K>, label: 'Re-roll all NPC initiatives' },
    { keys: <K>Enter</K>, label: 'Next input → submit on the last' },
    { keys: <><K>⌘ / Ctrl</K>+<K>Enter</K></>, label: 'Submit from any input' },
    { keys: <K>Esc</K>, label: 'Cancel and close the modal' },
  ],
};

// `?` is safe to hijack inside number-type inputs (they reject the char anyway)
// — only block real text-editing surfaces. This lets help still trigger while
// the GM is filling out the initiative modal's number inputs.
function isEditingText(): boolean {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag === 'INPUT') {
    const type = (el as HTMLInputElement).type;
    return type !== 'number';
  }
  return false;
}

const HotkeyHelpOverlay: React.FC = () => {
  const visible = useHelpOverlayStore((s) => s.visible);
  const setVisible = useHelpOverlayStore((s) => s.setVisible);
  const initOpen = useGameplayStore((s) => s.isInitiativeModalOpen);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key !== '?') return;
      if (isEditingText()) return;
      e.preventDefault();
      setVisible(true);
    };
    // Release of either '?' or 'Shift' (or just '/') drops the overlay.
    // Accept whichever releases first — keeps UX consistent across keyboards.
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === '?' || e.key === 'Shift' || e.key === '/') {
        setVisible(false);
      }
    };
    const onBlur = () => setVisible(false);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [setVisible]);

  if (!visible) return null;

  // No backdrop / dim — the GM should still see the buttons and their per-
  // button hint chips while the panel is up. Docked bottom-left so it stays
  // clear of the targets / targeted columns where the action surfaces live.
  return (
    <Box
      position="fixed"
      bottom="16px"
      left="16px"
      zIndex={5000}
      pointerEvents="none"
      bg="#2F3136"
      color="whiteAlpha.900"
      borderRadius="lg"
      boxShadow="0 12px 28px rgba(0,0,0,0.55)"
      border="1px solid"
      borderColor="whiteAlpha.300"
      p={4}
      minW="340px"
      maxW="380px"
    >
      <Flex justify="space-between" align="baseline" mb={2.5}>
        <Heading size="sm">Hotkeys</Heading>
        <Text fontSize="xs" color="whiteAlpha.500">hold <K>?</K></Text>
      </Flex>
      <VStack align="stretch" spacing={2.5}>
        {(initOpen ? [INIT_MODAL_SECTION, ...SECTIONS] : SECTIONS).map((section) => (
          <Box key={section.title}>
            <Text
              fontSize="2xs"
              textTransform="uppercase"
              letterSpacing="wider"
              color="whiteAlpha.500"
              mb={1}
            >
              {section.title}
            </Text>
            <VStack align="stretch" spacing={0.5}>
              {section.rows.map((row, i) => (
                <Flex key={i} justify="space-between" align="center" gap={3}>
                  <Text fontSize="xs" color="whiteAlpha.800">
                    {row.label}
                  </Text>
                  <Box flexShrink={0} fontSize="xs">
                    {row.keys}
                  </Box>
                </Flex>
              ))}
            </VStack>
          </Box>
        ))}
      </VStack>
    </Box>
  );
};

export default HotkeyHelpOverlay;

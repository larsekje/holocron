import {Box, Grid, GridItem, HStack, Heading, IconButton, Kbd, Text, Tooltip} from "@chakra-ui/react";
import {SearchIcon} from "@chakra-ui/icons";
import {GiBloodySword, GiGalaxy, GiMartini} from "react-icons/gi";
import {FiTag} from "react-icons/fi";
import React from "react";

import "./assets/sass/dice.sass"
import ToolBar from "@components/turnbar/ToolBar";
import ContentCardActiveOld from "@/ContentCardActiveOld";
import ContentCardTargetsOld from "@/ContentCardTargetsOld";
import {DiceRollerModal} from "@components/dice/DiceRollerModal";
import Spotlight from "@components/Spotlight";
import Sidebar from "@components/Sidebar";
import NarrativeJuicePanel from "@components/narrativeJuice/NarrativeJuicePanel";
import GlobalCombatHotkeys from "@components/quickActions/GlobalCombatHotkeys";
import HotkeyHelpOverlay from "@components/quickActions/HotkeyHelpOverlay";
import HotkeyHint from "@components/quickActions/HotkeyHint";
import QuickActionsBar from "@components/quickActions/QuickActionsBar";
import TargetSheetModal from "@components/target/TargetSheetModal";
import SymbolSpendsModal from "@components/reference/SymbolSpendsModal";
import GalaxyMapOverlay from "@components/galaxyMap/GalaxyMapOverlay";
import useDiceRollerStore from "@/state/diceRollerStore";
import "@/state/sessionLogStore";
import {useSpotlightStore} from "@/state/spotlightStore";
import {useNarrativeJuiceStore} from "@/state/narrativeJuiceStore";
import {useSymbolSpendsStore} from "@/state/symbolSpendsStore";
import {useGalaxyMapStore} from "@/state/galaxyMapStore";
import {useQuickActionsStore} from "@/state/quickActionsStore";
import {buildFreestandingSnapshot} from "@/utils/diceSnapshots";
import {ReactComponent as ProficiencySvg} from "@/assets/dice/proficiency.svg";
import DestinyPoolInline from "@components/destinyPoints/DestinyPoolInline";
import SessionPrepPanel from "@components/sessionPrep/SessionPrepPanel";
import ClassificationReviewModal from "@components/classificationReview/ClassificationReviewModal";
import {useClassificationReviewStore} from "@/state/classificationReviewStore";
import ShareButton from "@components/share/ShareButton";
import {initAutoResume} from "@/state/shareStore";

function App() {
  const snapshot = useDiceRollerStore((s) => s.snapshot);
  const closeSnapshot = useDiceRollerStore((s) => s.close);
  const openDiceRoller = useDiceRollerStore((s) => s.open);
  const openSpotlight = useSpotlightStore((s) => s.open);
  const openNarrativeJuice = useNarrativeJuiceStore((s) => s.open);
  const openSymbolSpends = useSymbolSpendsStore((s) => s.open);
  const openGalaxyMap = useGalaxyMapStore((s) => s.open);
  const openCritFor = useQuickActionsStore((s) => s.openCritFor);
  const openClassificationReview = useClassificationReviewStore((s) => s.open);

  // Auto-resume player sharing if it was active before a reload/crash.
  React.useEffect(() => { initAutoResume(); }, []);

  const templateAreas = `"turn   turn    turn     log"
                         "active targets targeted log"`

  return (
    <>
      <Box display='flex' alignItems='center' h='50' bg='#2F3136' px={4}>
        <HStack width="100%" justifyContent="space-between">
          <Heading size="md" color="whiteAlpha.900">GM Holocron</Heading>
          <HStack spacing={4}>
            <DestinyPoolInline/>
            <Box w="1px" h="24px" bg="whiteAlpha.300"/>
            {/* Search reads as an actual search bar — wider, input-shaped,
                with a placeholder and a ⌘K hint. Clicking anywhere opens
                Spotlight. The remaining verbs are quiet ghost icons. */}
            <HStack
              as="button"
              onClick={openSpotlight}
              spacing={2}
              bg="whiteAlpha.100"
              _hover={{ bg: 'whiteAlpha.200', borderColor: 'whiteAlpha.400' }}
              border="1px solid"
              borderColor="whiteAlpha.300"
              borderRadius="md"
              h="32px"
              px={3}
              minW="220px"
              cursor="text"
              transition="background-color 120ms, border-color 120ms"
            >
              <SearchIcon boxSize="14px" color="whiteAlpha.600" />
              <Text fontSize="sm" color="whiteAlpha.500" flex="1" textAlign="left">
                Search…
              </Text>
              <Kbd bg="gray.700" color="gray.200" borderColor="gray.500" fontSize="2xs">⌘K</Kbd>
            </HStack>
            <Tooltip
              label={<HStack spacing={2}><Box>Narrative juice</Box><Kbd bg="gray.700" color="gray.200" borderColor="gray.500">J</Kbd></HStack>}
              placement="bottom"
              hasArrow
              openDelay={300}
            >
              <Box position="relative">
                <IconButton
                  size="sm"
                  variant="ghost"
                  aria-label="Narrative juice"
                  icon={<GiMartini size={20}/>}
                  color="whiteAlpha.800"
                  onClick={openNarrativeJuice}
                  _hover={{ bg: 'whiteAlpha.200', color: 'whiteAlpha.900' }}
                />
                <HotkeyHint>J</HotkeyHint>
              </Box>
            </Tooltip>
            <Tooltip
              label={<HStack spacing={2}><Box>Rules reference</Box><Kbd bg="gray.700" color="gray.200" borderColor="gray.500">R</Kbd></HStack>}
              placement="bottom"
              hasArrow
              openDelay={300}
            >
              <Box position="relative">
                <IconButton
                  size="sm"
                  variant="ghost"
                  aria-label="Rules reference"
                  // Reuse the dice-font triumph glyph for instant recognition.
                  // The CSS class lives in src/assets/sass/dice.sass.
                  icon={<Box className="icon triumph" fontSize="20px" color="whiteAlpha.800" />}
                  onClick={() => openSymbolSpends()}
                  _hover={{ bg: 'whiteAlpha.200' }}
                />
                <HotkeyHint>R</HotkeyHint>
              </Box>
            </Tooltip>
            <Tooltip
              label={<HStack spacing={2}><Box>Galaxy map</Box><Kbd bg="gray.700" color="gray.200" borderColor="gray.500">G</Kbd></HStack>}
              placement="bottom"
              hasArrow
              openDelay={300}
            >
              <Box position="relative">
                <IconButton
                  size="sm"
                  variant="ghost"
                  aria-label="Galaxy map"
                  icon={<GiGalaxy size={20}/>}
                  color="whiteAlpha.800"
                  onClick={openGalaxyMap}
                  _hover={{ bg: 'whiteAlpha.200', color: 'whiteAlpha.900' }}
                />
                <HotkeyHint>G</HotkeyHint>
              </Box>
            </Tooltip>
            <Tooltip
              label={<HStack spacing={2}><Box>Critical injury roller</Box><Kbd bg="gray.700" color="gray.200" borderColor="gray.500">C</Kbd></HStack>}
              placement="bottom"
              hasArrow
              openDelay={300}
            >
              <Box position="relative">
                <IconButton
                  size="sm"
                  variant="ghost"
                  aria-label="Critical injury roller"
                  icon={<GiBloodySword size={20}/>}
                  color="whiteAlpha.800"
                  onClick={() => openCritFor()}
                  _hover={{ bg: 'whiteAlpha.200', color: 'whiteAlpha.900' }}
                />
                <HotkeyHint>C</HotkeyHint>
              </Box>
            </Tooltip>
            <Tooltip label="Open a freestanding dice roller" placement="bottom" hasArrow openDelay={300}>
              <IconButton
                size="sm"
                variant="ghost"
                aria-label="Open dice roller"
                icon={<ProficiencySvg width={22}/>}
                onClick={() => openDiceRoller(buildFreestandingSnapshot())}
                _hover={{ bg: 'whiteAlpha.200' }}
              />
            </Tooltip>
            {/* Utility tools — set apart from the play verbs above. */}
            <Box w="1px" h="24px" bg="whiteAlpha.300"/>
            <Tooltip label="Classification review — flag wrong adversary classifications" placement="bottom" hasArrow openDelay={300}>
              <IconButton
                size="sm"
                variant="ghost"
                aria-label="Classification review"
                icon={<FiTag size={18}/>}
                color="whiteAlpha.700"
                onClick={openClassificationReview}
                _hover={{ bg: 'whiteAlpha.200', color: 'whiteAlpha.900' }}
              />
            </Tooltip>
            <ShareButton/>
          </HStack>
        </HStack>
      </Box>
      <Grid
        templateAreas={templateAreas}
        gridTemplateRows={'60px calc(100vh - 125px)'}
        gridTemplateColumns={'4fr 3fr 4fr 300px'}
        gap='5px'
        padding='5px'
        bg="#36393F"
      >
        <GridItem area='turn'>
          <ToolBar/>
        </GridItem>

        <GridItem area='active' overflow="hidden" minH={0}>
          <ContentCardActiveOld/>
        </GridItem>

        <GridItem area='targets' overflow="hidden" minH={0}>
          <ContentCardTargetsOld/>
        </GridItem>

        <GridItem area='targeted' overflow="hidden" minH={0}>
          <SessionPrepPanel/>
        </GridItem>

        <GridItem area='log' overflow="hidden" minH={0} rowSpan={2}>
          <Sidebar/>
        </GridItem>
      </Grid>
      <DiceRollerModal snapshot={snapshot} onClose={closeSnapshot}/>
      <Spotlight/>
      <NarrativeJuicePanel/>
      <GlobalCombatHotkeys/>
      <HotkeyHelpOverlay/>
      <QuickActionsBar/>
      <TargetSheetModal/>
      <SymbolSpendsModal/>
      <GalaxyMapOverlay/>
      <ClassificationReviewModal/>
    </>
  )
}

export default App

import {Box, Button, Grid, GridItem, HStack, Heading, IconButton, Kbd, Tooltip} from "@chakra-ui/react";
import {SearchIcon} from "@chakra-ui/icons";
import React from "react";

import "./assets/sass/dice.sass"
import ToolBar from "@components/turnbar/ToolBar";
import ContentCardActiveOld from "@/ContentCardActiveOld";
import ContentCardTargetsOld from "@/ContentCardTargetsOld";
import ContentCardTargetedOld from "@/ContentCardTargetedOld";
import {DiceRollerModal} from "@components/dice/DiceRollerModal";
import Spotlight from "@components/Spotlight";
import Sidebar from "@components/Sidebar";
import NarrativeJuicePanel from "@components/narrativeJuice/NarrativeJuicePanel";
import useDiceRollerStore from "@/state/diceRollerStore";
import "@/state/sessionLogStore";
import {useSpotlightStore} from "@/state/spotlightStore";
import {useNarrativeJuiceStore} from "@/state/narrativeJuiceStore";
import {buildFreestandingSnapshot} from "@/utils/diceSnapshots";
import {ReactComponent as ProficiencySvg} from "@/assets/dice/proficiency.svg";
import DestinyPoolInline from "@components/destinyPoints/DestinyPoolInline";

function App() {
  const snapshot = useDiceRollerStore((s) => s.snapshot);
  const closeSnapshot = useDiceRollerStore((s) => s.close);
  const openDiceRoller = useDiceRollerStore((s) => s.open);
  const openSpotlight = useSpotlightStore((s) => s.open);
  const openNarrativeJuice = useNarrativeJuiceStore((s) => s.open);

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
            <Button
              size="sm"
              variant="outline"
              colorScheme="whiteAlpha"
              color="whiteAlpha.900"
              leftIcon={<SearchIcon/>}
              onClick={openSpotlight}
            >
              <HStack spacing={2}>
                <Box>Search</Box>
                <Kbd bg="gray.700" color="gray.200" borderColor="gray.500">⌘K</Kbd>
              </HStack>
            </Button>
            <Tooltip label="Roll a scene of narrative juice" placement="bottom" hasArrow openDelay={300}>
              <Button
                size="sm"
                variant="outline"
                colorScheme="whiteAlpha"
                color="whiteAlpha.900"
                onClick={openNarrativeJuice}
              >
                Juice
              </Button>
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
          <ContentCardTargetedOld/>
        </GridItem>

        <GridItem area='log' overflow="hidden" minH={0} rowSpan={2}>
          <Sidebar/>
        </GridItem>
      </Grid>
      <DiceRollerModal snapshot={snapshot} onClose={closeSnapshot}/>
      <Spotlight/>
      <NarrativeJuicePanel/>
    </>
  )
}

export default App

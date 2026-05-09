import {Box, Button, Grid, GridItem, HStack, Heading, Kbd} from "@chakra-ui/react";
import {SearchIcon} from "@chakra-ui/icons";
import React from "react";

import "./assets/sass/dice.sass"
import ToolBar from "@components/turnbar/ToolBar";
import ContentCardActiveOld from "@/ContentCardActiveOld";
import ContentCardTargetsOld from "@/ContentCardTargetsOld";
import ContentCardTargetedOld from "@/ContentCardTargetedOld";
import {DiceRollerModal} from "@components/dice/DiceRollerModal";
import Spotlight from "@components/Spotlight";
import useDiceRollerStore from "@/state/diceRollerStore";
import {useSpotlightStore} from "@/state/spotlightStore";

function App() {
  const snapshot = useDiceRollerStore((s) => s.snapshot);
  const closeSnapshot = useDiceRollerStore((s) => s.close);
  const openSpotlight = useSpotlightStore((s) => s.open);

  const templateAreas = `"turn   turn    turn"
                         "active targets targeted"`

  return (
    <>
      <Box display='flex' alignItems='center' h='50' bg='#2F3136' px={4}>
        <HStack width="100%" justifyContent="space-between">
          <Heading size="md" color="whiteAlpha.900">GM Holocron</Heading>
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
        </HStack>
      </Box>
      <Grid
        templateAreas={templateAreas}
        gridTemplateRows={'60px calc(100vh - 125px)'}
        gridTemplateColumns={'4fr 3fr 4fr'}
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
      </Grid>
      <DiceRollerModal snapshot={snapshot} onClose={closeSnapshot}/>
      <Spotlight/>
    </>
  )
}

export default App

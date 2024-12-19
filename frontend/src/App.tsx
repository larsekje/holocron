import {Box, Grid, GridItem, VStack, Text} from "@chakra-ui/react";
import React from "react";


import "./assets/sass/dice.sass"
import GameplayInfo from "@components/debug/GameplayInfo";
import ToolBar from "@components/turnbar/ToolBar";
import StructuredGameplayManager from "@components/debug/StructuredGameplayManager";
import DestinyPointManager from "@components/destinyPoints/DestinyPointManager";
import {ActiveEffectsList} from "@components/debug/ActiveEffectsList";
import EffectManager from "@components/debug/EffectManager";

function App() {
  const templateAreas = `"turn   turn    turn     turn"
                         "active targets targeted sidebar"`

  return (
    <>
      <Box display='flex' alignItems='center' h='50' bg='#2F3136'></Box>
      <Grid templateAreas={templateAreas} gridTemplateRows={'60px calc(100vh - 125px)'}
             gridTemplateColumns={'3fr 4fr 3fr 2fr'} gap='5px' padding='5px'>
        <GridItem area='turn'><ToolBar/></GridItem>
        <GridItem area='active' bg="dodgerblue">
            <EffectManager/>
        </GridItem>
        <GridItem area='targets' bg="gold">
            <StructuredGameplayManager/>
        </GridItem>
        <GridItem area='targeted' bg="tomato">
            <ActiveEffectsList/>
        </GridItem>
        <GridItem area='sidebar' bg='orchid'>
            <VStack>
                <GameplayInfo/>
                <DestinyPointManager/>
            </VStack>
        </GridItem>
      </Grid>
    </>
  )
}

export default App

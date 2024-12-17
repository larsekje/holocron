import {Box, Grid, GridItem} from "@chakra-ui/react";
import React from "react";


import "./assets/sass/dice.sass"
import GameplayInfo from "@components/debug/GameplayInfo";
import StructuredGameplayManager from "@components/debug/StructuredGameplayManager";
import ToolBar from "@components/turnbar/ToolBar";
import FSMTester from "@components/debug/FSMTester";

function App() {
  const templateAreas = `"turn   turn    turn     turn"
                         "active targets targeted sidebar"`

  return (
    <>
      <Box display='flex' alignItems='center' h='50' bg='#2F3136'></Box>
      <Grid templateAreas={templateAreas} gridTemplateRows={'60px calc(100vh - 125px)'}
             gridTemplateColumns={'3fr 4fr 3fr 2fr'} gap='5px' padding='5px'>
        <GridItem area='turn'><ToolBar/></GridItem>
        <GridItem area='active' bg="dodgerblue"></GridItem>
        <GridItem area='targets' bg="gold"><StructuredGameplayManager/></GridItem>
        <GridItem area='targeted' bg="tomato"><FSMTester/></GridItem>
        <GridItem area='sidebar' bg='orchid'><GameplayInfo/></GridItem>
      </Grid>
    </>
  )
}

export default App

import {Box, Grid, GridItem} from "@chakra-ui/react";
import NavBar from "./components/NavBar";
import React from "react";
import ContentCardActive from "./components/ContentCardActive";
import ContentCardTargets from "./components/ContentCardTargets";
import ContentCardTargeted from "./components/ContentCardTargeted";
import TurnBar from "./components/initiative/TurnBar";
import Sidebar from "./components/Sidebar";

import "./assets/sass/dice.sass"
import {useLoadData} from "@/dataStore";

function App() {
  useLoadData();

  const templateAreas = `"turn   turn    turn     turn"
                         "active targets targeted sidebar"`

  return (
    <>
      <Box display='flex' alignItems='center' h='50' bg='#2F3136'><NavBar/></Box>
      <Grid templateAreas={templateAreas} gridTemplateRows={'60px calc(100vh - 125px)'}
             gridTemplateColumns={'3fr 4fr 3fr 2fr'} gap='5px' padding='5px'>
        <GridItem area='turn'><TurnBar/></GridItem>
        <GridItem area='active'><ContentCardActive/></GridItem>
        <GridItem area='targets'><ContentCardTargets/></GridItem>
        <GridItem area='targeted'><ContentCardTargeted/></GridItem>
        <GridItem area='sidebar' bg='orchid'><Sidebar/></GridItem>
      </Grid>
    </>
  )
}

export default App

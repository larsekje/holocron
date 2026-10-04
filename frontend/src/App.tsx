import {Box, Grid, GridItem, useDisclosure} from "@chakra-ui/react";
import NavBar from "./components/NavBar";
import React from "react";
import ContentCardActive from "./components/ContentCardActive";
import ContentCardTargets from "./components/ContentCardTargets";
import ContentCardTargeted from "./components/ContentCardTargeted";
import TurnBar from "./components/initiative/TurnBar";
import ScenePanel from "./components/scenePanel/ScenePanel";
import SetPieceDrawer from "./components/drawer/setPiece/SetPieceDrawer";
import {useHotkeys} from "react-hotkeys-hook";

import "./assets/sass/dice.sass"

function App() {
  const templateAreas = `"turn   turn    turn     turn"
                         "active targets targeted sidebar"`

  const setPieceDrawer = useDisclosure();
  useHotkeys("s", (event) => {
    event.preventDefault();
    setPieceDrawer.onOpen();
  });

  return (
    <>
      <Box display='flex' alignItems='center' h='50' bg='#2F3136'>
        <NavBar onOpenSetPieces={setPieceDrawer.onOpen}/>
      </Box>
      <Grid templateAreas={templateAreas} gridTemplateRows={'60px calc(100vh - 125px)'}
             gridTemplateColumns={'3fr 4fr 3fr 2fr'} gap='5px' padding='5px'>
        <GridItem area='turn'><TurnBar/></GridItem>
        <GridItem area='active'><ContentCardActive/></GridItem>
        <GridItem area='targets'><ContentCardTargets/></GridItem>
        <GridItem area='targeted'><ContentCardTargeted/></GridItem>
        <GridItem area='sidebar'><ScenePanel/></GridItem>
      </Grid>
      <SetPieceDrawer isOpen={setPieceDrawer.isOpen} onClose={setPieceDrawer.onClose}/>
    </>
  )
}

export default App

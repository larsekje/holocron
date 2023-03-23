import {Box, Grid, GridItem} from "@chakra-ui/react";
import NavBar from "./components/NavBar";
import React from "react";
import ContentCardActive from "./components/ContentCardActive";
import ContentCardTargets, {Target} from "./components/ContentCardTargets";
import ContentCardTargeted from "./components/ContentCardTargeted";
import {TargetContextProvider} from "./TargetContext";

function App() {
  const templateAreas = `"turn   turn    turn     turn"
                         "active targets targeted sidebar"`

  const targets: Target[] = [
    {
      id: 1,
      name: "Imperial Stormtrooper",
      wt: 5,
      isSelected: false
    },
    {
      id: 2,
      name: "Thenn Hodar",
      wt: 11,
      isSelected: false
    },
    {
      id: 3,
      name: "Juggernaut",
      wt: 15,
      isSelected: false
    },
    {
      id: 4,
      name: "Stormtrooper Sergeant",
      wt: 8,
      isSelected: false
    }
  ];

  return (
    <>
      <Box display='flex' alignItems='center' h='50' bg='coral'><NavBar/></Box>
      <Grid templateAreas={templateAreas} gridTemplateRows={'60px calc(100vh - 125px)'}
             gridTemplateColumns={'3fr 4fr 3fr 2fr'} gap='5px' padding='5px'>
        <TargetContextProvider>
          <GridItem area='turn' bg='green.300'>Turn</GridItem>
          <GridItem area='active'><ContentCardActive/></GridItem>
          <GridItem area='targets'><ContentCardTargets targets={targets}/></GridItem>
          <GridItem area='targeted'><ContentCardTargeted/></GridItem>
          <GridItem area='sidebar' bg='orchid'>Sidebar</GridItem>
        </TargetContextProvider>
      </Grid></>

  )
}

export default App

import {Box, Grid, GridItem} from "@chakra-ui/react";
import NavBar from "./components/NavBar";

function App() {
  const templateAreas = `"turn   turn    turn     turn"
                         "active targets targeted sidebar"`

  return (
    <>
      <Box display='flex' alignItems='center' h='50' bg='coral'><NavBar/></Box>
      <Grid templateAreas={templateAreas} gridTemplateRows={'60px calc(100vh - 125px)'}
             gridTemplateColumns={'3fr 4fr 3fr 2fr'} gap='5px' padding='5px'>
      <GridItem area='turn' bg='green.300'>Turn</GridItem>
      <GridItem area='active' bg='gold'>Active</GridItem>
      <GridItem area='targets' bg='dodgerblue'>Targets</GridItem>
      <GridItem area='targeted' bg='tomato'>Targeted</GridItem>
      <GridItem area='sidebar' bg='orchid'>Sidebar</GridItem>
    </Grid></>

  )
}

export default App

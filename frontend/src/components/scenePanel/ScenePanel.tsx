import React from "react";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  Center,
  Heading,
  Text,
} from "@chakra-ui/react";
import { useSetPieceStore } from "@/setPieceStore";
import { ParsedText } from "@components/ParsedChakra";

const TIER_COLOR: Record<string, string> = {
  easy: "green",
  medium: "yellow",
  hard: "red",
};

const Prose = ({ text }: { text: string }) => {
  if (!text) return <Text color="whiteAlpha.600" fontStyle="italic">(empty)</Text>;
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <ParsedText key={i} color="whiteAlpha.900" mb={line.trim() === "" ? 2 : 1}>
          {line || " "}
        </ParsedText>
      ))}
    </>
  );
};

const ScenePanel = () => {
  const piece = useSetPieceStore(state => state.activePiece);

  if (!piece) {
    return (
      <Center height="100%" bg="#2A2C30" borderRadius="md" padding="20px">
        <Text color="whiteAlpha.700" textAlign="center">
          No set piece loaded.<br/>Press <strong>[s]</strong> to open the library.
        </Text>
      </Center>
    );
  }

  const sections = [
    { key: "tactics", label: "Tactics", text: piece.tactics, defaultOpen: true },
    { key: "scene", label: "Scene", text: piece.scene },
    { key: "battlefield", label: "Battlefield", text: piece.battlefield },
    { key: "suggested_adversaries", label: "Adversaries", text: piece.suggested_adversaries },
    { key: "skill_uses", label: "Skill uses", text: piece.skill_uses },
    { key: "dice_menu", label: "Dice spends", text: piece.dice_menu },
    { key: "gm_notes", label: "GM notes", text: piece.gm_notes },
  ];

  const defaultIndex = sections
    .map((s, i) => (s.defaultOpen ? i : -1))
    .filter(i => i >= 0);

  return (
    <Box bg="#2A2C30" borderRadius="md" height="100%" overflow="hidden" display="flex" flexDirection="column">
      <Box padding="10px 15px" borderBottom="1px solid #3e4249">
        <Heading size="sm" color="white" marginBottom="6px">{piece.name}</Heading>
        <Badge colorScheme={TIER_COLOR[piece.tier]} marginRight="4px">{piece.tier}</Badge>
        {piece.source === "library" && <Badge colorScheme="blue">library</Badge>}
        {piece.source === "user" && <Badge colorScheme="purple">user</Badge>}
      </Box>
      <Box overflowY="auto" flex="1" padding="5px">
        <Accordion allowMultiple defaultIndex={defaultIndex}>
          {sections.map(section => (
            <AccordionItem key={section.key} borderColor="#3e4249">
              <AccordionButton _hover={{ bg: "#33363C" }}>
                <Box flex="1" textAlign="left" color="white" fontWeight="semibold">
                  {section.label}
                </Box>
                <AccordionIcon color="white"/>
              </AccordionButton>
              <AccordionPanel paddingBottom={3} bg="#33363C">
                <Prose text={section.text}/>
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
      </Box>
    </Box>
  );
};

export default ScenePanel;

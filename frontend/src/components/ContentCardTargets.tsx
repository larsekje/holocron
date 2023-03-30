import React from 'react';
import {FaBug} from "react-icons/fa";
import {useDisclosure} from "@chakra-ui/react";
import {AddIcon} from "@chakra-ui/icons";
import ContentCard from "./ContentCard";
import TargetList from "./TargetList";
import HeadingButton from "./HeadingButton";
import {useTargetStore} from "../targetStore";
import AdversarySelectionDrawer from "./drawer/AdversarySelectionDrawer";

const ContentCardTargets = () => {
  const targets = useTargetStore(state => state.targets);

  const {isOpen, onOpen, onClose} = useDisclosure();
  const addTargetButton = <HeadingButton text='Add' shortcut={'n'} icon={<AddIcon color='green'/>} onClick={onOpen}/>
  const buttons = [addTargetButton]

  return (
    <>
      <ContentCard heading={'Targets'} buttons={buttons} icon={<FaBug/>}>
        <TargetList targets={targets}/>
      </ContentCard>
      <AdversarySelectionDrawer isOpen={isOpen} onClose={onClose}/>
    </>

  );
};

export default ContentCardTargets;

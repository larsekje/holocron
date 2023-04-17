import React from 'react';
import {FaBug} from "react-icons/fa";
import {useDisclosure} from "@chakra-ui/react";
import {AddIcon} from "@chakra-ui/icons";
import ContentCard from "./ContentCard";
import HeadingButton from "./HeadingButton";
import TargetList from "@components/TargetList";

const ContentCardTargets = () => {
  const {isOpen, onOpen, onClose} = useDisclosure();
  const addTargetButton = <HeadingButton key="target-add" text='Add' shortcut={'n'} icon={<AddIcon color='green'/>} onClick={onOpen}/>
  const buttons = [addTargetButton]

  return (
    <>
      <ContentCard heading={'Targets'} buttons={buttons} icon={<FaBug/>}>
        <TargetList/>
      </ContentCard>
    </>

  );
};

export default ContentCardTargets;

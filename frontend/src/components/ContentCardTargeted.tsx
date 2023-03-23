import React, {useContext} from 'react';
import ContentCard from "./ContentCard";
import HeadingButton from "./HeadingButton";
import {MdBuild} from "react-icons/md";
import {Heading} from "@chakra-ui/react";
import {TargetContext} from "../TargetContext";

const ContentCardTargeted = () => {

  const setActiveTargetButton = <HeadingButton text='Set Active' shortcut={'n'} onClick={() => console.log("Set Active target")}/>
  const eyeButton = <HeadingButton icon={<MdBuild color='white'/>} onClick={() => console.log("Eye see you")} label='Toggle additional information'/>
  const buttons = [setActiveTargetButton, eyeButton]

  const [selectedTarget] = useContext(TargetContext);

  return (
    <ContentCard heading='Targeted' buttons={buttons}>
      <Heading color='white'>{selectedTarget ? selectedTarget.name : "No target selected"}</Heading>
    </ContentCard>
  );
};

export default ContentCardTargeted;

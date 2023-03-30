import React from 'react';
import ContentCard from "./ContentCard";
import HeadingButton from "./HeadingButton";
import {MdBuild} from "react-icons/md";
import StatSheet from "./StatSheet";
import {useTargetStore} from "../targetStore";

const ContentCardTargeted = () => {
  const setActiveTargetButton = <HeadingButton text='Set Active' shortcut={'n'} onClick={() => console.log("Set Active target")}/>
  const eyeButton = <HeadingButton icon={<MdBuild color='white'/>} onClick={() => console.log("Eye see you")} label='Toggle additional information'/>
  const buttons = [setActiveTargetButton, eyeButton]

  const selectedTarget = useTargetStore(state => state.selectedTarget);

  return (
    <ContentCard heading='Targeted' buttons={buttons}>
      <StatSheet target={selectedTarget}/>
    </ContentCard>
  );
};

export default ContentCardTargeted;

import React from 'react';
import ContentCard from "./ContentCard";
import HeadingButton from "./HeadingButton";
import {MdBuild} from "react-icons/md";

const ContentCardTargeted = () => {

  const setActiveTargetButton = <HeadingButton text='Set Active' shortcut={'n'} onClick={() => console.log("Set Active target")}/>
  const eyeButton = <HeadingButton icon={<MdBuild color='white'/>} onClick={() => console.log("Eye see you")} label='Toggle additional information'/>
  const buttons = [setActiveTargetButton, eyeButton]

  return (
    <ContentCard heading='Targeted' buttons={buttons}>

    </ContentCard>
  );
};

export default ContentCardTargeted;

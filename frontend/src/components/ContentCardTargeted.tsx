import React from 'react';
import ContentCard from "./ContentCard";
import HeadingButton from "./HeadingButton";
import {MdBuild} from "react-icons/md";
import {useTargetStore} from "@/targetStore";

const ContentCardTargeted = () => {
  const selectedTarget = useTargetStore(state => state.selectedTarget);
  const setActive = useTargetStore(state => state.setActive);

  const setActiveTargetButton = <HeadingButton text='Set Active' shortcut={'a'} onClick={() => setActive(selectedTarget)}/>
  const eyeButton = <HeadingButton icon={<MdBuild color='white'/>} onClick={() => console.log("Eye see you")} label='Toggle additional information'/>
  const buttons = [setActiveTargetButton, eyeButton]


  return (
    <ContentCard heading='Targeted' buttons={buttons}>
      {/*<StatSheet target={selectedTarget}/>*/}
    </ContentCard>
  );
};

export default ContentCardTargeted;

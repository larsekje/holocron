import React from "react";
import { Tooltip } from "@chakra-ui/react";
import { BsCircle, BsCircleFill } from "react-icons/bs";
import { IconType } from "react-icons";

interface Props {
  listedSkill: boolean;
}

const SkillItem = ({listedSkill}: Props) => {
  const icon: IconType = listedSkill ? BsCircleFill : BsCircle;
  const iconElement = React.createElement(icon, {
    color: "white",
    fontSize: "10px",
  });

  return (
    <Tooltip hasArrow placement="top" openDelay={200} label={listedSkill ? "Skill listed in profile" : "Skill not listed in profile"}>
      <div>{iconElement}</div>
    </Tooltip>
  );
};

export default SkillItem;

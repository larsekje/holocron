import React from 'react'
import useGameplayStore from "@/state/newGameplayStore";
import useSkillChallengeStore from "@/state/skillChallengeStore";
import ToolBarStructured from "@components/turnbar/ToolBarStructured";
import ToolBarNonStructured from "@components/turnbar/ToolBarNonStructured";
import SkillChallengeToolBar from "@components/skillChallenge/SkillChallengeToolBar";
import {Flex} from "@chakra-ui/react";

interface Props { }

// Skill challenges and encounters are mutually exclusive in play, so the
// toolbar swaps wholesale: an active skill challenge takes priority over the
// encounter UI; otherwise mode dictates structured vs non-structured.
const ToolBar = ({ }: Props) => {

    const mode = useGameplayStore((state) => state.context.mode);
    const skillChallengeActive = useSkillChallengeStore((s) => s.active !== null);

    return (
        <Flex borderRadius="md" bg="#2A2C30" align="center" justify="space-between" h="100%" w="100%">
            {skillChallengeActive
                ? <SkillChallengeToolBar/>
                : (mode === 'structured' ? <ToolBarStructured/> : <ToolBarNonStructured/>)}
        </Flex>
        );
}

export default ToolBar
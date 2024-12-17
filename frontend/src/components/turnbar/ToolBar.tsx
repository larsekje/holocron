import React from 'react'
import useGameplayStore from "@/state/newGameplayStore";
import ToolBarStructured from "@components/turnbar/ToolBarStructured";
import ToolBarNonStructured from "@components/turnbar/ToolBarNonStructured";
import {Flex} from "@chakra-ui/react";

interface Props { }

const ToolBar = ({ }: Props) => {

    const mode = useGameplayStore((state) => state.context.mode);

    return (
        <Flex borderRadius="md" bg="#2A2C30" align="center" justify="space-between" h="100%" w="100%">
            {mode === 'structured' ? <ToolBarStructured/> : <ToolBarNonStructured/>}
        </Flex>
        );
}

export default ToolBar
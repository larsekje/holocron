import React, { useState } from "react";
import { Flex, Text, Button, Tooltip, Box } from "@chakra-ui/react";

const EffectButton = ({
                          icon,
                          label,
                          count,
                          onIncrease,
                          onDecrease,
                          hidden,
                      }: {
    icon: JSX.Element;
    label: string;
    count: number;
    onIncrease: () => void;
    onDecrease: () => void;
    hidden: boolean;
}) => (
    <Flex
        direction="column"
        align="center"
        justify="center"
        w="10px"
        h="10px"
        opacity={hidden && count === 0 ? 0 : 1} // Hide when required
        visibility={hidden && count === 0 ? "hidden" : "visible"} // Prevent interaction when hidden
        transition="opacity 0.2s ease"
    >
        <Tooltip label={label} placement="top">
            <Button
                onClick={(e) => {
                    e.preventDefault();
                    onIncrease();
                }}
                onContextMenu={(e) => {
                    e.preventDefault();
                    onDecrease();
                }}
                size="xs"
                bg={count > 0 ? "gray.200" : "transparent"}
                borderWidth={count > 0 ? "1px" : "0"}
                boxShadow={count > 0 ? "md" : "none"}
                _hover={{ bg: "gray.300", opacity: 1 }}
                minH="10px"
                minW="10px"
                padding={0}
                margin={0}
            >
                <Box position="relative" display="flex" justifyContent="center" alignItems="center" w="full" h="full">
                    {icon}
                </Box>
            </Button>
        </Tooltip>
    </Flex>
);

export const NPCSlot = () => {
    const [hovering, setHovering] = useState(false);

    const [effects, setEffects] = useState({
        boost: 0,
        setback: 0,
        upgradeCheck: 0,
        upgradeDifficulty: 0,
    });

    // Centralized handler for increase/decrease
    const updateEffect = (key: keyof typeof effects, delta: number) =>
        setEffects((prev) => ({ ...prev, [key]: Math.max(prev[key] + delta, 0) }));

    const effectsData = [
        { key: "boost", label: "Boost", color: "blue.400" },
        { key: "setback", label: "Setback", color: "black" },
        { key: "upgradeCheck", label: "Upgrade Ability", color: "green.400", rotate: "45deg" },
        { key: "upgradeDifficulty", label: "Upgrade Difficulty", color: "purple.400", rotate: "45deg" },
    ];

    return (
        <Flex
            direction="column"
            align="center"
            justify="center"
            borderWidth="1px"
            borderRadius="lg"
            boxShadow="md"
            borderColor="gray.300"
            bg="gray.100"
            position="relative"
            w="80px"
            p={1}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
        >
            <Flex justify="right" w="100%" gap={1}>
                {effectsData.map(({ key, label, color, rotate }) => (
                    <EffectButton
                        key={key}
                        icon={<Box w="10px" h="10px" bg={color} transform={rotate && `rotate(${rotate})`} />}
                        label={label}
                        count={effects[key as keyof typeof effects]}
                        onIncrease={() => updateEffect(key as keyof typeof effects, +1)}
                        onDecrease={() => updateEffect(key as keyof typeof effects, -1)}
                        hidden={!hovering}
                    />
                ))}
            </Flex>
            <Text fontWeight="bold" fontSize="ms" color="blackAlpha.800">
                NPC
            </Text>
        </Flex>
    );
};
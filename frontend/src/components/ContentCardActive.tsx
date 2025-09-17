import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    Text,
    Button,
    HStack,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Portal,
    Spinner,
    useToast,
    IconButton,
    Tooltip
} from '@chakra-ui/react';
import { AddIcon, QuestionIcon, ChevronDownIcon, RepeatIcon } from '@chakra-ui/icons';
import { FaSkull, FaUserNinja, FaUserTie } from 'react-icons/fa';
import useParticipantStore from '@/state/participantsStore';
import ParticipantStatus from './participantStatus/ParticipantStatus';
import AdversarySelector from './adversaries/AdversarySelector';
import adversaryService from '@/services/adversaryService';
import ContentCard from './ContentCard';

type AdversaryType = 'Minion' | 'Rival' | 'Nemesis' | undefined;

/**
 * Component to display a list of participants with their status
 * This component is designed to work in both structured and non-structured modes
 */
const ContentCardTargets: React.FC = () => {

    // Menu buttons for the ContentCard header
    const cardButtons = (
        <>
            <HStack spacing={2}>
                <Tooltip label="Add Minion">
                    <IconButton
                        aria-label="Add Minion adversary"
                        icon={<FaSkull />}
                        size="sm"
                        colorScheme="green"
                        variant="ghost"
                    />
                </Tooltip>
                <Tooltip label="Add Rival">
                    <IconButton
                        aria-label="Add Rival adversary"
                        icon={<FaUserNinja />}
                        size="sm"
                        colorScheme="orange"
                        variant="ghost"
                    />
                </Tooltip>
                <Tooltip label="Add Nemesis">
                    <IconButton
                        aria-label="Add Nemesis adversary"
                        icon={<FaUserTie />}
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                    />
                </Tooltip>
                <Tooltip label="Add specific adversary">
                    <IconButton
                        aria-label="Add specific adversary"
                        icon={<AddIcon />}
                        size="sm"
                        colorScheme="blue"
                        variant="ghost"
                    />
                </Tooltip>
            </HStack>
        </>
    );

    return (
        <ContentCard
            heading="Targets"
            buttons={cardButtons}
            icon={<RepeatIcon />}
        >

        </ContentCard>
    );
};

export default ContentCardTargets;

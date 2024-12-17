import DestinyEditorModal from "@components/destinyPoints/DestinyPoolEditorModal";
import {Box, IconButton, useDisclosure} from "@chakra-ui/react";
import {EditIcon} from "@chakra-ui/icons";
import DestinyPoolDisplay from "@components/destinyPoints/DestinyPoolDisplay";
import {useDestinyStore} from "@/state/destinyPoolStore";
import useParticipantStore from "@/state/participantsStore";
import {useState} from "react";

const DestinyPointsManager: React.FC = () => {
    // Zustand hooks for destiny pool state
    const { setDestinyPool, flipDestinyPoint, destinyPool } = useDestinyStore();

    // Zustand hook for fetching PCs (participants)
    const pcs = useParticipantStore((state) =>
        state.participants.filter((p) => p.isPC)
    );

    // Modal management through Chakra UI's useDisclosure hook
    const { isOpen, onOpen, onClose } = useDisclosure();

    // State for handling PC contributions
    const [pcContributions, setPcContributions] = useState<{
        [pcId: string]: { light: number; dark: number };
    }>({});
    const [selectedContributions, setSelectedContributions] = useState<{
        [pcId: string]: string;
    }>({});

    // State for temporarily saving changes when editing contributions
    const [tempContributions, setTempContributions] = useState<{
        [pcId: string]: { light: number; dark: number };
    }>({});
    const [tempSelectedContributions, setTempSelectedContributions] = useState<{
        [pcId: string]: string;
    }>({});

    // Functions to handle contributions
    const updateContribution = (
        pcId: string,
        type: "light" | "dark",
        value: number
    ) => {
        setPcContributions((prev) => ({
            ...prev,
            [pcId]: {
                light: type === "light" ? value : 0,
                dark: type === "dark" ? value : 0,
            },
        }));
    };

    // Open the modal and save a snapshot of the current contributions
    const handleOpen = () => {
        setTempContributions(pcContributions);
        setTempSelectedContributions(selectedContributions);
        onOpen();
    };

    // Close the modal and restore to the snapshot state
    const handleClose = () => {
        setPcContributions(tempContributions);
        setSelectedContributions(tempSelectedContributions);
        onClose();
    };

    // Reset all contributions and selections
    const onReset = () => {
        setPcContributions({});
        setSelectedContributions({});
    };

    // Finalize the contributions by saving to Zustand state
    const finalizeContributions = () => {
        let lightTokens = 0;
        let darkTokens = 0;

        Object.values(pcContributions).forEach(({ light, dark }) => {
            lightTokens += light;
            darkTokens += dark;
        });

        setDestinyPool(lightTokens, darkTokens);
        onClose();
    };

    // Handle UI selection of contributions
    const handleSelection = (pcId: string, value: string) => {
        setSelectedContributions((prev) => ({
            ...prev,
            [pcId]: value,
        }));

        const [type, contributionValue] = [
            value.slice(0, -1) as "light" | "dark",
            parseInt(value.slice(-1), 10),
        ];
        updateContribution(pcId, type, contributionValue);
    };

    return (
        <Box
            p={4}
            bg="gray.50"
            borderRadius="lg"
            boxShadow="md"
            mt={2}
            w="100%"
            mx="auto"
            position="relative"
        >
            {/* Display and flip the current destiny pool */}
            <DestinyPoolDisplay
                destinyPool={destinyPool}
                flipDestinyPoint={flipDestinyPoint}
            />

            {/* Open modal with edit button */}
            <IconButton
                icon={<EditIcon />}
                aria-label="Edit Pool"
                size="sm"
                colorScheme="teal"
                position="absolute"
                top="4px"
                right="4px"
                borderRadius="full"
                variant="ghost"
                onClick={handleOpen}
            />

            {/* Contribution editor modal */}
            <DestinyEditorModal
                isOpen={isOpen}
                onClose={handleClose}
                pcs={pcs}
                selectedContributions={selectedContributions}
                handleSelection={handleSelection}
                onReset={onReset}
                onConfirm={finalizeContributions}
            />
        </Box>
    );
};

export default DestinyPointsManager;
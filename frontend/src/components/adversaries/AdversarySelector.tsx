import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Input,
  Box,
  Text,
  Flex,
  Spinner,
  Select,
  VStack,
  HStack,
  Badge,
  useToast,
  Divider,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { Adversary } from '@/types/adversaryTypes';
import adversaryService from '@/services/adversaryService';
import useParticipantStore from '@/state/participantsStore';

interface AdversarySelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Component for selecting an adversary to add as a participant
 */
const AdversarySelector: React.FC<AdversarySelectorProps> = ({ isOpen, onClose }) => {
  const [adversaries, setAdversaries] = useState<Adversary[]>([]);
  const [filteredAdversaries, setFilteredAdversaries] = useState<Adversary[]>([]);
  const [selectedAdversary, setSelectedAdversary] = useState<Adversary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [minionCount, setMinionCount] = useState<number>(4);
  
  const { addParticipant } = useParticipantStore();
  const toast = useToast();
  
  // Load adversaries when component mounts
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await adversaryService.getAdversaries();
        setAdversaries(data);
        setFilteredAdversaries(data);
      } catch (error) {
        console.error('Failed to load adversaries:', error);
        toast({
          title: 'Error loading adversaries',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [toast]);
  
  // Filter adversaries when search term or type filter changes
  useEffect(() => {
    let filtered = adversaries;
    
    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(adv => adv.type === typeFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(adv => 
        adv.name.toLowerCase().includes(term) ||
        (adv.description && adv.description.toLowerCase().includes(term))
      );
    }
    
    setFilteredAdversaries(filtered);
  }, [adversaries, searchTerm, typeFilter]);
  
  // Add the selected adversary as a participant
  const handleAddAdversary = () => {
    if (!selectedAdversary) return;
    
    try {
      // Use adversaryService to convert adversary to participant
      const newParticipant = adversaryService.convertToParticipant(selectedAdversary);
      
      // Customize the minion count if applicable
      if (selectedAdversary.type === 'Minion') {
        newParticipant.stats!.minions = minionCount;
      }
      
      // Add the converted participant
      addParticipant(newParticipant);
      
      toast({
        title: 'Adversary added',
        description: `${selectedAdversary.name} has been added as a participant`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onClose();
    } catch (error) {
      console.error('Error converting adversary to participant:', error);
      toast({
        title: 'Error adding adversary',
        description: 'Could not convert adversary to participant',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Select Adversary</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Search and filtering */}
            <HStack>
              <Input 
                placeholder="Search by name or description..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                flex={1}
              />
              <Select 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value)}
                width="150px"
              >
                <option value="all">All Types</option>
                <option value="Minion">Minion</option>
                <option value="Rival">Rival</option>
                <option value="Nemesis">Nemesis</option>
              </Select>
            </HStack>
            
            {/* Results count */}
            <Text fontSize="sm" color="gray.600">
              Showing {filteredAdversaries.length} of {adversaries.length} adversaries
            </Text>
            
            {/* Loading state */}
            {loading ? (
              <Flex justify="center" py={8}>
                <Spinner />
              </Flex>
            ) : (
              <Box maxHeight="400px" overflowY="auto" borderWidth="1px" borderRadius="md">
                <VStack divider={<Divider />} spacing={0} align="stretch">
                  {filteredAdversaries.length === 0 ? (
                    <Text p={4} textAlign="center">No adversaries match your search</Text>
                  ) : (
                    filteredAdversaries.map((adversary) => (
                      <Box 
                        key={adversary.name}
                        p={3}
                        cursor="pointer"
                        bg={selectedAdversary?.name === adversary.name ? 'blue.50' : 'white'}
                        onClick={() => setSelectedAdversary(adversary)}
                        _hover={{ bg: 'gray.50' }}
                      >
                        <Flex justify="space-between" align="center">
                          <Text fontWeight="bold">{adversary.name}</Text>
                          <Badge colorScheme={
                            adversary.type === 'Minion' ? 'green' :
                            adversary.type === 'Rival' ? 'blue' : 'red'
                          }>
                            {adversary.type}
                          </Badge>
                        </Flex>
                        {selectedAdversary?.name === adversary.name && (
                          <Text fontSize="sm" mt={2} noOfLines={2}>
                            {adversary.description || 'No description available'}
                          </Text>
                        )}
                      </Box>
                    ))
                  )}
                </VStack>
              </Box>
            )}
            
            {/* Minion count selector, only shown when a minion is selected */}
            {selectedAdversary?.type === 'Minion' && (
              <FormControl>
                <FormLabel>Number of Minions</FormLabel>
                <NumberInput 
                  min={1} 
                  max={10} 
                  value={minionCount}
                  onChange={(_, value) => setMinionCount(value)}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleAddAdversary}
            isDisabled={!selectedAdversary}
          >
            Add Adversary
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AdversarySelector;

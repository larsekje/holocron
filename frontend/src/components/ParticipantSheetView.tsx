import React, {ReactNode, useEffect, useState} from 'react';
import {Button, HStack} from '@chakra-ui/react';
import StatSheetOld from '@components/StatSheetOld';
import VehicleStatSheetOld from '@components/VehicleStatSheetOld';
import useActiveVehicleStore from '@/state/activeVehicleStore';
import type {Participant} from '@/state/participantsStore';

type ViewMode = 'hybrid' | 'personal';

interface SegmentedToggleOption {
  value: string;
  label: string;
}

interface SegmentedToggleProps {
  options: SegmentedToggleOption[];
  value: string;
  onChange: (value: string) => void;
}

/** Compact two-or-more-state segmented switch designed to slot into
 * `ContentCardOld`'s header `buttons` row alongside other small buttons. */
export const SegmentedToggle: React.FC<SegmentedToggleProps> = ({options, value, onChange}) => (
  <HStack
    spacing={0}
    borderWidth="1px"
    borderColor="whiteAlpha.300"
    borderRadius="md"
    overflow="hidden"
  >
    {options.map((opt, i) => {
      const isActive = opt.value === value;
      return (
        <Button
          key={opt.value}
          size="xs"
          variant="unstyled"
          onClick={() => onChange(opt.value)}
          px={3}
          h="26px"
          minW="auto"
          borderRadius={0}
          borderLeftWidth={i === 0 ? 0 : '1px'}
          borderLeftColor="whiteAlpha.300"
          bg={isActive ? '#d39939' : 'transparent'}
          color={isActive ? 'gray.900' : 'whiteAlpha.800'}
          fontWeight={isActive ? 'bold' : 'normal'}
          fontSize="xs"
          _hover={{bg: isActive ? '#d39939' : 'whiteAlpha.100'}}
        >
          {opt.label}
        </Button>
      );
    })}
  </HStack>
);

export interface ParticipantSheetView {
  toggle: ReactNode | null;
  body: ReactNode | null;
}

/** Returns the header toggle + body to render for a participant pane. When the
 * participant is aboard a vehicle, the toggle flips between a hybrid view
 * (vehicle sheet + character vitals strip) and the personal character sheet;
 * defaults to hybrid and resets when the participant changes. When the
 * participant has no vehicle, no toggle is returned and the body is just the
 * regular character sheet. */
export function useParticipantSheetView(participant: Participant | null): ParticipantSheetView {
  const [viewMode, setViewMode] = useState<ViewMode>('hybrid');
  const vehicles = useActiveVehicleStore((s) => s.vehicles);

  useEffect(() => {
    setViewMode('hybrid');
  }, [participant?.id]);

  if (!participant) {
    return {toggle: null, body: null};
  }

  const vehicle = participant.equippedVehicleId
    ? vehicles[participant.equippedVehicleId] ?? null
    : null;

  if (!vehicle) {
    return {toggle: null, body: <StatSheetOld participant={participant}/>};
  }

  const toggle = (
    <SegmentedToggle
      options={[
        {value: 'hybrid', label: 'Hybrid'},
        {value: 'personal', label: 'Personal'},
      ]}
      value={viewMode}
      onChange={(v) => setViewMode(v as ViewMode)}
    />
  );

  const body = viewMode === 'hybrid'
    ? <VehicleStatSheetOld vehicle={vehicle} contextParticipant={participant}/>
    : <StatSheetOld participant={participant}/>;

  return {toggle, body};
}

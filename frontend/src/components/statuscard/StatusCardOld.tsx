import React from 'react';
import {Card, CardBody, HStack, Text} from "@chakra-ui/react";
import HealthBarOld from "./HealthBarOld";
import InlineNumber from "@components/common/InlineNumber";
import {Participant} from "@/state/participantsStore";
import useParticipantStore from "@/state/participantsStore";

interface Props {
  participant: Participant;
}

const HIGHLIGHT_TALENTS = ["Adversary", "Nobody's Fool", "Durable", "Parry", "Reflect", "Dodge"];

function findHighlightedTalents(talents: string[]): string[] {
  return HIGHLIGHT_TALENTS
    .map((needle) => talents.find((t) => t.toLowerCase().includes(needle.toLowerCase())))
    .filter((t): t is string => t !== undefined);
}

const StatusCardOld = ({participant}: Props) => {
  const addWounds = useParticipantStore((state) => state.addWounds);
  const removeWounds = useParticipantStore((state) => state.removeWounds);
  const addStrain = useParticipantStore((state) => state.addStrain);
  const removeStrain = useParticipantStore((state) => state.removeStrain);
  const setMinionCount = useParticipantStore((state) => state.setMinionCount);
  const setStat = useParticipantStore((state) => state.setStat);

  const stats = participant.stats || {};
  const woundThreshold = stats.woundThreshold ?? (participant.isPC ? 12 : 8);
  const woundsTaken = stats.wounds ?? 0;

  const initialMinions = stats.minions;
  const isMinionGroup = initialMinions !== undefined;
  const aliveMinions = isMinionGroup
    ? Math.max(initialMinions - Math.floor(woundsTaken / Math.max(woundThreshold, 1)), 0)
    : undefined;

  const tracksStrain = participant.isPC || stats.type === "Nemesis";
  const strainThreshold = stats.strainThreshold ?? (participant.isPC ? 14 : 0);
  const strain = (stats as Record<string, number>).strain ?? 0;

  const meleeDefense = stats.meleeDefense ?? 0;
  const rangedDefense = stats.rangedDefense ?? 0;
  const soak = stats.soak ?? (participant.isPC ? 3 : 2);

  const highlightedTalents = findHighlightedTalents(stats.talents ?? []);

  return (
    <Card margin="10px 0" bg="#2A2C30">
      <CardBody width="100%" padding="2">
        <HealthBarOld
          name="Wounds"
          max={woundThreshold}
          current={woundsTaken}
          minions={initialMinions}
          onDecrease={() => removeWounds(participant.id, 1)}
          onIncrease={() => addWounds(participant.id, 1)}
          onSetThreshold={(v) => setStat(participant.id, "woundThreshold", v)}
        />
        {tracksStrain && strainThreshold > 0 && (
          <HealthBarOld
            name="Strain"
            max={strainThreshold}
            current={strain}
            onDecrease={() => removeStrain(participant.id, 1)}
            onIncrease={() => addStrain(participant.id, 1)}
            onSetThreshold={(v) => setStat(participant.id, "strainThreshold", v)}
          />
        )}

        <HStack paddingTop="10px" wrap="wrap" spacing={2} fontSize="sm" color="white">
          <HStack spacing={1}>
            <Text>Soak</Text>
            <InlineNumber value={soak} min={0} onSave={(v) => setStat(participant.id, "soak", v)}/>
          </HStack>

          <Text color="whiteAlpha.500">|</Text>

          <HStack spacing={1}>
            <Text>Defense M</Text>
            <InlineNumber value={meleeDefense} min={0} onSave={(v) => setStat(participant.id, "meleeDefense", v)}/>
            <Text>R</Text>
            <InlineNumber value={rangedDefense} min={0} onSave={(v) => setStat(participant.id, "rangedDefense", v)}/>
          </HStack>

          {highlightedTalents.map((t) => (
            <React.Fragment key={t}>
              <Text color="whiteAlpha.500">|</Text>
              <Text>{t}</Text>
            </React.Fragment>
          ))}

          {isMinionGroup && (
            <>
              <Text color="whiteAlpha.500">|</Text>
              <HStack spacing={1}>
                <Text>Minions</Text>
                <Text fontWeight="bold">{aliveMinions}/</Text>
                <InlineNumber
                  value={initialMinions}
                  min={1}
                  max={20}
                  onSave={(v) => setMinionCount(participant.id, v)}
                />
              </HStack>
            </>
          )}
        </HStack>
      </CardBody>
    </Card>
  );
};

export default StatusCardOld;

import {ActiveEffect} from "@/types/effectTypes";
import {applyEffect} from "@/utils/applyEffects";
import useParticipantStore, {Participant} from "@/state/participantsStore";

const addBurning = (participant: Participant, damage: number, duration: number) => {

    const addWounds = useParticipantStore((state) => state.addWounds);

    const burningEffect: ActiveEffect = {
        effect: {
            id: "burning",
            name: "Burning",
            description: `This participant is burning, taking ${damage} damage per turn.`,
            type: "debuff",
            trigger: "turn-start",
            duration,
            apply: (participant) => {
                addWounds(participant.id, damage);
                console.log(`${participant.name} takes ${damage} damage from Burning.`);
            },
            end: (participant) => {
                console.log(`${participant.name}'s Burning effect has ended.`);
            },
        },
        remainingDuration: duration,
    };

    applyEffect(participant.id, burningEffect, duration);
};

export const EffectsCatalog = {
    Burn: addBurning,
};
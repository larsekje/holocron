import {ActiveEffect, ParticipantEffect} from "@/types/effectTypes";
import {useEffectStore} from "@/state/effectStore";

export function applyEffect(
    target: string,
    effect: ActiveEffect,
    duration?: number // Optional runtime override for effect duration
): void {

}
// Reference tables for spending narrative-dice symbols, paraphrased from the
// FFG SWRPG core rules (EoE/AoR/F&D Tables 2-3, 2-4, 2-11, 2-12). These are
// *suggestion* tables the GM consults when their dice pool produced symbols
// that don't map cleanly to a prescribed effect — the published list of
// example spends, grouped by context. The active-roll path is covered by
// SpendPanel; this file feeds the SymbolSpendsModal lookup.

export type SpendCurrency = 'advantage' | 'triumph' | 'threat' | 'despair';
export type SpendContext = 'combat' | 'social' | 'general';

export interface SpendEntry {
  /** Number of symbols of `currency` required. Triumph/Despair entries are
   * always 1 (the symbol itself); cost stays for uniform rendering. */
  cost: number;
  currency: SpendCurrency;
  label: string;
  /** Optional clarifying sub-text, shown muted below the label. */
  note?: string;
}

export interface SpendTable {
  context: SpendContext;
  title: string;
  blurb: string;
  /** Advantage + Triumph spends (the beneficial side). */
  positive: SpendEntry[];
  /** Threat + Despair spends (the costly side). */
  negative: SpendEntry[];
}

export const SPEND_TABLES: Record<SpendContext, SpendTable> = {
  combat: {
    context: 'combat',
    title: 'Combat',
    blurb:
      'During structured encounters: attacks, defence, range, weapon qualities.',
    positive: [
      { cost: 1, currency: 'advantage', label: 'Recover 1 strain' },
      { cost: 1, currency: 'advantage', label: 'Add a Boost die to the next allied character’s check' },
      { cost: 1, currency: 'advantage', label: 'Notice a single important point in the ongoing conflict' },
      { cost: 1, currency: 'advantage', label: 'Inflict a minor harmful condition on the opponent', note: 'Bumped elbow, dropped grenade pin, dust in the eye — narrative, not statused.' },
      { cost: 2, currency: 'advantage', label: 'Perform an immediate free maneuver', note: 'Counts toward the 2-maneuver limit; cannot bypass it.' },
      { cost: 2, currency: 'advantage', label: 'Add a Setback die to the targeted character’s next check' },
      { cost: 2, currency: 'advantage', label: 'Activate a weapon quality (Burn, Blast, Concussive, Disorient, Ensnare, Knockdown, Stun, Sunder, ...)' },
      { cost: 2, currency: 'advantage', label: 'Ignore the target’s defence (cover, ranged/melee defence) until end of turn' },
      { cost: 3, currency: 'advantage', label: 'Force the opponent to drop a weapon they are wielding' },
      { cost: 3, currency: 'advantage', label: 'Gain +1 ranged or melee defence until end of next turn' },
      { cost: 1, currency: 'triumph', label: 'Upgrade the difficulty of the targeted character’s next check' },
      { cost: 1, currency: 'triumph', label: 'Upgrade an allied character’s next check' },
      { cost: 1, currency: 'triumph', label: 'Activate a Critical Injury on a successful attack', note: 'Free, on top of the normal damage-exceeds-soak crit trigger.' },
      { cost: 1, currency: 'triumph', label: 'Disable a vehicle/starship system (lose shields, lose hyperdrive, hull breach)' },
    ],
    negative: [
      { cost: 1, currency: 'threat', label: 'Suffer 1 strain' },
      { cost: 1, currency: 'threat', label: 'Lose the benefit of a prior maneuver (aim, cover, guarded stance)' },
      { cost: 2, currency: 'threat', label: 'Add a Setback die to the active character’s next check' },
      { cost: 2, currency: 'threat', label: 'Inflict a minor harmful condition on the active character' },
      { cost: 2, currency: 'threat', label: 'Active character drops something they are holding' },
      { cost: 3, currency: 'threat', label: 'Active character falls prone' },
      { cost: 3, currency: 'threat', label: 'Active character grants the enemy a significant advantage', note: 'E.g. opens a line of fire, gives ground, exposes an ally.' },
      { cost: 1, currency: 'despair', label: 'Ranged weapon runs out of ammunition / power pack' },
      { cost: 1, currency: 'despair', label: 'Weapon or tool breaks or jams (one step worse, or unusable)' },
      { cost: 1, currency: 'despair', label: 'Active character suffers a Critical Injury', note: 'On a failed attack; on a successful one the target takes it instead at GM’s discretion.' },
      { cost: 1, currency: 'despair', label: 'Active character is disarmed (weapon flung out of reach)' },
      { cost: 1, currency: 'despair', label: 'A bystander, ally, or piece of cover is hit by collateral damage' },
    ],
  },
  social: {
    context: 'social',
    title: 'Social',
    blurb:
      'Charm, Coercion, Deception, Negotiation, Leadership — and the long con.',
    positive: [
      { cost: 1, currency: 'advantage', label: 'Recover 1 strain (composure regained)' },
      { cost: 1, currency: 'advantage', label: 'Add a Boost die to the next allied character’s social check' },
      { cost: 1, currency: 'advantage', label: 'Notice a tell — a hint about a person’s mood, intentions, or place of origin' },
      { cost: 1, currency: 'advantage', label: 'Inflict 1 strain on the opponent (rattled, embarrassed, on edge)' },
      { cost: 2, currency: 'advantage', label: 'Add a Setback die to the opponent’s next social check' },
      { cost: 2, currency: 'advantage', label: 'Make a strong impression — improve the opponent’s disposition by one step' },
      { cost: 2, currency: 'advantage', label: 'Plant a small idea or rumour the target accepts without examining' },
      { cost: 3, currency: 'advantage', label: 'Learn one important detail the target was trying to conceal' },
      { cost: 3, currency: 'advantage', label: 'Earn an introduction, favour, or unguarded moment from a third party present' },
      { cost: 1, currency: 'triumph', label: 'Win the target over on a major point — they become an ally for the encounter' },
      { cost: 1, currency: 'triumph', label: 'Discover a deep motive, secret, or weakness the target has never voiced aloud' },
      { cost: 1, currency: 'triumph', label: 'Upgrade an allied character’s next social check' },
    ],
    negative: [
      { cost: 1, currency: 'threat', label: 'Suffer 1 strain (frustration, awkwardness, lost composure)' },
      { cost: 1, currency: 'threat', label: 'Add a Setback die to the next allied character’s social check' },
      { cost: 2, currency: 'threat', label: 'Make a poor impression — worsen the opponent’s disposition by one step' },
      { cost: 2, currency: 'threat', label: 'Reveal more than intended (slip a name, location, or relationship)' },
      { cost: 3, currency: 'threat', label: 'A third party present takes offence or becomes wary of the active character' },
      { cost: 3, currency: 'threat', label: 'Owe a favour to get out of the conversation gracefully' },
      { cost: 1, currency: 'despair', label: 'Conversation ends badly — target leaves, refuses further contact, or becomes hostile' },
      { cost: 1, currency: 'despair', label: 'Active character lets slip a true motive, secret, or vulnerability of their own' },
      { cost: 1, currency: 'despair', label: 'Word spreads — a faction or NPC the character cares about hears about the encounter' },
      { cost: 1, currency: 'despair', label: 'A follower, contact, or ally loses faith in the active character' },
    ],
  },
  general: {
    context: 'general',
    title: 'General / Exploration',
    blurb:
      'Skill checks outside combat: hacking, sneaking, repairing, surviving, knowing.',
    positive: [
      { cost: 1, currency: 'advantage', label: 'Recover 1 strain' },
      { cost: 1, currency: 'advantage', label: 'Add a Boost die to the next allied character’s check' },
      { cost: 1, currency: 'advantage', label: 'Notice an important detail (a clue, a route, a piece of evidence)' },
      { cost: 1, currency: 'advantage', label: 'Reduce the time required to complete the task' },
      { cost: 2, currency: 'advantage', label: 'Add a Setback die to the next opposing character’s check' },
      { cost: 2, currency: 'advantage', label: 'Spot a follow-on opportunity (a second hack target, a back door, a contact)' },
      { cost: 2, currency: 'advantage', label: 'Leave the situation cleaner than expected (no trace, no evidence, no alarm)' },
      { cost: 3, currency: 'advantage', label: 'Gain a side benefit the player describes — GM approves a meaningful narrative perk' },
      { cost: 3, currency: 'advantage', label: 'Downgrade the difficulty of the next related check' },
      { cost: 1, currency: 'triumph', label: 'Achieve a wholly unexpected secondary benefit', note: 'A new contact, a piece of intel, a backup plan that just works.' },
      { cost: 1, currency: 'triumph', label: 'Upgrade an allied character’s next related check' },
      { cost: 1, currency: 'triumph', label: 'The success is so emphatic that NPCs who hear about it react favourably going forward' },
    ],
    negative: [
      { cost: 1, currency: 'threat', label: 'Suffer 1 strain' },
      { cost: 1, currency: 'threat', label: 'Lose the benefit of a prior preparation or maneuver' },
      { cost: 2, currency: 'threat', label: 'Take twice as long to complete the task' },
      { cost: 2, currency: 'threat', label: 'Add a Setback die to the next related check' },
      { cost: 3, currency: 'threat', label: 'Damage a tool or piece of equipment one step' },
      { cost: 3, currency: 'threat', label: 'Leave a trace, alert, or piece of evidence behind' },
      { cost: 1, currency: 'despair', label: 'Tool or piece of equipment breaks outright' },
      { cost: 1, currency: 'despair', label: 'Active character is noticed, identified, or compromised' },
      { cost: 1, currency: 'despair', label: 'The task succeeds but yields the wrong result, or with a hidden flaw the character does not detect' },
      { cost: 1, currency: 'despair', label: 'A new complication arises that draws in a faction, NPC, or follow-up problem' },
    ],
  },
};

export const SPEND_CONTEXT_ORDER: SpendContext[] = ['combat', 'social', 'general'];

# Holocron — first-test-session roadmap

Working priority list for getting the GM tool into a usable state for an actual play test.

Source: feature audit against `Holocron v2.pdf` (2026-05-09).

## Design constraints (durable)

- **The tool aids the GM's mental load — it does not automate the game.** Every feature should answer "what does the GM forget mid-session?" not "what could the computer simulate?"
- **Theatre of the mind.** No per-character spatial state, no map, no automatic range tracking. References and reminders only.
- **PC-side bookkeeping is the players' job.** Morality, Conflict, Obligation, Duty, XP, and Force dice/ratings are tracked on player sheets, not here.

## First-session priority

1. ✅ **Range band glossary** — Cmd+K rule card + dimmed combat-roll tiers beyond weapon's `baseRange`. (Spotlight `rule_range-bands`, `DifficultyRangeList.tsx`.)
2. ✅ **Skill challenges** — treated as a structured-play mode parallel to encounters; the two are mutually exclusive in the toolbar. Backed by `skillChallengeStore`. Core model: succ vs fail (always required) with an optional turn-limit secondary cap. Four PDF p. 15 difficulty presets (Light 10s/5t · Medium 10s/3t · Hard 15s/5t · Tough 18s/3t) auto-enable the turn limit; manual fields and the turn-limit toggle let the GM customise. After each roll the GM judges narratively and clicks +Success / +Failure / Next Turn; tally auto-flips to Won / Lost at thresholds; Undo handles fat-finger. Lifecycle events (start, won, lost, abandoned) write to `sessionLogStore`; per-increment changes don't.

   **UI placement**: `SkillChallengeStartButton` sits next to "Roll Initiative" in `ToolBarNonStructured`. While a challenge is active, `ToolBar` swaps the entire toolbar to `SkillChallengeToolBar` (replacing both structured and non-structured variants). Files: `state/skillChallengeStore.ts`, `components/skillChallenge/{StartChallengeModal,SkillChallengeStartButton,SkillChallengeToolBar}.tsx`.

   **Deferred:** auto-crediting dice-roller outcomes to the active challenge (currently the GM increments manually). The legacy `SkillChallengePlaceholder` modal-mode in `DiceRollerModal` is left in place — it's vestigial and can be removed when the modal mode is repurposed.
3. ✅ **Weapon qualities in SpendPanel** — `ACTIVE_QUALITY_SPECS` in `SpendPanel.tsx` enumerates the 11 active qualities with PDF-correct activation costs and effect summaries. Auto-applying status effects via `effectStore` is wired for Disorient/Ensnare/Concussive/Burn/Knockdown — clicking the spend drops the chip on the target and undoing removes it. Auto-fire / Linked / Blast / Stun / Sunder / Guided remain log-only (they're extra hits or narrative). Passives stay excluded.
4. **Simplified vehicles** — model after https://swa.stoogoff.com/#accomplished-mechanic. Need to read it and sketch before building.
5. **Campaign persistence** — encounter templates loadable into `encountersStore`; expand `sessionLogStore` for save/restore.

## Open questions (need answers before implementing)

- **Skill challenge model**: structured "X successes before Y failures" (PDF p. 15) or looser threshold? Player-visible progress or GM-only?
- **Encounter templates**: Spotlight-bound (drop-in adversary stat blocks, cheaper) or freeform JSON (more flexible)?

## Deferred (not for first session)

- Action economy enforcement (2-maneuver cap, strain-for-extra-maneuver) — scope creep
- Tier 2 character bookkeeping (Morality, Conflict, Obligation, Duty, Force dice) — player-side
- Force duels, Showdowns/Shootouts, Mass Combat, Squads & Squadrons, Holdings
- Gambling, Beast Riding, Animal Companions, Concealing Weapons, Vergences, Mentors, Battle Scars, Bounty Exploits, Titles, Reputation, Contact Networks, Mindful Assessment
- Galactic Economics, Hyperspace/Astrogation, Starports

## Spotlight index gaps (separate work)

OggDude data exists but is not in the generated index for: gear, armor, species, careers, specializations, force powers, attachments. Index currently has talent/weapon/adversary/quality/rule/skill.

## Notes / gotchas

- **Spotlight detail rendering uses OggDude markup, not Markdown.** The `oggToHtml` renderer in `frontend/src/utils/oggMarkup.ts` understands `[B]…[b]` (bold), `[I]…[i]` (italic), `[U]…[u]` (underline), `[P]` (paragraph break), `[BR]` (line break), and dice/result tokens like `[DI]`, `[AD]`, `[TH]`, etc. It does **not** parse `**bold**`, `-` bullet lists, or markdown headers. When adding new entries to `spotlightExtras.json`, structure paragraphs with `[P]` and use `[B]…[b]` for emphasis.

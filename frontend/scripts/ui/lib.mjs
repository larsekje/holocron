// Helpers for steps files. Ids refer to the playtest-2026-07-30 fixture.
export const IDS = {
  rodas: 'ZQvoNW_RZpx2aeLWnFJLy',   // the PC
  pirates: 'uGS_JwyRRSVABP_AbEFwk', // Minion group of 4, has weapons
  sall: '5DQeSlp5V4Jplur6P_xpL',    // Nemesis with Adversary 2
};

/** Mutate localStorage in the page, then reload so the stores rehydrate. */
export async function patch(page, fn, arg) {
  await page.evaluate(fn, arg);
  await page.reload();
  await page.waitForTimeout(1200);
}

/** Make a participant active (and selected) with nobody marked as acted. */
export async function makeActive(page, id) {
  await patch(page, (id) => {
    const gk = 'holocron:v1:newGameplay';
    const g = JSON.parse(localStorage.getItem(gk));
    g.state.context.activeParticipantId = id;
    g.state.context.actedParticipants = [];
    localStorage.setItem(gk, JSON.stringify(g));
    const pk = 'holocron:v1:participants';
    const p = JSON.parse(localStorage.getItem(pk));
    p.state.selectedParticipantId = id;
    localStorage.setItem(pk, JSON.stringify(p));
  }, id);
}

/** Read a persisted store's state, e.g. state(page, 'participants'). */
export const state = (page, store) =>
  page.evaluate((k) => JSON.parse(localStorage.getItem(`holocron:v1:${k}`)).state, store);

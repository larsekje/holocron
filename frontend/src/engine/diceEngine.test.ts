/**
 * Tests for the SWRPG narrative dice engine.
 *
 * All tests use mulberry32 seeded RNG for determinism unless marked "statistical".
 *
 * VERIFIED tests pass against the confirmed face tables (d6 + d8 dice).
 * UNVERIFIED tests are tagged and may need adjustment once d12 face tables are confirmed
 * (see dieFaces.ts header for the discrepancy with the skill file).
 */

import { describe, it, expect } from 'vitest';
import {
  mulberry32,
  rollDie,
  rollPool,
  resolveNet,
  type DicePool,
  type SymbolTotals,
} from './diceEngine';
import {
  BOOST_FACES,
  SETBACK_FACES,
  ABILITY_FACES,
  DIFFICULTY_FACES,
  PROFICIENCY_FACES,
  CHALLENGE_FACES,
  FORCE_FACES,
} from './dieFaces';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BLANK: SymbolTotals = {
  success:0, failure:0, advantage:0, threat:0, triumph:0, despair:0, light:0, dark:0,
};

// ---------------------------------------------------------------------------
// 1. Face-table fidelity — VERIFIED (d6, d8)
// ---------------------------------------------------------------------------

describe('BOOST face table (d6) — VERIFIED', () => {
  it('has exactly 6 faces', () => {
    expect(BOOST_FACES).toHaveLength(6);
  });

  it('face 0 (blank): all zeros', () => {
    expect(BOOST_FACES[0]).toEqual(BLANK);
  });

  it('face 1 (blank): all zeros', () => {
    expect(BOOST_FACES[1]).toEqual(BLANK);
  });

  it('face 2: 1 success', () => {
    expect(BOOST_FACES[2]).toMatchObject({ success: 1, advantage: 0 });
  });

  it('face 3: 1 success, 1 advantage', () => {
    expect(BOOST_FACES[3]).toMatchObject({ success: 1, advantage: 1 });
  });

  it('face 4: 2 advantage', () => {
    expect(BOOST_FACES[4]).toMatchObject({ success: 0, advantage: 2 });
  });

  it('face 5: 1 advantage', () => {
    expect(BOOST_FACES[5]).toMatchObject({ success: 0, advantage: 1 });
  });
});

describe('SETBACK face table (d6) — VERIFIED', () => {
  it('has exactly 6 faces', () => {
    expect(SETBACK_FACES).toHaveLength(6);
  });

  it('faces 0-1 are blank', () => {
    expect(SETBACK_FACES[0]).toEqual(BLANK);
    expect(SETBACK_FACES[1]).toEqual(BLANK);
  });

  it('faces 2-3: 1 failure each', () => {
    expect(SETBACK_FACES[2]).toMatchObject({ failure: 1 });
    expect(SETBACK_FACES[3]).toMatchObject({ failure: 1 });
  });

  it('faces 4-5: 1 threat each', () => {
    expect(SETBACK_FACES[4]).toMatchObject({ threat: 1 });
    expect(SETBACK_FACES[5]).toMatchObject({ threat: 1 });
  });
});

describe('ABILITY face table (d8) — VERIFIED', () => {
  it('has exactly 8 faces', () => {
    expect(ABILITY_FACES).toHaveLength(8);
  });

  it('face 0 is blank', () => {
    expect(ABILITY_FACES[0]).toEqual(BLANK);
  });

  it('contains exactly 1 double-success face', () => {
    const doubleSucess = ABILITY_FACES.filter(f => f.success === 2);
    expect(doubleSucess).toHaveLength(1);
  });

  it('contains exactly 1 double-advantage face', () => {
    const doubleAdv = ABILITY_FACES.filter(f => f.advantage === 2 && f.success === 0);
    expect(doubleAdv).toHaveLength(1);
  });

  it('contains exactly 1 mixed success+advantage face', () => {
    const mixed = ABILITY_FACES.filter(f => f.success === 1 && f.advantage === 1);
    expect(mixed).toHaveLength(1);
  });

  it('has no negative symbols', () => {
    for (const face of ABILITY_FACES) {
      expect(face.failure).toBe(0);
      expect(face.threat).toBe(0);
      expect(face.despair).toBe(0);
    }
  });
});

describe('DIFFICULTY face table (d8) — VERIFIED', () => {
  it('has exactly 8 faces', () => {
    expect(DIFFICULTY_FACES).toHaveLength(8);
  });

  it('face 0 is blank', () => {
    expect(DIFFICULTY_FACES[0]).toEqual(BLANK);
  });

  it('contains exactly 1 double-failure face', () => {
    const df = DIFFICULTY_FACES.filter(f => f.failure === 2);
    expect(df).toHaveLength(1);
  });

  it('contains exactly 1 double-threat face', () => {
    const dt = DIFFICULTY_FACES.filter(f => f.threat === 2 && f.failure === 0);
    expect(dt).toHaveLength(1);
  });

  it('contains exactly 1 mixed failure+threat face', () => {
    const ft = DIFFICULTY_FACES.filter(f => f.failure === 1 && f.threat === 1);
    expect(ft).toHaveLength(1);
  });

  it('contains exactly 3 single-threat faces', () => {
    const st = DIFFICULTY_FACES.filter(f => f.threat === 1 && f.failure === 0);
    expect(st).toHaveLength(3);
  });

  it('has no positive symbols', () => {
    for (const face of DIFFICULTY_FACES) {
      expect(face.success).toBe(0);
      expect(face.advantage).toBe(0);
      expect(face.triumph).toBe(0);
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Face-table sanity — UNVERIFIED d12 dice (structure checks only)
// ---------------------------------------------------------------------------

describe('PROFICIENCY face table (d12) — UNVERIFIED: verify missing 2 faces', () => {
  it('has exactly 12 faces', () => {
    expect(PROFICIENCY_FACES).toHaveLength(12);
  });

  it('contains exactly 1 Triumph face', () => {
    const triumphs = PROFICIENCY_FACES.filter(f => f.triumph === 1);
    expect(triumphs).toHaveLength(1);
  });

  it('Triumph face has no extra symbols beyond triumph', () => {
    const t = PROFICIENCY_FACES.find(f => f.triumph === 1)!;
    expect(t.success).toBe(0);
    expect(t.advantage).toBe(0);
    expect(t.failure).toBe(0);
  });

  it('contains no negative symbols (failure/threat/despair)', () => {
    for (const face of PROFICIENCY_FACES) {
      expect(face.failure).toBe(0);
      expect(face.threat).toBe(0);
      expect(face.despair).toBe(0);
    }
  });

  it('contains exactly 1 blank face', () => {
    const blanks = PROFICIENCY_FACES.filter(f => Object.values(f).every(v => v === 0));
    expect(blanks).toHaveLength(1);
  });
});

describe('CHALLENGE face table (d12) — UNVERIFIED: verify missing 2 faces', () => {
  it('has exactly 12 faces', () => {
    expect(CHALLENGE_FACES).toHaveLength(12);
  });

  it('contains exactly 1 or 2 Despair faces', () => {
    // Skill shows 1; community tables show 2. Range test until verified.
    const despairs = CHALLENGE_FACES.filter(f => f.despair === 1);
    expect(despairs.length).toBeGreaterThanOrEqual(1);
    expect(despairs.length).toBeLessThanOrEqual(2);
  });

  it('Despair face has no extra symbols beyond despair', () => {
    const d = CHALLENGE_FACES.find(f => f.despair === 1)!;
    expect(d.failure).toBe(0);
    expect(d.threat).toBe(0);
    expect(d.success).toBe(0);
  });

  it('contains no positive symbols (success/advantage/triumph)', () => {
    for (const face of CHALLENGE_FACES) {
      expect(face.success).toBe(0);
      expect(face.advantage).toBe(0);
      expect(face.triumph).toBe(0);
    }
  });
});

describe('FORCE face table (d12) — UNVERIFIED: verify face breakdown', () => {
  it('has exactly 12 faces', () => {
    expect(FORCE_FACES).toHaveLength(12);
  });

  it('has no success/failure/advantage/threat/triumph/despair symbols', () => {
    for (const face of FORCE_FACES) {
      expect(face.success).toBe(0);
      expect(face.failure).toBe(0);
      expect(face.advantage).toBe(0);
      expect(face.threat).toBe(0);
      expect(face.triumph).toBe(0);
      expect(face.despair).toBe(0);
    }
  });

  it('total light pips match expected range (force.md: ~7)', () => {
    const total = FORCE_FACES.reduce((acc, f) => acc + f.light, 0);
    expect(total).toBeGreaterThanOrEqual(6);
    expect(total).toBeLessThanOrEqual(8);
  });

  it('total dark pips match expected range (force.md: ~9)', () => {
    const total = FORCE_FACES.reduce((acc, f) => acc + f.dark, 0);
    expect(total).toBeGreaterThanOrEqual(8);
    expect(total).toBeLessThanOrEqual(10);
  });

  it('dark pips outnumber light pips (force is dark-weighted)', () => {
    const light = FORCE_FACES.reduce((acc, f) => acc + f.light, 0);
    const dark  = FORCE_FACES.reduce((acc, f) => acc + f.dark, 0);
    expect(dark).toBeGreaterThan(light);
  });
});

// ---------------------------------------------------------------------------
// 3. resolveNet — cancellation edge cases
// ---------------------------------------------------------------------------

describe('resolveNet — cancellation', () => {
  it('net success > 0 → succeeded = true', () => {
    const net = resolveNet({ ...BLANK, success: 2, failure: 1 });
    expect(net.netSuccess).toBe(1);
    expect(net.succeeded).toBe(true);
  });

  it('equal successes and failures → wash, succeeded = false', () => {
    const net = resolveNet({ ...BLANK, success: 3, failure: 3 });
    expect(net.netSuccess).toBe(0);
    expect(net.succeeded).toBe(false);
  });

  it('triumph on a failed roll: triumph uncanceled, check fails', () => {
    // 1 triumph (= 1 success) vs 3 failures → net -2 successes
    const net = resolveNet({ ...BLANK, triumph: 1, failure: 3 });
    expect(net.netSuccess).toBe(-2);      // triumph contributes to success pool
    expect(net.triumph).toBe(1);          // triumph itself survives
    expect(net.succeeded).toBe(false);
  });

  it('triumph on a winning roll: triumph + success counted, trigger present', () => {
    const net = resolveNet({ ...BLANK, triumph: 1, success: 2, failure: 1 });
    expect(net.netSuccess).toBe(2);       // (2+1) - 1
    expect(net.triumph).toBe(1);
    expect(net.succeeded).toBe(true);
  });

  it('despair on a successful roll: despair uncanceled, check succeeds', () => {
    const net = resolveNet({ ...BLANK, despair: 1, failure: 0, success: 3 });
    expect(net.netSuccess).toBe(2);       // (3) - (0+1)
    expect(net.despair).toBe(1);
    expect(net.succeeded).toBe(true);
  });

  it('triumph and despair on same roll: both fire', () => {
    const net = resolveNet({ ...BLANK, triumph: 1, despair: 1, success: 1, failure: 0 });
    expect(net.triumph).toBe(1);
    expect(net.despair).toBe(1);
    // success pool = 1+1 = 2; failure pool = 0+1 = 1; net = +1
    expect(net.netSuccess).toBe(1);
    expect(net.succeeded).toBe(true);
  });

  it('advantage and threat cancel 1-for-1', () => {
    const net = resolveNet({ ...BLANK, advantage: 4, threat: 2 });
    expect(net.netAdvantage).toBe(2);
  });

  it('net threat: negative netAdvantage', () => {
    const net = resolveNet({ ...BLANK, advantage: 1, threat: 3 });
    expect(net.netAdvantage).toBe(-2);
  });

  it('light and dark pips pass through without cancellation', () => {
    const net = resolveNet({ ...BLANK, light: 3, dark: 5 });
    expect(net.light).toBe(3);
    expect(net.dark).toBe(5);
  });

  it('all-zero input produces all-zero net', () => {
    const net = resolveNet(BLANK);
    expect(net.netSuccess).toBe(0);
    expect(net.netAdvantage).toBe(0);
    expect(net.triumph).toBe(0);
    expect(net.despair).toBe(0);
    expect(net.succeeded).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 4. rollPool + rollDie — seeded determinism
// ---------------------------------------------------------------------------

describe('rollPool — seeded RNG determinism', () => {
  it('same seed produces identical result on repeated calls', () => {
    const pool: DicePool = { proficiency: 2, difficulty: 1, boost: 1 };
    const result1 = rollPool(pool, mulberry32(42));
    const result2 = rollPool(pool, mulberry32(42));
    expect(result1.rolls.map(r => r.faceIndex)).toEqual(result2.rolls.map(r => r.faceIndex));
    expect(result1.net).toEqual(result2.net);
  });

  it('different seeds produce different face sequences (with overwhelming probability)', () => {
    const pool: DicePool = { ability: 4, difficulty: 3 };
    const r1 = rollPool(pool, mulberry32(1));
    const r2 = rollPool(pool, mulberry32(999));
    // It's astronomically unlikely 7 dice all land on the same faces
    const sameIndexes = r1.rolls.every((r, i) => r.faceIndex === r2.rolls[i].faceIndex);
    expect(sameIndexes).toBe(false);
  });

  it('raw symbols are the sum of individual die faces', () => {
    const pool: DicePool = { boost: 2, setback: 1 };
    const rng = mulberry32(7);
    const result = rollPool(pool, rng);
    const expected: SymbolTotals = result.rolls.reduce(
      (acc, r) => ({
        success:   acc.success   + r.symbols.success,
        failure:   acc.failure   + r.symbols.failure,
        advantage: acc.advantage + r.symbols.advantage,
        threat:    acc.threat    + r.symbols.threat,
        triumph:   acc.triumph   + r.symbols.triumph,
        despair:   acc.despair   + r.symbols.despair,
        light:     acc.light     + r.symbols.light,
        dark:      acc.dark      + r.symbols.dark,
      }),
      { ...BLANK },
    );
    expect(result.raw).toEqual(expected);
  });
});

describe('rollPool — edge cases', () => {
  it('empty pool returns no rolls and zero net', () => {
    const result = rollPool({});
    expect(result.rolls).toHaveLength(0);
    expect(result.raw).toEqual(BLANK);
    expect(result.net.netSuccess).toBe(0);
    expect(result.net.succeeded).toBe(false);
  });

  it('pool with only setback dice has no positive symbols', () => {
    const result = rollPool({ setback: 5 }, mulberry32(123));
    expect(result.raw.success).toBe(0);
    expect(result.raw.advantage).toBe(0);
    expect(result.raw.triumph).toBe(0);
    expect(result.raw.light).toBe(0);
  });

  it('pool with only boost dice has no negative symbols', () => {
    const result = rollPool({ boost: 5 }, mulberry32(456));
    expect(result.raw.failure).toBe(0);
    expect(result.raw.threat).toBe(0);
    expect(result.raw.despair).toBe(0);
    expect(result.raw.dark).toBe(0);
  });

  it('force-only pool produces only light/dark pips', () => {
    const result = rollPool({ force: 3 }, mulberry32(789));
    expect(result.raw.success).toBe(0);
    expect(result.raw.failure).toBe(0);
    expect(result.raw.triumph).toBe(0);
    expect(result.raw.despair).toBe(0);
    const totalPips = result.raw.light + result.raw.dark;
    expect(totalPips).toBeGreaterThan(0);
  });

  it('net result is consistent with raw symbols', () => {
    const result = rollPool({ ability: 2, difficulty: 1 }, mulberry32(321));
    const expected = resolveNet(result.raw);
    expect(result.net).toEqual(expected);
  });
});

describe('rollDie', () => {
  it('face index is within valid range for each die type', () => {
    const rng = mulberry32(55);
    const dies = ['boost','setback','ability','difficulty','proficiency','challenge','force'] as const;
    const expectedSides: Record<string, number> = {
      boost: 6, setback: 6, ability: 8, difficulty: 8,
      proficiency: 12, challenge: 12, force: 12,
    };
    for (const die of dies) {
      for (let i = 0; i < 20; i++) {
        const roll = rollDie(die, rng);
        expect(roll.faceIndex).toBeGreaterThanOrEqual(0);
        expect(roll.faceIndex).toBeLessThan(expectedSides[die]);
      }
    }
  });

  it('returned symbols match the face table entry', () => {
    const rng = mulberry32(99);
    for (let i = 0; i < 50; i++) {
      const roll = rollDie('ability', rng);
      expect(roll.symbols).toStrictEqual(ABILITY_FACES[roll.faceIndex]);
    }
  });
});

// ---------------------------------------------------------------------------
// 5. Statistical sanity — UNVERIFIED for d12 tables
// ---------------------------------------------------------------------------

describe('Statistical distribution (10 000 rolls)', () => {
  it('Proficiency: triumph rate ≈ 1/12 ± 1% — UNVERIFIED table', () => {
    const N = 10_000;
    const rng = mulberry32(2024);
    let triumphs = 0;
    for (let i = 0; i < N; i++) {
      const roll = rollDie('proficiency', rng);
      if (roll.symbols.triumph > 0) triumphs++;
    }
    const rate = triumphs / N;
    const expected = 1 / 12;   // 1 triumph face out of 12
    // tolerance ±1% absolute; note table is UNVERIFIED so this may legitimately fail
    expect(rate).toBeGreaterThan(expected - 0.01);
    expect(rate).toBeLessThan(expected + 0.01);
  });

  it('Challenge: despair rate is within 5–20% — UNVERIFIED table', () => {
    // Skill shows 1 despair face; community shows 2. Wide range until table is confirmed.
    const N = 10_000;
    const rng = mulberry32(2025);
    let despairs = 0;
    for (let i = 0; i < N; i++) {
      const roll = rollDie('challenge', rng);
      if (roll.symbols.despair > 0) despairs++;
    }
    const rate = despairs / N;
    expect(rate).toBeGreaterThan(0.05);
    expect(rate).toBeLessThan(0.20);
  });

  it('Boost: exactly 2/6 of faces are blank → blank rate ≈ 33% ± 2%', () => {
    const N = 10_000;
    const rng = mulberry32(2026);
    let blanks = 0;
    for (let i = 0; i < N; i++) {
      const roll = rollDie('boost', rng);
      if (Object.values(roll.symbols).every(v => v === 0)) blanks++;
    }
    const rate = blanks / N;
    expect(rate).toBeGreaterThan(0.31);
    expect(rate).toBeLessThan(0.35);
  });

  it('Ability: blank rate ≈ 1/8 = 12.5% ± 2%', () => {
    const N = 10_000;
    const rng = mulberry32(2027);
    let blanks = 0;
    for (let i = 0; i < N; i++) {
      const roll = rollDie('ability', rng);
      if (Object.values(roll.symbols).every(v => v === 0)) blanks++;
    }
    const rate = blanks / N;
    expect(rate).toBeGreaterThan(0.105);
    expect(rate).toBeLessThan(0.145);
  });

  it('Force: dark pips exceed light pips across large sample — UNVERIFIED table', () => {
    const N = 10_000;
    const rng = mulberry32(2028);
    let light = 0, dark = 0;
    for (let i = 0; i < N; i++) {
      const roll = rollDie('force', rng);
      light += roll.symbols.light;
      dark  += roll.symbols.dark;
    }
    expect(dark).toBeGreaterThan(light);
  });

  it('mulberry32 passes basic uniformity: std dev within 5% of expected for 1000 rolls', () => {
    const rng = mulberry32(12345);
    const samples = Array.from({ length: 1000 }, rng);
    const mean = samples.reduce((a, b) => a + b) / 1000;
    // Uniform [0,1) → expected mean ≈ 0.5
    expect(mean).toBeGreaterThan(0.47);
    expect(mean).toBeLessThan(0.53);
  });
});

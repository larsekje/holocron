import React from 'react';
import type { PolyDie } from '@/engine/polyDice';

/**
 * Numbered polyhedral dice — one SVG per die/face with the number baked in
 * (Unbound Legends art, viewBox 0 0 110 115). Saved locally under
 * assets/dice/numbered/{die}/{face}.svg and bundled via import.meta.glob so
 * they render offline.
 *   - d4–d20: every face 1..N.
 *   - d100: tens faces only (00, 10, … 90), percentile-die style.
 */
const FACE_URLS = import.meta.glob('../../assets/dice/numbered/**/*.svg', {
  eager: true,
  as: 'url',
}) as Record<string, string>;

function urlFor(die: PolyDie, face: string): string | undefined {
  return FACE_URLS[`../../assets/dice/numbered/${die}/${face}.svg`];
}

/** Face shown for an un-rolled die (its "type" face). */
const TYPE_FACE: Record<PolyDie, string> = {
  d4: '4',
  d6: '6',
  d8: '8',
  d10: '10',
  d12: '12',
  d20: '20',
  d100: '00',
};

/** Resolve the face filename for a die + optional rolled value. The d100 is a
 * tens d10, so its rolled value is already a multiple of ten → "00".."90". */
function faceFor(die: PolyDie, value?: number): string {
  if (value == null) return TYPE_FACE[die];
  if (die === 'd100') return String(value).padStart(2, '0');
  return String(value);
}

/** A numbered die. Pass `value` for a rolled result, omit it for the die's
 * type face, or set `blank` for the numberless body (used while a pooled die
 * is unrolled / mid-tumble, so the number only appears once it lands). */
export const PolyDieShape: React.FC<{
  die: PolyDie;
  size: number;
  value?: number;
  blank?: boolean;
}> = ({ die, size, value, blank }) => {
  const face = blank ? 'blank' : faceFor(die, value);
  const src = urlFor(die, face) ?? urlFor(die, TYPE_FACE[die]);
  return (
    <img
      src={src}
      width={size}
      height={Math.round(size * 1.045)}
      alt={blank ? die : value != null ? `${die}: ${value}` : die}
      draggable={false}
      style={{ display: 'block' }}
    />
  );
};

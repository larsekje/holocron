import React, { useId, useLayoutEffect, useRef, useState } from "react";
import { Box } from "@chakra-ui/react";
import type { HealthState } from "@/sync/snapshot";

/**
 * Damage indicator: a slim wound-bar under a chip's name, rendered from the
 * GM-supplied `broken_strain` SVG — the exact `d` paths, verbatim, kept at their
 * native bar proportions (no shear).
 *
 * The bar is a solid red plate (red = the chip). When a piece breaks loose it
 * punches a hole — a mask cuts that piece's footprint out of the plate so the
 * dark behind (the starfield) shows through — and the loose piece is redrawn,
 * shifted aside. So nothing is whole-cloth recoloured: it's a solid red bar that
 * develops holes. Damage breaks more pieces, further, spreading from the centre:
 *  - hurt (~50%):  a whole bar with one or two pieces loose — first visible damage
 *  - badly (~25%): cracking through the middle
 *  - critical (~10%): heavily holed and scattered — shattered
 *
 * Only shown for damaged individuals, so the bar appearing *is* the 50% signal.
 * Static, no animation.
 */

// Verbatim shard paths from the broken_strain SVG (Path_48668…Path_48698).
const SHARDS = [
  "M541.38,572.938l16.427,8h8.3l5.083-8Z",
  "M693.983,574.591l-4.291,6.217,2.746,1.719,9.752.452,11.782-7.461Z",
  "M692.5,572.938l-14.184,1.172,10.931,5.047Z",
  "M719.441,576.967l2.782-4.029h-6.758L713.945,574Z",
  "M567.212,584.153l10.872.785-6.306-6.988Z",
  "M722.445,574.938l-3.1,4.5,6.495,3.5h12.97l-6.025-8Z",
  "M541.469,584.229l15.965.71-9.742-6.087Z",
  "M709.645,581.709l2.534,3.229,13.513-.486-11.88-5.878Z",
  "M703.083,583.938l5.96-.214-2.107-2.685Z",
  "M671.743,574.938l4.575,8h14.192l-14.176-8Z",
  "M645.778,574.515l-18.3.568-10.133,4.6.66,2.289,6.087,1.214,14.134-.444,8.356-7.22Z",
  "M593.772,581.558l2.3,1.386,22.443.663-20.549-5.377Z",
  "M615.905,580.3l-1.643-6.361H601.725l-2.886,2.428Z",
  "M600.144,572.938,581.886,574l11.27,5.522Z",
  "M665.779,575.938l-2.8,8H675.2l-4.575-8Z",
  "M523.394,578.289l-2.557,5.649,17.982-.573,3.628-2.6Z",
  "M572.343,574.938l-.4.637,7.636,7.363H594.1l-14.213-8Z",
  "M647.139,573.6l5.855,8.15,8.932.225,2.983-7.927Z",
  "M639.543,584.938H651.8l-4.67-7.153Z",
  "M624.052,572.938H615.26l.859,3.324Z",
  "M783.1,573.938l-.5,2.154,7.672,5.846h9.9l-2.326-8Z",
  "M512.855,574.938a4,4,0,0,0,0,8h5.766l4.061-8Z",
  "M755.848,575.988l-3.817,4.312,4.134,3.7,15.158.332-2.344-8.053Z",
  "M542.969,578.578l2.547-1.71-6.138-2.989-14.7.059-.733,1.5Z",
  "M814.855,574.938h-5.462l-7.692,6.494.454,1.506h12.7a4,4,0,0,0,0-8Z",
  "M807.844,572.938h-8.1l1.644,5.451Z",
  "M781.851,584.938l7.366-.715-6.69-4.163Z",
  "M769.833,575.081l3.175,7.741,7.378-.674,1.17-8.138Z",
  "M748.92,584.423l5.731.515L751.57,581.8Z",
  "M744.362,574.938l-6.365,5.3,2.031,2.7h7.662l6.787-8Z",
  "M742.906,574.139l-8.744-1.2,2.8,4.939Z",
];

const RED = "#e24747"; // the chip's colour — the bar is a solid red plate
const VB_W = 310; // source viewBox width
const VB_H = 12; // source viewBox height
const CENTER_X = 661; // art centre (source coords); the break spreads from here
const NORM = "translate(-508.855 -572.938)"; // source group transform
const MIN_H = 13; // minimum bar height (px) — keeps it legible / pieces large

// Per grade: fraction of pieces broken loose, and how far a broken piece shifts.
const GRADE = {
  hurt: { broken: 0.08, lift: 0.7 },
  badly: { broken: 0.4, lift: 1.0 },
  critical: { broken: 1, lift: 1.4 },
} as const;

const hashStr = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};
const mulberry32 = (a: number) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
// Shade a hex toward white (amt > 0) / black (amt < 0) — a faint facet on the
// loose pieces so they read against the red plate.
const shade = (hex: string, amt: number) => {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  if (amt >= 0) {
    r += (255 - r) * amt;
    g += (255 - g) * amt;
    b += (255 - b) * amt;
  } else {
    r *= 1 + amt;
    g *= 1 + amt;
    b *= 1 + amt;
  }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
};

const firstX = (d: string) => parseFloat(d.slice(1).split(/[ ,]/)[0]);
// Reveal order: pieces nearest the centre break loose first, so the fracture
// spreads outward from the middle and the first breaks sit in view.
const REVEAL: number[] = (() => {
  const ranked = SHARDS.map((d, i) => ({ i, dist: Math.abs(firstX(d) - CENTER_X) })).sort(
    (a, b) => a.dist - b.dist
  );
  const out = new Array<number>(SHARDS.length);
  ranked.forEach((o, rank) => (out[o.i] = rank / SHARDS.length));
  return out;
})();
// Stable per-piece shift/tilt/facet so the break is pre-computed and steady.
const JIT = SHARDS.map((_, i) => {
  const r = mulberry32(hashStr("jit" + i));
  return { dx: r() - 0.5, dy: r() - 0.5, rot: r() - 0.5, sh: r() - 0.5 };
});

// Measure the bar width so the SVG renders 1:1 (the art keeps its native aspect).
const useWidth = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
};

const ChipShatter: React.FC<{ state: HealthState }> = ({ state }) => {
  const [ref, w] = useWidth();
  const uid = useId().replace(/:/g, ""); // safe inside url(#…)
  const cfg = state === "unhurt" ? null : GRADE[state];

  let body: React.ReactNode = null;
  if (cfg && w >= 2) {
    const s = Math.max(w / VB_W, MIN_H / VB_H); // fill width, never thinner than MIN_H
    const Hart = VB_H * s;
    const tx = (w - VB_W * s) / 2; // centered slice when the art is wider than the bar
    const wrap = (children: React.ReactNode) => (
      <g transform={`translate(${tx.toFixed(2)} 0) scale(${s.toFixed(4)})`}>
        <g transform={NORM}>{children}</g>
      </g>
    );
    const holes = SHARDS.map((d, i) =>
      REVEAL[i] < cfg.broken ? <path key={i} d={d} fill="#000" /> : null
    );
    const pieces = SHARDS.map((d, i) => {
      if (REVEAL[i] >= cfg.broken) return null;
      const j = JIT[i];
      const dx = j.dx * cfg.lift * 8; // mostly lateral so the bar parts, not explodes
      const dy = j.dy * cfg.lift * 2;
      const rot = j.rot * cfg.lift * 30;
      return (
        <path
          key={i}
          d={d}
          fill={shade(RED, j.sh * 0.3)}
          transform={`translate(${dx.toFixed(2)} ${dy.toFixed(2)}) rotate(${rot.toFixed(2)} ${CENTER_X} 578)`}
        />
      );
    });
    body = (
      <svg width="100%" height={Hart} viewBox={`0 0 ${w} ${Hart}`} preserveAspectRatio="none" style={{ display: "block" }} aria-hidden>
        <defs>
          {/* Broken pieces are cut out of the plate (their footprint → black in
              the mask), so the dark behind shows through as the crack. */}
          <mask id={`m${uid}`}>
            <rect width={w} height={Hart} rx={Hart / 2} fill="#fff" />
            {wrap(holes)}
          </mask>
          <clipPath id={`c${uid}`}>
            <rect width={w} height={Hart} rx={Hart / 2} />
          </clipPath>
        </defs>
        <rect width={w} height={Hart} rx={Hart / 2} fill={RED} mask={`url(#m${uid})`} />
        <g clipPath={`url(#c${uid})`}>{wrap(pieces)}</g>
      </svg>
    );
  }

  return (
    <Box
      ref={ref}
      mt={1}
      overflow="visible"
      pointerEvents="none"
      sx={cfg ? { filter: "drop-shadow(0 0 2px rgba(226,71,71,0.45))" } : undefined}
    >
      {body}
    </Box>
  );
};

export default ChipShatter;

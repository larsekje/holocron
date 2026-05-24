import React from "react";
import { Box, keyframes } from "@chakra-ui/react";

/**
 * Animated in-universe starfield for the player view — three parallax layers of
 * drifting stars over a deep-space gradient with a faint nebula glow. Pure CSS
 * (tiled radial-gradients animating background-position), so it's cheap enough
 * for a phone or a TV and needs no JS per frame.
 */

// Each layer is a tile of star dots; drifting background-position loops
// seamlessly because the tile repeats.
const drift = (distance: string) => keyframes`
  from { background-position: 0 0; }
  to   { background-position: 0 ${distance}; }
`;

const twinkle = keyframes`
  0%, 100% { opacity: 0.5; }
  50%      { opacity: 1; }
`;

const STAR_LAYERS = [
  // far, small, faint, slow
  {
    size: "200px 200px",
    duration: "180s",
    distance: "200px",
    twinkle: true,
    image: `
      radial-gradient(1px 1px at 25px 35px, rgba(255,255,255,0.8), transparent),
      radial-gradient(1px 1px at 90px 120px, rgba(255,255,255,0.7), transparent),
      radial-gradient(1px 1px at 150px 70px, rgba(255,255,255,0.6), transparent),
      radial-gradient(1px 1px at 60px 175px, rgba(200,220,255,0.7), transparent),
      radial-gradient(1px 1px at 180px 160px, rgba(255,255,255,0.6), transparent)`,
  },
  // mid
  {
    size: "300px 300px",
    duration: "120s",
    distance: "300px",
    twinkle: false,
    image: `
      radial-gradient(1.5px 1.5px at 50px 80px, rgba(255,255,255,0.9), transparent),
      radial-gradient(1.5px 1.5px at 220px 40px, rgba(255,244,214,0.9), transparent),
      radial-gradient(1.5px 1.5px at 130px 230px, rgba(255,255,255,0.85), transparent),
      radial-gradient(1.5px 1.5px at 270px 180px, rgba(214,232,255,0.85), transparent)`,
  },
  // near, bigger, brighter, faster
  {
    size: "420px 420px",
    duration: "80s",
    distance: "420px",
    twinkle: false,
    image: `
      radial-gradient(2px 2px at 80px 120px, #fff, transparent),
      radial-gradient(2px 2px at 340px 300px, #fff, transparent),
      radial-gradient(2.5px 2.5px at 200px 380px, rgba(255,248,230,1), transparent)`,
  },
];

const Starfield: React.FC = () => (
  <Box
    position="fixed"
    inset={0}
    zIndex={0}
    overflow="hidden"
    bg="radial-gradient(ellipse at 50% 35%, #0b1026 0%, #060812 55%, #03040a 100%)"
    pointerEvents="none"
  >
    {/* faint coloured nebula */}
    <Box
      position="absolute"
      inset={0}
      opacity={0.35}
      bg="radial-gradient(40% 35% at 70% 25%, rgba(67,56,202,0.25), transparent), radial-gradient(45% 40% at 25% 75%, rgba(13,148,136,0.18), transparent)"
    />
    {STAR_LAYERS.map((layer, i) => (
      <Box
        key={i}
        position="absolute"
        inset={0}
        backgroundImage={layer.image}
        backgroundRepeat="repeat"
        backgroundSize={layer.size}
        animation={`${drift(layer.distance)} ${layer.duration} linear infinite${
          layer.twinkle ? `, ${twinkle} 6s ease-in-out infinite` : ""
        }`}
      />
    ))}
  </Box>
);

export default Starfield;

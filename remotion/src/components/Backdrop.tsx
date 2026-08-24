import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

/**
 * Fondo continuo del video completo.
 *
 * Se monta FUERA de las <Sequence>, así que su `useCurrentFrame()` es el
 * frame global (0 → 449). Al no cortarse nunca, encadena las tres escenas y
 * hace que los cambios se lean como transiciones y no como cortes secos.
 */
export const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  const progress = frame / durationInFrames;

  const gridOffset = interpolate(progress, [0, 1], [0, -70]);
  const glowX = interpolate(progress, [0, 0.5, 1], [32, 52, 66]);
  const glowY = interpolate(progress, [0, 0.5, 1], [26, 44, 32]);

  return (
    <AbsoluteFill className="bg-mp-ink">
      {/* Halo azul Mercado Pago que se desplaza lentamente. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(58% 58% at ${glowX}% ${glowY}%, rgba(0,158,227,0.24) 0%, rgba(0,158,227,0.06) 45%, rgba(5,7,13,0) 72%)`,
        }}
      />

      {/* Retícula técnica sutil, con parallax vertical. */}
      <AbsoluteFill
        className="opacity-45"
        style={{
          backgroundImage:
            'linear-gradient(rgba(30,42,68,0.55) 1px, transparent 1px), linear-gradient(90deg, rgba(30,42,68,0.55) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          transform: `translateY(${gridOffset}px)`,
          maskImage:
            'radial-gradient(70% 70% at 50% 45%, black 0%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(70% 70% at 50% 45%, black 0%, transparent 100%)',
        }}
      />

      {/* Viñeta para dar profundidad. */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(100% 100% at 50% 50%, rgba(5,7,13,0) 40%, rgba(5,7,13,0.85) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

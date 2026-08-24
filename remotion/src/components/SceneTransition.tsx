import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';

type SceneTransitionProps = {
  /** Frame —relativo a la escena— en el que arranca el fundido de salida. */
  readonly exitStartFrame: number;
  readonly exitDurationInFrames: number;
  readonly enterDurationInFrames?: number;
  /** Desplazamiento vertical inicial, en px. */
  readonly translateY?: number;
  /** Escala inicial (1 = sin zoom). */
  readonly scaleFrom?: number;
  readonly children: React.ReactNode;
};

/**
 * Envoltorio de entrada/salida reutilizable.
 *
 * Vive DENTRO de una <Sequence>, así que `useCurrentFrame()` ya viene
 * desplazado: el frame 0 es el primer frame de la escena. Los tiempos se
 * reciben por props en vez de leerse del contexto — queda explícito,
 * testeable y reutilizable en un <Still>.
 */
export const SceneTransition: React.FC<SceneTransitionProps> = ({
  exitStartFrame,
  exitDurationInFrames,
  enterDurationInFrames = 14,
  translateY = 34,
  scaleFrom = 0.965,
  children,
}) => {
  const frame = useCurrentFrame();

  const enter = interpolate(frame, [0, enterDurationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const exit = interpolate(
    frame,
    [exitStartFrame, exitStartFrame + exitDurationInFrames],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.in(Easing.quad),
    },
  );

  const opacity = enter * (1 - exit);
  const offsetY = (1 - enter) * translateY - exit * translateY * 0.5;
  const scale = scaleFrom + (1 - scaleFrom) * enter - exit * 0.025;

  return (
    <AbsoluteFill
      // Los valores animados van inline: Tailwind no puede generar clases
      // dinámicas por frame y además así evitamos recalcular el CSS.
      style={{
        opacity,
        transform: `translateY(${offsetY}px) scale(${scale})`,
        willChange: 'transform, opacity',
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

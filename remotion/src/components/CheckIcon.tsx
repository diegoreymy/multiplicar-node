import React from 'react';

type CheckIconProps = {
  /** 0→1: dibujo del trazo del check. */
  readonly drawProgress: number;
  /** 0→1: aparición del anillo exterior. */
  readonly ringProgress: number;
  readonly size?: number;
};

const RING_RADIUS = 46;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;
const CHECK_PATH_LENGTH = 62;

/**
 * Check animado en SVG.
 *
 * El trazo se "dibuja" con strokeDasharray/strokeDashoffset en función de un
 * progreso recibido por props. No usa animaciones CSS ni <animate> de SVG:
 * en Remotion cualquier animación basada en reloj del navegador se
 * desincroniza del frame que se está renderizando.
 */
export const CheckIcon: React.FC<CheckIconProps> = ({
  drawProgress,
  ringProgress,
  size = 190,
}) => {
  // Con `strokeLinecap="round"`, un trazo de longitud 0 igual pinta un punto.
  // Esta rampa rápida lo oculta hasta que el trazo empieza de verdad.
  const ringVisibility = Math.min(ringProgress * 6, 1);
  const checkVisibility = Math.min(drawProgress * 6, 1);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 110 110"
      fill="none"
      style={{filter: 'drop-shadow(0 0 34px rgba(52,211,153,0.45))'}}
    >
      <circle
        cx="55"
        cy="55"
        r={RING_RADIUS}
        fill="rgba(52,211,153,0.10)"
        stroke="none"
        style={{opacity: ringProgress}}
      />

      <circle
        cx="55"
        cy="55"
        r={RING_RADIUS}
        stroke="#34d399"
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={RING_LENGTH}
        strokeDashoffset={RING_LENGTH * (1 - ringProgress)}
        // Arranca el trazado arriba en lugar de a las 3 en punto.
        transform="rotate(-90 55 55)"
        style={{opacity: ringVisibility}}
      />

      <path
        d="M34 56.5 L48.5 71 L77 40"
        stroke="#34d399"
        strokeWidth={8}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={CHECK_PATH_LENGTH}
        strokeDashoffset={CHECK_PATH_LENGTH * (1 - drawProgress)}
        style={{opacity: checkVisibility}}
      />
    </svg>
  );
};

import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {MONO_FONT_FAMILY, SANS_FONT_FAMILY} from '../../lib/fonts';

type SceneHeadingProps = {
  readonly step: string;
  readonly title: string;
};

/**
 * Encabezado común a las escenas explicativas: da continuidad visual y le
 * dice al espectador en qué paso del recorrido está.
 */
export const SceneHeading: React.FC<SceneHeadingProps> = ({step, title}) => {
  const frame = useCurrentFrame();

  const reveal = interpolate(frame, [0, 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div
      className="flex flex-col items-center gap-4"
      style={{opacity: reveal, transform: `translateY(${(1 - reveal) * 18}px)`}}
    >
      <span
        className="rounded-full border border-ui-line bg-ui-ink-soft/70 px-5 py-2 text-[20px] font-bold uppercase tracking-[0.3em] text-kf-violet-soft"
        style={{fontFamily: MONO_FONT_FAMILY}}
      >
        {step}
      </span>
      <h2
        className="text-[46px] font-extrabold tracking-tight text-ui-cloud"
        style={{fontFamily: SANS_FONT_FAMILY}}
      >
        {title}
      </h2>
    </div>
  );
};

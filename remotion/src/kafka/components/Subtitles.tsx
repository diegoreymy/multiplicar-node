import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {SANS_FONT_FAMILY} from '../../lib/fonts';
import {secondsToFrames} from '../../lib/timing';
import {NARRATION} from '../script';

const FADE_IN_FRAMES = 6;
const FADE_OUT_FRAMES = 8;

/**
 * Subtítulos quemados, con el mismo texto que la locución.
 *
 * Vive fuera de las <Sequence> de las escenas, así que su `useCurrentFrame()`
 * es el frame global y puede decidir por sí mismo qué línea toca. Las escenas
 * reservan el espacio de abajo para que nunca se pisen.
 */
export const Subtitles: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const active = NARRATION.map((segment) => {
    const from = secondsToFrames(segment.startInSeconds, fps);
    const to = secondsToFrames(segment.endInSeconds, fps);

    const opacity =
      interpolate(frame, [from, from + FADE_IN_FRAMES], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }) *
      interpolate(frame, [to - FADE_OUT_FRAMES, to], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });

    return {segment, opacity};
  }).find(({opacity}) => opacity > 0);

  if (!active) {
    return null;
  }

  return (
    <AbsoluteFill className="items-center justify-end pb-16">
      <p
        className="max-w-[1360px] rounded-2xl bg-ui-ink/75 px-9 py-5 text-center text-[32px] leading-snug text-ui-cloud"
        style={{
          fontFamily: SANS_FONT_FAMILY,
          opacity: active.opacity,
          backdropFilter: 'blur(6px)',
        }}
      >
        {active.segment.text}
      </p>
    </AbsoluteFill>
  );
};

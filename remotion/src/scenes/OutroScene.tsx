import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {CheckIcon} from '../components/CheckIcon';
import {SceneTransition} from '../components/SceneTransition';
import {MONO_FONT_FAMILY, SANS_FONT_FAMILY} from '../lib/fonts';
import {CROSS_FADE_IN_SECONDS, secondsToFrames, type SceneTiming} from '../lib/timing';

type OutroSceneProps = {
  readonly message: string;
  readonly footnote: string;
  readonly timing: SceneTiming;
};

/**
 * Escena 3 (11s → 15s): cierre con check.
 */
export const OutroScene: React.FC<OutroSceneProps> = ({
  message,
  footnote,
  timing,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // El check espera a que termine el encadenado con la terminal: si no,
  // el anillo se dibujaría por encima de la ventana que todavía se ve.
  const entryDelay = secondsToFrames(CROSS_FADE_IN_SECONDS, fps);
  const localFrame = frame - entryDelay;

  const ringProgress = spring({
    frame: localFrame,
    fps,
    config: {damping: 200, mass: 0.8},
    durationInFrames: 24,
  });

  const drawProgress = spring({
    frame: localFrame - 12,
    fps,
    config: {damping: 200, mass: 0.5},
    durationInFrames: 20,
  });

  const iconPop = spring({
    frame: localFrame,
    fps,
    config: {damping: 12, stiffness: 120, mass: 0.9},
  });

  const messageOpacity = interpolate(localFrame, [22, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });

  const footnoteOpacity = interpolate(localFrame, [34, 52], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <SceneTransition
      exitStartFrame={timing.exitStartFrame}
      exitDurationInFrames={timing.exitDurationInFrames}
      translateY={18}
    >
      <AbsoluteFill className="items-center justify-center gap-12">
        <div style={{transform: `scale(${0.7 + 0.3 * iconPop})`}}>
          <CheckIcon drawProgress={drawProgress} ringProgress={ringProgress} />
        </div>

        <h2
          className="max-w-[1300px] text-center text-[76px] font-extrabold leading-tight tracking-tight text-mp-cloud"
          style={{
            fontFamily: SANS_FONT_FAMILY,
            opacity: messageOpacity,
            transform: `translateY(${(1 - messageOpacity) * 24}px)`,
          }}
        >
          {message}
        </h2>

        <p
          className="text-[26px] uppercase tracking-[0.34em] text-mp-slate"
          style={{fontFamily: MONO_FONT_FAMILY, opacity: footnoteOpacity}}
        >
          {footnote}
        </p>
      </AbsoluteFill>
    </SceneTransition>
  );
};

import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {SceneTransition} from '../../components/SceneTransition';
import {MONO_FONT_FAMILY, SANS_FONT_FAMILY} from '../../lib/fonts';
import type {SceneTiming} from '../../lib/timing';

type IntroSceneProps = {
  readonly title: string;
  readonly eyebrow: string;
  readonly subtitle: string;
  readonly timing: SceneTiming;
};

/** Celdas del log que se dibuja debajo del título. */
const LOG_CELLS = 9;

/**
 * Escena 1 (0s → 6s): portada.
 */
export const IntroScene: React.FC<IntroSceneProps> = ({
  title,
  eyebrow,
  subtitle,
  timing,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const titleSpring = spring({
    frame,
    fps,
    config: {damping: 200, mass: 0.7},
    durationInFrames: 26,
  });

  const eyebrowOpacity = interpolate(frame, [4, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const subtitleOpacity = interpolate(frame, [24, 42], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });

  return (
    <SceneTransition
      exitStartFrame={timing.exitStartFrame}
      exitDurationInFrames={timing.exitDurationInFrames}
      translateY={26}
    >
      <AbsoluteFill className="items-center justify-center gap-9 pb-28">
        <div
          className="flex items-center gap-4 rounded-full border border-ui-line bg-ui-ink-soft/70 px-6 py-3"
          style={{opacity: eyebrowOpacity, fontFamily: MONO_FONT_FAMILY}}
        >
          <span className="h-3 w-3 rounded-full bg-kf-violet" />
          <span className="text-[21px] font-bold uppercase tracking-[0.3em] text-kf-violet-soft">
            {eyebrow}
          </span>
        </div>

        <h1
          className="text-center text-[108px] font-extrabold leading-none tracking-tight text-ui-cloud"
          style={{
            fontFamily: SANS_FONT_FAMILY,
            opacity: titleSpring,
            transform: `translateY(${(1 - titleSpring) * 38}px)`,
          }}
        >
          {title}
        </h1>

        {/* Un log: celdas que se agregan al final, que es de lo que va todo. */}
        <div className="flex items-center gap-3">
          {new Array(LOG_CELLS).fill(true).map((_, index) => {
            const cell = spring({
              frame: frame - 20 - index * 3,
              fps,
              config: {damping: 200},
              durationInFrames: 18,
            });

            return (
              <div
                key={index}
                className="h-[18px] w-[62px] rounded-md bg-kf-violet"
                style={{
                  opacity: cell * 0.9,
                  transform: `scaleX(${cell})`,
                  boxShadow: '0 0 26px rgba(139,92,246,0.55)',
                }}
              />
            );
          })}
        </div>

        <p
          className="text-[32px] text-ui-slate"
          style={{fontFamily: SANS_FONT_FAMILY, opacity: subtitleOpacity}}
        >
          {subtitle}
        </p>
      </AbsoluteFill>
    </SceneTransition>
  );
};

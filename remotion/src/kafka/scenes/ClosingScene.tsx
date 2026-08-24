import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {CheckIcon} from '../../components/CheckIcon';
import {SceneTransition} from '../../components/SceneTransition';
import {MONO_FONT_FAMILY, SANS_FONT_FAMILY} from '../../lib/fonts';
import {CROSS_FADE_IN_SECONDS, secondsToFrames, type SceneTiming} from '../../lib/timing';

type ClosingSceneProps = {
  readonly bullets: string[];
  readonly headline: string;
  readonly footnote: string;
  readonly timing: SceneTiming;
};

/**
 * Escena 6 (52s → 60s): resumen y cierre.
 */
export const ClosingScene: React.FC<ClosingSceneProps> = ({
  bullets,
  headline,
  footnote,
  timing,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Igual que en el cierre del otro video: el contenido espera a que termine
  // el encadenado con la escena anterior.
  const localFrame = frame - secondsToFrames(CROSS_FADE_IN_SECONDS, fps);

  const headlineOpacity = interpolate(localFrame, [46, 66], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });

  const footnoteOpacity = interpolate(localFrame, [60, 80], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <SceneTransition
      exitStartFrame={timing.exitStartFrame}
      exitDurationInFrames={timing.exitDurationInFrames}
      translateY={18}
    >
      <AbsoluteFill className="items-center justify-center gap-14 pb-40">
        <div className="flex flex-col gap-7">
          {bullets.map((bullet, index) => {
            const appear = spring({
              frame: localFrame - index * 9,
              fps,
              config: {damping: 200, mass: 0.6},
              durationInFrames: 22,
            });

            return (
              <div
                key={bullet}
                className="flex items-center gap-6"
                style={{
                  opacity: appear,
                  transform: `translateX(${(1 - appear) * -30}px)`,
                }}
              >
                <CheckIcon
                  drawProgress={appear}
                  ringProgress={appear}
                  size={64}
                />
                <span
                  className="text-[40px] font-semibold text-ui-cloud"
                  style={{fontFamily: SANS_FONT_FAMILY}}
                >
                  {bullet}
                </span>
              </div>
            );
          })}
        </div>

        <h2
          className="max-w-[1400px] text-center text-[54px] font-extrabold tracking-tight text-kf-violet-soft"
          style={{
            fontFamily: SANS_FONT_FAMILY,
            opacity: headlineOpacity,
            transform: `translateY(${(1 - headlineOpacity) * 20}px)`,
          }}
        >
          {headline}
        </h2>

        <p
          className="text-[24px] uppercase tracking-[0.32em] text-ui-slate"
          style={{fontFamily: MONO_FONT_FAMILY, opacity: footnoteOpacity}}
        >
          {footnote}
        </p>
      </AbsoluteFill>
    </SceneTransition>
  );
};

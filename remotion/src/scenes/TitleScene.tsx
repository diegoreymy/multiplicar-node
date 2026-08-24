import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useVideoConfig, useCurrentFrame} from 'remotion';
import {SceneTransition} from '../components/SceneTransition';
import {MONO_FONT_FAMILY, SANS_FONT_FAMILY} from '../lib/fonts';
import type {SceneTiming} from '../lib/timing';

type TitleSceneProps = {
  readonly title: string;
  readonly eyebrow: string;
  readonly timing: SceneTiming;
};

/**
 * Escena 1 (0s → 3s): pantalla de título.
 */
export const TitleScene: React.FC<TitleSceneProps> = ({
  title,
  eyebrow,
  timing,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // spring() necesita el fps de la composición para durar lo mismo a
  // cualquier frame rate.
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

  const ruleScale = spring({
    frame: frame - 10,
    fps,
    config: {damping: 200},
    durationInFrames: 30,
  });

  const subtitleOpacity = interpolate(frame, [26, 44], [0, 1], {
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
      <AbsoluteFill className="items-center justify-center px-40">
        <div className="flex w-full max-w-[1440px] flex-col items-start gap-8">
          <div
            className="flex items-center gap-4 rounded-full border border-mp-line bg-mp-ink-soft/70 px-6 py-3"
            style={{opacity: eyebrowOpacity, fontFamily: MONO_FONT_FAMILY}}
          >
            <span className="h-3 w-3 rounded-full bg-mp-mint" />
            <span className="text-[22px] font-bold uppercase tracking-[0.32em] text-mp-blue-soft">
              {eyebrow}
            </span>
          </div>

          <h1
            className="text-[104px] font-extrabold leading-[1.06] tracking-tight text-mp-cloud"
            style={{
              fontFamily: SANS_FONT_FAMILY,
              opacity: titleSpring,
              transform: `translateY(${(1 - titleSpring) * 40}px)`,
            }}
          >
            {title}
          </h1>

          <div
            className="h-[7px] w-[520px] origin-left rounded-full bg-mp-blue"
            style={{
              transform: `scaleX(${ruleScale})`,
              boxShadow: '0 0 42px rgba(0,158,227,0.8)',
            }}
          />

          <p
            className="max-w-[1080px] text-[30px] leading-relaxed text-mp-slate"
            style={{fontFamily: SANS_FONT_FAMILY, opacity: subtitleOpacity}}
          >
            Notificación IPN recibida, validada y confirmada por la API de pagos.
          </p>
        </div>
      </AbsoluteFill>
    </SceneTransition>
  );
};

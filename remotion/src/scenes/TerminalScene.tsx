import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {SceneTransition} from '../components/SceneTransition';
import {TerminalWindow} from '../components/TerminalWindow';
import {TypewriterCode} from '../components/TypewriterCode';
import {MONO_FONT_FAMILY} from '../lib/fonts';
import type {TerminalLine} from '../lib/payload';
import type {SceneTiming} from '../lib/timing';

type TerminalSceneProps = {
  readonly lines: TerminalLine[];
  readonly windowTitle: string;
  readonly timing: SceneTiming;
};

/** Frames que tarda la ventana en abrirse antes de empezar a tipear. */
const WINDOW_OPEN_FRAMES = 18;
/** Frames de "aire" al final, para que se lea el payload completo. */
const HOLD_FRAMES = 34;

/**
 * Escena 2 (3s → 11s): terminal simulada escribiendo el payload.
 */
export const TerminalScene: React.FC<TerminalSceneProps> = ({
  lines,
  windowTitle,
  timing,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const {contentDurationInFrames} = timing;

  const openProgress = spring({
    frame,
    fps,
    config: {damping: 200, mass: 0.6},
    durationInFrames: WINDOW_OPEN_FRAMES,
  });

  // El tipeo ocupa todo lo que queda entre la apertura y el hold final,
  // así que el ritmo se ajusta solo si cambia la duración de la escena.
  const revealDurationInFrames = Math.max(
    contentDurationInFrames - WINDOW_OPEN_FRAMES - HOLD_FRAMES,
    1,
  );
  const typingStartFrame = WINDOW_OPEN_FRAMES - 4;

  const statusOpacity = interpolate(
    frame,
    [
      contentDurationInFrames - HOLD_FRAMES - 6,
      contentDurationInFrames - HOLD_FRAMES + 12,
    ],
    [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  return (
    <SceneTransition
      exitStartFrame={timing.exitStartFrame}
      exitDurationInFrames={timing.exitDurationInFrames}
      translateY={20}
      scaleFrom={0.98}
    >
      <AbsoluteFill className="items-center justify-center">
        <TerminalWindow title={windowTitle} openProgress={openProgress}>
          <TypewriterCode
            lines={lines}
            startFrame={typingStartFrame}
            revealDurationInFrames={revealDurationInFrames}
          />

          <div
            className="mt-7 flex items-center gap-4 border-t border-mp-line pt-6"
            style={{opacity: statusOpacity, fontFamily: MONO_FONT_FAMILY}}
          >
            <span className="rounded-md bg-mp-mint/15 px-4 py-2 text-[22px] font-bold uppercase tracking-widest text-mp-mint">
              status: approved
            </span>
            <span className="text-[22px] text-mp-slate">
              webhook procesado · 200 OK
            </span>
          </div>
        </TerminalWindow>
      </AbsoluteFill>
    </SceneTransition>
  );
};

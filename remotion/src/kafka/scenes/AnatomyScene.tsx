import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {SceneTransition} from '../../components/SceneTransition';
import {MONO_FONT_FAMILY, SANS_FONT_FAMILY} from '../../lib/fonts';
import type {SceneTiming} from '../../lib/timing';
import {SceneHeading} from '../components/SceneHeading';

type AnatomySceneProps = {
  readonly topic: string;
  readonly partitions: number;
  readonly timing: SceneTiming;
};

const CELLS_PER_PARTITION = 9;
const CELL_WIDTH = 108;
const CELL_HEIGHT = 76;

/** Frames que tarda en escribirse cada evento nuevo. */
const APPEND_START = 26;
const APPEND_STEP = 7;

/**
 * Escena 4 (28s → 41s): topic, particiones y offsets.
 *
 * Los eventos se agregan siempre al final —append-only— y cada celda lleva
 * su offset. La escritura es escalonada por partición para que se lea que
 * son logs independientes, no una sola fila.
 */
export const AnatomyScene: React.FC<AnatomySceneProps> = ({
  topic,
  partitions,
  timing,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const boxSpring = spring({
    frame: frame - 6,
    fps,
    config: {damping: 200, mass: 0.7},
    durationInFrames: 22,
  });

  const noteOpacity = interpolate(frame, [110, 132], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <SceneTransition
      exitStartFrame={timing.exitStartFrame}
      exitDurationInFrames={timing.exitDurationInFrames}
      translateY={20}
      scaleFrom={0.98}
    >
      <AbsoluteFill className="items-center justify-center gap-10 pb-52">
        <SceneHeading step="Anatomía" title="Topic, particiones y offset" />

        <div
          className="flex flex-col gap-7 rounded-2xl border border-kf-violet/45 bg-ui-panel/80 px-12 py-9"
          style={{
            opacity: boxSpring,
            transform: `scale(${0.94 + 0.06 * boxSpring})`,
            boxShadow: '0 40px 90px -45px rgba(0,0,0,0.95)',
          }}
        >
          <div className="flex items-baseline gap-4">
            <span
              className="text-[24px] uppercase tracking-[0.26em] text-ui-slate"
              style={{fontFamily: MONO_FONT_FAMILY}}
            >
              topic
            </span>
            <span
              className="text-[36px] font-bold text-kf-violet-soft"
              style={{fontFamily: MONO_FONT_FAMILY}}
            >
              {topic}
            </span>
          </div>

          {new Array(partitions).fill(true).map((_, partition) => (
            <div key={partition} className="flex items-center gap-6">
              <span
                className="w-[186px] text-right text-[23px] text-ui-slate"
                style={{fontFamily: MONO_FONT_FAMILY}}
              >
                partición {partition}
              </span>

              <div className="flex items-end gap-2.5">
                {new Array(CELLS_PER_PARTITION).fill(true).map((_, offset) => {
                  // Cada partición escribe a su propio ritmo.
                  const written = spring({
                    frame:
                      frame -
                      APPEND_START -
                      partition * 5 -
                      offset * APPEND_STEP,
                    fps,
                    config: {damping: 200},
                    durationInFrames: 16,
                  });

                  return (
                    <div
                      key={offset}
                      className="flex flex-col items-center gap-2"
                      style={{opacity: 0.16 + written * 0.84}}
                    >
                      <div
                        className="flex items-center justify-center rounded-lg border border-kf-violet/50 bg-kf-violet/20"
                        style={{
                          width: CELL_WIDTH,
                          height: CELL_HEIGHT,
                          transform: `scale(${0.8 + 0.2 * written})`,
                        }}
                      >
                        <span
                          className="text-[26px] font-bold text-ui-cloud"
                          style={{fontFamily: MONO_FONT_FAMILY}}
                        >
                          {offset}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Marca de que siempre se escribe al final. */}
                <div
                  className="ml-3 flex h-[76px] items-center text-[24px] text-ui-mint"
                  style={{
                    fontFamily: MONO_FONT_FAMILY,
                    opacity: noteOpacity,
                  }}
                >
                  ←
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          className="flex items-center gap-8 text-[25px] text-ui-slate"
          style={{fontFamily: SANS_FONT_FAMILY, opacity: noteOpacity}}
        >
          <span>
            <span className="font-bold text-ui-mint">append-only</span>: sólo se
            escribe al final
          </span>
          <span className="text-ui-line">|</span>
          <span>
            el <span className="font-bold text-kf-violet-soft">offset</span> es
            el número de orden
          </span>
        </div>
      </AbsoluteFill>
    </SceneTransition>
  );
};

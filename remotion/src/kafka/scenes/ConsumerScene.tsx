import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {SceneTransition} from '../../components/SceneTransition';
import {MONO_FONT_FAMILY, SANS_FONT_FAMILY} from '../../lib/fonts';
import type {SceneTiming} from '../../lib/timing';
import {SceneHeading} from '../components/SceneHeading';

export type ConsumerGroup = {
  readonly label: string;
  readonly color: string;
  /** Offset en el que termina el recorrido dentro de la escena. */
  readonly finalOffset: number;
  readonly startFrame: number;
  readonly durationInFrames: number;
};

type ConsumerSceneProps = {
  readonly groups: ConsumerGroup[];
  readonly timing: SceneTiming;
};

const CELLS = 12;
const CELL_WIDTH = 104;
const CELL_GAP = 10;
const CELL_PITCH = CELL_WIDTH + CELL_GAP;

/**
 * Escena 5 (41s → 52s): grupos de consumidores.
 *
 * Las celdas quedan siempre encendidas: leer no consume. Lo único que se
 * mueve es el puntero de cada grupo, cada uno a su propia velocidad.
 */
export const ConsumerScene: React.FC<ConsumerSceneProps> = ({
  groups,
  timing,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const rowSpring = spring({
    frame: frame - 6,
    fps,
    config: {damping: 200, mass: 0.7},
    durationInFrames: 20,
  });

  const noteOpacity = interpolate(frame, [150, 172], [0, 1], {
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
      <AbsoluteFill className="items-center justify-center gap-12 pb-52">
        <SceneHeading step="Consumo" title="Cada grupo, su propio offset" />

        <div
          className="relative"
          style={{
            width: CELLS * CELL_PITCH - CELL_GAP,
            opacity: rowSpring,
          }}
        >
          <div className="flex" style={{gap: CELL_GAP}}>
            {new Array(CELLS).fill(true).map((_, offset) => (
              <div
                key={offset}
                className="flex flex-col items-center justify-center rounded-lg border border-kf-violet/50 bg-kf-violet/20"
                style={{width: CELL_WIDTH, height: 84}}
              >
                <span
                  className="text-[25px] font-bold text-ui-cloud"
                  style={{fontFamily: MONO_FONT_FAMILY}}
                >
                  {offset}
                </span>
              </div>
            ))}
          </div>

          {/* Punteros: uno por grupo, avanzando a distinta velocidad. */}
          {groups.map((group, index) => {
            const progress = interpolate(
              frame,
              [group.startFrame, group.startFrame + group.durationInFrames],
              [0, group.finalOffset],
              {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: Easing.inOut(Easing.cubic),
              },
            );

            return (
              <div
                key={group.label}
                className="absolute flex flex-col items-center"
                style={{
                  top: 104 + index * 92,
                  left: progress * CELL_PITCH + CELL_WIDTH / 2 - 170,
                  width: 340,
                  transform: 'translateZ(0)',
                }}
              >
                <div
                  className="h-6 w-[3px]"
                  style={{backgroundColor: group.color}}
                />
                <div
                  className="whitespace-nowrap rounded-lg px-5 py-2.5 text-[22px] font-bold"
                  style={{
                    fontFamily: MONO_FONT_FAMILY,
                    color: group.color,
                    backgroundColor: `${group.color}1f`,
                    border: `1px solid ${group.color}66`,
                  }}
                >
                  {group.label}
                </div>
                <span
                  className="mt-1.5 text-[20px] tabular-nums text-ui-slate"
                  style={{fontFamily: MONO_FONT_FAMILY}}
                >
                  offset {Math.floor(progress)}
                </span>
              </div>
            );
          })}
        </div>

        <div
          className="mt-[220px] flex items-center gap-8 text-[25px] text-ui-slate"
          style={{fontFamily: SANS_FONT_FAMILY, opacity: noteOpacity}}
        >
          <span>
            <span className="font-bold text-ui-mint">leer no borra</span>: el
            evento queda para los demás
          </span>
          <span className="text-ui-line">|</span>
          <span>la retención la definís vos</span>
        </div>
      </AbsoluteFill>
    </SceneTransition>
  );
};

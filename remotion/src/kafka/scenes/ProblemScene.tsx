import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {SceneTransition} from '../../components/SceneTransition';
import {MONO_FONT_FAMILY, SANS_FONT_FAMILY} from '../../lib/fonts';
import type {SceneTiming} from '../../lib/timing';
import {SceneHeading} from '../components/SceneHeading';

type ProblemSceneProps = {
  readonly services: string[];
  readonly timing: SceneTiming;
};

const BOARD_WIDTH = 1560;
const BOARD_HEIGHT = 560;
const NODE_WIDTH = 240;
const NODE_HEIGHT = 74;

/** Frame en el que empieza y termina de tejerse la maraña. */
const WEAVE_START = 18;
const WEAVE_END = 190;

type Point = {readonly x: number; readonly y: number};

/**
 * Reparte los servicios sobre una elipse. Es determinista (sólo depende de
 * la cantidad), así que no hace falta `random()` de Remotion.
 */
const getNodePositions = (count: number): Point[] =>
  new Array(count).fill(true).map((_, index) => {
    // -90° para que el primero quede arriba del todo.
    const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
    return {
      x: BOARD_WIDTH / 2 + Math.cos(angle) * 560,
      y: BOARD_HEIGHT / 2 + Math.sin(angle) * 200,
    };
  });

/**
 * Escena 2 (6s → 17s): el problema de las integraciones punto a punto.
 *
 * Cada par de servicios se conecta con todos los demás: n·(n-1)/2 líneas.
 * Se dibujan una tras otra para que se vea *crecer* el enredo — que es
 * justamente lo que la narración está diciendo.
 */
export const ProblemScene: React.FC<ProblemSceneProps> = ({
  services,
  timing,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const positions = useMemo(() => getNodePositions(services.length), [services]);

  const pairs = useMemo(() => {
    const result: Array<{from: Point; to: Point}> = [];
    for (let i = 0; i < positions.length; i += 1) {
      for (let j = i + 1; j < positions.length; j += 1) {
        result.push({from: positions[i], to: positions[j]});
      }
    }
    return result;
  }, [positions]);

  // Cuántas líneas ya se dibujaron: de acá sale también el contador.
  const drawnLines = interpolate(
    frame,
    [WEAVE_START, WEAVE_END],
    [0, pairs.length],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  // Cuando la maraña está completa, el conjunto vira a rojo.
  const alarm = interpolate(frame, [WEAVE_END, WEAVE_END + 26], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });

  return (
    <SceneTransition
      exitStartFrame={timing.exitStartFrame}
      exitDurationInFrames={timing.exitDurationInFrames}
      translateY={20}
      scaleFrom={0.98}
    >
      <AbsoluteFill className="items-center justify-center gap-6 pb-52">
        <SceneHeading step="El problema" title="Todos hablando con todos" />

        <div
          className="relative"
          style={{width: BOARD_WIDTH, height: BOARD_HEIGHT}}
        >
          <svg
            width={BOARD_WIDTH}
            height={BOARD_HEIGHT}
            className="absolute inset-0"
          >
            {pairs.map((pair, index) => {
              // Cada línea se dibuja en su turno: progreso 0→1 individual.
              const progress = interpolate(
                drawnLines,
                [index, index + 1],
                [0, 1],
                {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
              );

              if (progress === 0) {
                return null;
              }

              const dx = pair.to.x - pair.from.x;
              const dy = pair.to.y - pair.from.y;

              return (
                <line
                  key={index}
                  x1={pair.from.x}
                  y1={pair.from.y}
                  x2={pair.from.x + dx * progress}
                  y2={pair.from.y + dy * progress}
                  stroke={alarm > 0 ? '#fb7185' : '#fbbf24'}
                  strokeOpacity={0.2 + 0.32 * alarm}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>

          {services.map((service, index) => {
            const appear = spring({
              frame: frame - index * 3,
              fps,
              config: {damping: 200},
              durationInFrames: 20,
            });

            return (
              <div
                key={service}
                className="absolute flex items-center justify-center rounded-xl border border-ui-line bg-ui-panel text-[24px] font-semibold text-ui-cloud"
                style={{
                  width: NODE_WIDTH,
                  height: NODE_HEIGHT,
                  left: positions[index].x - NODE_WIDTH / 2,
                  top: positions[index].y - NODE_HEIGHT / 2,
                  fontFamily: SANS_FONT_FAMILY,
                  opacity: appear,
                  transform: `scale(${0.86 + 0.14 * appear})`,
                  boxShadow: '0 24px 48px -24px rgba(0,0,0,0.9)',
                }}
              >
                {service}
              </div>
            );
          })}
        </div>

        <div
          className="flex items-baseline gap-4"
          style={{fontFamily: MONO_FONT_FAMILY}}
        >
          <span
            className="text-[56px] font-bold tabular-nums"
            style={{color: alarm > 0.5 ? '#fb7185' : '#fbbf24'}}
          >
            {Math.floor(drawnLines)}
          </span>
          <span className="text-[26px] uppercase tracking-[0.24em] text-ui-slate">
            integraciones punto a punto
          </span>
        </div>
      </AbsoluteFill>
    </SceneTransition>
  );
};

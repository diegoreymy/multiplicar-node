import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {SceneTransition} from '../../components/SceneTransition';
import {MONO_FONT_FAMILY, SANS_FONT_FAMILY} from '../../lib/fonts';
import type {SceneTiming} from '../../lib/timing';
import {SceneHeading} from '../components/SceneHeading';

type SolutionSceneProps = {
  readonly producers: string[];
  readonly consumers: string[];
  readonly timing: SceneTiming;
};

const COLUMN_WIDTH = 300;
const CARD_HEIGHT = 88;
const CARD_GAP = 34;
const BROKER_WIDTH = 400;

/** Cada cuánto (en frames) sale un evento nuevo por los cables. */
const PACKET_PERIOD = 45;

const Card: React.FC<{label: string; progress: number}> = ({
  label,
  progress,
}) => (
  <div
    className="flex items-center justify-center rounded-xl border border-ui-line bg-ui-panel text-[25px] font-semibold text-ui-cloud"
    style={{
      width: COLUMN_WIDTH,
      height: CARD_HEIGHT,
      fontFamily: SANS_FONT_FAMILY,
      opacity: progress,
      transform: `translateX(${(1 - progress) * -28}px)`,
      boxShadow: '0 24px 48px -24px rgba(0,0,0,0.9)',
    }}
  >
    {label}
  </div>
);

/**
 * Escena 3 (17s → 28s): Kafka en el medio.
 *
 * Los "paquetes" que viajan por los cables se posicionan con el resto de
 * `frame` sobre un período fijo: es un bucle continuo y determinista, sin
 * estado ni animaciones CSS.
 */
export const SolutionScene: React.FC<SolutionSceneProps> = ({
  producers,
  consumers,
  timing,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const brokerSpring = spring({
    frame: frame - 8,
    fps,
    config: {damping: 200, mass: 0.7},
    durationInFrames: 22,
  });

  const wiresOpacity = interpolate(frame, [26, 44], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const columnHeight = producers.length * CARD_HEIGHT + (producers.length - 1) * CARD_GAP;

  const renderPackets = (side: 'in' | 'out', count: number) =>
    new Array(count).fill(true).map((_, index) => {
      // Cada carril arranca desfasado para que no viajen todos juntos.
      const offset = (index * PACKET_PERIOD) / count + (side === 'out' ? 22 : 0);
      const progress = ((frame + offset) % PACKET_PERIOD) / PACKET_PERIOD;
      const y = index * (CARD_HEIGHT + CARD_GAP) + CARD_HEIGHT / 2;

      return (
        <circle
          key={`${side}-${index}`}
          cx={progress * 150}
          cy={y}
          r={7}
          fill={side === 'in' ? '#4fc3f7' : '#34d399'}
          opacity={wiresOpacity * Math.sin(progress * Math.PI)}
        />
      );
    });

  const wire = (index: number) => {
    const y = index * (CARD_HEIGHT + CARD_GAP) + CARD_HEIGHT / 2;
    return (
      <line
        key={index}
        x1={0}
        y1={y}
        x2={150}
        y2={y}
        stroke="#1e2a44"
        strokeWidth={3}
        opacity={wiresOpacity}
      />
    );
  };

  return (
    <SceneTransition
      exitStartFrame={timing.exitStartFrame}
      exitDurationInFrames={timing.exitDurationInFrames}
      translateY={20}
      scaleFrom={0.98}
    >
      <AbsoluteFill className="items-center justify-center gap-12 pb-52">
        <SceneHeading step="La solución" title="Un intermediario en el medio" />

        <div className="flex items-center" style={{height: columnHeight}}>
          <div className="flex flex-col justify-between" style={{height: columnHeight}}>
            {producers.map((producer, index) => (
              <Card
                key={producer}
                label={producer}
                progress={spring({
                  frame: frame - index * 3,
                  fps,
                  config: {damping: 200},
                  durationInFrames: 20,
                })}
              />
            ))}
          </div>

          <svg width={150} height={columnHeight}>
            {producers.map((_, index) => wire(index))}
            {renderPackets('in', producers.length)}
          </svg>

          <div
            className="flex flex-col items-center justify-center gap-5 rounded-2xl border-2 border-kf-violet/70 bg-ui-panel"
            style={{
              width: BROKER_WIDTH,
              height: columnHeight,
              opacity: brokerSpring,
              transform: `scale(${0.9 + 0.1 * brokerSpring})`,
              boxShadow:
                '0 0 90px -20px rgba(139,92,246,0.75), 0 40px 80px -40px rgba(0,0,0,0.9)',
            }}
          >
            <span
              className="text-[34px] font-extrabold tracking-tight text-ui-cloud"
              style={{fontFamily: SANS_FONT_FAMILY}}
            >
              Apache Kafka
            </span>

            {/* El log del broker: celdas que se llenan de a poco. */}
            <div className="flex flex-col gap-2.5">
              {[0, 1, 2].map((row) => (
                <div key={row} className="flex gap-2">
                  {new Array(7).fill(true).map((_, cell) => {
                    const filled = spring({
                      frame: frame - 34 - row * 6 - cell * 4,
                      fps,
                      config: {damping: 200},
                      durationInFrames: 14,
                    });
                    return (
                      <div
                        key={cell}
                        className="h-[16px] w-[34px] rounded-sm bg-kf-violet"
                        style={{opacity: 0.18 + filled * 0.72}}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            <span
              className="text-[19px] uppercase tracking-[0.26em] text-ui-slate"
              style={{fontFamily: MONO_FONT_FAMILY}}
            >
              log distribuido
            </span>
          </div>

          <svg width={150} height={columnHeight}>
            {consumers.map((_, index) => wire(index))}
            {renderPackets('out', consumers.length)}
          </svg>

          <div className="flex flex-col justify-between" style={{height: columnHeight}}>
            {consumers.map((consumer, index) => (
              <Card
                key={consumer}
                label={consumer}
                progress={spring({
                  frame: frame - 12 - index * 3,
                  fps,
                  config: {damping: 200},
                  durationInFrames: 20,
                })}
              />
            ))}
          </div>
        </div>

        <div
          className="flex items-center gap-10 text-[24px] uppercase tracking-[0.24em] text-ui-slate"
          style={{fontFamily: MONO_FONT_FAMILY, opacity: wiresOpacity}}
        >
          <span>productores</span>
          <span className="text-ui-mint">publican · leen</span>
          <span>consumidores</span>
        </div>
      </AbsoluteFill>
    </SceneTransition>
  );
};

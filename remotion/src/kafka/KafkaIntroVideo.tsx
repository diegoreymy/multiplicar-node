import React from 'react';
import {AbsoluteFill, Sequence, useVideoConfig} from 'remotion';
import {Backdrop} from '../components/Backdrop';
import {
  CROSS_FADE_IN_SECONDS,
  FINAL_FADE_IN_SECONDS,
  getSceneTiming,
  secondsToFrames,
} from '../lib/timing';
import {Narration} from './components/Narration';
import {Subtitles} from './components/Subtitles';
import {AnatomyScene} from './scenes/AnatomyScene';
import {ClosingScene} from './scenes/ClosingScene';
import {ConsumerScene, type ConsumerGroup} from './scenes/ConsumerScene';
import {IntroScene} from './scenes/IntroScene';
import {ProblemScene} from './scenes/ProblemScene';
import {SolutionScene} from './scenes/SolutionScene';
import {SCENES} from './script';

export {DURATION_IN_FRAMES} from './script';

export type KafkaIntroVideoProps = {
  readonly title: string;
  readonly eyebrow: string;
  readonly subtitle: string;
  readonly services: string[];
  readonly producers: string[];
  readonly consumers: string[];
  readonly topic: string;
  readonly partitions: number;
  readonly consumerGroups: ConsumerGroup[];
  readonly bullets: string[];
  readonly headline: string;
  readonly footnote: string;
};

/**
 * Composición principal — 60 s exactos.
 *
 *   1 · 0s  → 6s   Portada
 *   2 · 6s  → 17s  El problema: integración punto a punto
 *   3 · 17s → 28s  La solución: Kafka en el medio
 *   4 · 28s → 41s  Anatomía: topic, particiones, offset
 *   5 · 41s → 52s  Consumo: grupos y offsets propios
 *   6 · 52s → 60s  Cierre
 *
 * La voz y los subtítulos se montan FUERA de las escenas, sobre la misma
 * línea de tiempo global: los dos salen de src/kafka/narration.json, así que
 * no hay forma de que la locución diga una cosa y el subtítulo otra.
 */
export const KafkaIntroVideo: React.FC<KafkaIntroVideoProps> = ({
  title,
  eyebrow,
  subtitle,
  services,
  producers,
  consumers,
  topic,
  partitions,
  consumerGroups,
  bullets,
  headline,
  footnote,
}) => {
  const {fps} = useVideoConfig();

  const chained = {
    exitInSeconds: CROSS_FADE_IN_SECONDS,
    overlapsNextScene: true,
  } as const;

  const intro = getSceneTiming(SCENES.intro, fps, chained);
  const problema = getSceneTiming(SCENES.problema, fps, chained);
  const solucion = getSceneTiming(SCENES.solucion, fps, chained);
  const anatomia = getSceneTiming(SCENES.anatomia, fps, chained);
  const consumo = getSceneTiming(SCENES.consumo, fps, chained);
  const cierre = getSceneTiming(SCENES.cierre, fps, {
    exitInSeconds: FINAL_FADE_IN_SECONDS,
    overlapsNextScene: false,
  });

  const premount = secondsToFrames(0.5, fps);

  return (
    <AbsoluteFill className="bg-ui-ink">
      <Backdrop accent="violet" />

      <Sequence name="01 · Portada" {...intro.sequence}>
        <IntroScene
          title={title}
          eyebrow={eyebrow}
          subtitle={subtitle}
          timing={intro}
        />
      </Sequence>

      <Sequence
        name="02 · El problema"
        {...problema.sequence}
        premountFor={premount}
      >
        <ProblemScene services={services} timing={problema} />
      </Sequence>

      <Sequence
        name="03 · La solución"
        {...solucion.sequence}
        premountFor={premount}
      >
        <SolutionScene
          producers={producers}
          consumers={consumers}
          timing={solucion}
        />
      </Sequence>

      <Sequence
        name="04 · Anatomía"
        {...anatomia.sequence}
        premountFor={premount}
      >
        <AnatomyScene topic={topic} partitions={partitions} timing={anatomia} />
      </Sequence>

      <Sequence name="05 · Consumo" {...consumo.sequence} premountFor={premount}>
        <ConsumerScene groups={consumerGroups} timing={consumo} />
      </Sequence>

      <Sequence name="06 · Cierre" {...cierre.sequence} premountFor={premount}>
        <ClosingScene
          bullets={bullets}
          headline={headline}
          footnote={footnote}
          timing={cierre}
        />
      </Sequence>

      <Narration />
      <Subtitles />
    </AbsoluteFill>
  );
};

export const DEFAULT_KAFKA_PROPS: KafkaIntroVideoProps = {
  title: '¿Qué es Apache Kafka?',
  eyebrow: 'Documentación técnica · 60 segundos',
  subtitle: 'Un log distribuido para datos en movimiento',
  services: [
    'Checkout',
    'Facturación',
    'Envíos',
    'Stock',
    'Analytics',
    'Emails',
  ],
  producers: ['Checkout', 'App móvil', 'Stock'],
  consumers: ['Facturación', 'Envíos', 'Analytics'],
  topic: 'pagos',
  partitions: 3,
  consumerGroups: [
    {
      label: 'grupo: facturación',
      color: '#34d399',
      finalOffset: 9,
      startFrame: 30,
      durationInFrames: 130,
    },
    {
      label: 'grupo: analytics',
      color: '#4fc3f7',
      finalOffset: 5,
      startFrame: 44,
      durationInFrames: 150,
    },
  ],
  bullets: [
    'Integrar servicios sin acoplarlos',
    'Procesar streams en tiempo real',
    'Reprocesar la historia cuando algo falla',
  ],
  headline: 'Eso es Apache Kafka.',
  footnote: 'Documentado para el equipo',
};

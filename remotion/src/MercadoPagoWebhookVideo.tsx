import React from 'react';
import {AbsoluteFill, Sequence, useVideoConfig} from 'remotion';
import {Backdrop} from './components/Backdrop';
import {DEFAULT_PAYLOAD_LINES, type TerminalLine} from './lib/payload';
import {
  CROSS_FADE_IN_SECONDS,
  FINAL_FADE_IN_SECONDS,
  getSceneTiming,
  SCENES,
  secondsToFrames,
} from './lib/timing';
import {OutroScene} from './scenes/OutroScene';
import {TerminalScene} from './scenes/TerminalScene';
import {TitleScene} from './scenes/TitleScene';

export type MercadoPagoWebhookVideoProps = {
  readonly title: string;
  readonly eyebrow: string;
  readonly windowTitle: string;
  readonly payloadLines: TerminalLine[];
  readonly outroMessage: string;
  readonly outroFootnote: string;
};

/**
 * Composición principal — 15 s exactos.
 *
 *   Escena 1 · 0s  → 3s   Título
 *   Escena 2 · 3s  → 11s  Terminal + payload JSON tipeado
 *   Escena 3 · 11s → 15s  Cierre con check
 *
 * Notas de implementación:
 * - Los tiempos se declaran en segundos (lib/timing.ts) y se convierten con
 *   el `fps` real de la composición: el video no se rompe a 60fps.
 * - Cada <Sequence> lleva `durationInFrames` (si no, la escena quedaría
 *   montada hasta el final) y `name` (etiqueta legible en la timeline del
 *   Studio).
 * - Las dos primeras escenas se extienden medio segundo más allá de su
 *   ventana para encadenarse con la siguiente: durante ese tramo conviven
 *   las dos y el corte se lee como un fundido, no como un salto.
 * - `premountFor` monta las escenas pesadas unos frames antes de que entren,
 *   así el primer frame visible no tiene flicker de layout ni de fuentes.
 * - El <Backdrop> vive fuera de las Sequences: nunca se desmonta y da
 *   continuidad visual a todo el video.
 */
export const MercadoPagoWebhookVideo: React.FC<
  MercadoPagoWebhookVideoProps
> = ({
  title,
  eyebrow,
  windowTitle,
  payloadLines,
  outroMessage,
  outroFootnote,
}) => {
  const {fps} = useVideoConfig();

  const titleTiming = getSceneTiming(SCENES.title, fps, {
    exitInSeconds: CROSS_FADE_IN_SECONDS,
    overlapsNextScene: true,
  });

  const terminalTiming = getSceneTiming(SCENES.terminal, fps, {
    exitInSeconds: CROSS_FADE_IN_SECONDS,
    overlapsNextScene: true,
  });

  const outroTiming = getSceneTiming(SCENES.outro, fps, {
    exitInSeconds: FINAL_FADE_IN_SECONDS,
    overlapsNextScene: false,
  });

  const premount = secondsToFrames(0.5, fps);

  return (
    <AbsoluteFill className="bg-mp-ink">
      <Backdrop />

      <Sequence name="01 · Título" {...titleTiming.sequence}>
        <TitleScene title={title} eyebrow={eyebrow} timing={titleTiming} />
      </Sequence>

      <Sequence
        name="02 · Terminal · payload"
        {...terminalTiming.sequence}
        premountFor={premount}
      >
        <TerminalScene
          lines={payloadLines}
          windowTitle={windowTitle}
          timing={terminalTiming}
        />
      </Sequence>

      <Sequence
        name="03 · Cierre QA"
        {...outroTiming.sequence}
        premountFor={premount}
      >
        <OutroScene
          message={outroMessage}
          footnote={outroFootnote}
          timing={outroTiming}
        />
      </Sequence>
    </AbsoluteFill>
  );
};

/**
 * defaultProps de la composición. Al estar tipados y ser serializables,
 * el Remotion Studio los muestra editables en el panel derecho y se pueden
 * sobreescribir en el render con `--props`.
 */
export const DEFAULT_VIDEO_PROPS: MercadoPagoWebhookVideoProps = {
  title: 'Flujo de Webhook: Pago Aprobado',
  eyebrow: 'Mercado Pago · Integración',
  windowTitle: 'multiplicar-node — webhooks/mercadopago',
  payloadLines: DEFAULT_PAYLOAD_LINES,
  outroMessage: 'Documentado para el equipo de QA',
  outroFootnote: 'multiplicar-node · integración mercado pago',
};

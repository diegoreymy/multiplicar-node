import {FPS, secondsToFrames, type SceneWindows} from '../lib/timing';
import narrationJson from './narration.json';

/** Duración total exigida por el brief: 60 segundos exactos. */
export const TOTAL_DURATION_IN_SECONDS = 60;
export const DURATION_IN_FRAMES = secondsToFrames(
  TOTAL_DURATION_IN_SECONDS,
  FPS,
); // 1800 frames @ 30fps

/** Ventanas de cada escena, en segundos. */
export const SCENES = {
  intro: {from: 0, to: 6},
  problema: {from: 6, to: 17},
  solucion: {from: 17, to: 28},
  anatomia: {from: 28, to: 41},
  consumo: {from: 41, to: 52},
  cierre: {from: 52, to: 60},
} as const satisfies SceneWindows;

export type NarrationSegment = {
  /** Identificador estable: da nombre al archivo de audio (public/voz/kafka). */
  readonly id: string;
  /** Segundo en el que arranca la locución. */
  readonly startInSeconds: number;
  /** Segundo en el que debe terminar como muy tarde (para validar el audio). */
  readonly endInSeconds: number;
  /** Texto que se locuta Y que se muestra como subtítulo. */
  readonly text: string;
};

/**
 * Guion de la narración: única fuente de verdad.
 *
 * El texto vive en narration.json —y no en este .ts— porque lo consumen dos
 * mundos: el bundle del video (subtítulos + <Audio>) y el script de Node que
 * genera la voz. Un solo archivo, cero chance de que se desincronicen.
 *
 * De acá salen tres cosas:
 *   1. Los archivos de audio (scripts/generate-voiceover.mjs).
 *   2. Los <Audio> que se montan en la composición.
 *   3. Los subtítulos en pantalla.
 *
 * Cada segmento arranca un pelín después de su escena para que el visual
 * se establezca antes de que entre la voz.
 */
export const NARRATION = narrationJson satisfies NarrationSegment[];

/** Ruta del audio de un segmento dentro de public/. */
export const narrationSrc = (segment: NarrationSegment): string =>
  `voz/kafka/${segment.id}.mp3`;

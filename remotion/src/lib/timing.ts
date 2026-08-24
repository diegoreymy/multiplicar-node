/**
 * Helpers de línea de tiempo compartidos por todos los videos.
 *
 * Buena práctica de Remotion: nunca hardcodear frames sueltos en los
 * componentes. Se declara todo en SEGUNDOS y se convierte con el `fps` real
 * de la composición (`useVideoConfig()`), de modo que el video sigue siendo
 * correcto si mañana se renderiza a 60fps.
 */

export const FPS = 30;
export const VIDEO_WIDTH = 1920;
export const VIDEO_HEIGHT = 1080;

export const secondsToFrames = (seconds: number, fps: number): number =>
  Math.round(seconds * fps);

export type SceneWindow = {
  /** Segundo en el que entra la escena. */
  readonly from: number;
  /** Segundo en el que sale la escena. */
  readonly to: number;
};

/** Cada video declara sus propias ventanas con este shape. */
export type SceneWindows = Record<string, SceneWindow>;

/** Duración del cross-fade entre escenas. */
export const CROSS_FADE_IN_SECONDS = 0.5;
/** Fundido a negro del final del video. */
export const FINAL_FADE_IN_SECONDS = 0.7;

export type SceneTiming = {
  /** Props que se le pasan a <Sequence>. */
  readonly sequence: {readonly from: number; readonly durationInFrames: number};
  /** Duración "de guion" de la escena (sin la cola del cross-fade). */
  readonly contentDurationInFrames: number;
  /** Frame —relativo a la escena— en el que arranca el fundido de salida. */
  readonly exitStartFrame: number;
  readonly exitDurationInFrames: number;
};

/**
 * Traduce una ventana en segundos a los frames que necesitan la <Sequence>
 * y el componente de transición.
 *
 * Clave del cross-fade: cuando hay una escena siguiente, esta <Sequence> se
 * extiende `exitInSeconds` MÁS ALLÁ de su ventana. La escena entrante ya
 * arrancó en su segundo exacto, así que ambas conviven durante ese tramo y
 * el corte se lee como un fundido encadenado — sin mover los tiempos del
 * guion.
 *
 * En la última escena no hay nada con qué encadenar, así que el fundido se
 * mete hacia adentro para que quepa dentro de la duración total.
 */
export const getSceneTiming = (
  scene: SceneWindow,
  fps: number,
  options: {
    readonly exitInSeconds: number;
    readonly overlapsNextScene: boolean;
  },
): SceneTiming => {
  const contentDurationInFrames = secondsToFrames(scene.to - scene.from, fps);
  const exitDurationInFrames = secondsToFrames(options.exitInSeconds, fps);

  const exitStartFrame = options.overlapsNextScene
    ? contentDurationInFrames
    : contentDurationInFrames - exitDurationInFrames;

  return {
    sequence: {
      from: secondsToFrames(scene.from, fps),
      // `durationInFrames` es obligatorio: sin él la escena se quedaría
      // montada hasta el final del video.
      durationInFrames: exitStartFrame + exitDurationInFrames,
    },
    contentDurationInFrames,
    exitStartFrame,
    exitDurationInFrames,
  };
};

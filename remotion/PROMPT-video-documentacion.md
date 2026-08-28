# Prompt autocontenido: video de documentación técnica con Remotion

> **Cómo usarlo.** Abrí una sesión nueva de Claude Code en un directorio vacío y
> pegá este archivo entero. No necesita acceso a ningún repositorio: el
> andamiaje va incluido más abajo. Antes de pegarlo, completá la sección 1.

---

## 1. Tu encargo

Actuá como experto en React y Remotion. Construí un video de documentación
técnica a partir de esta documentación:

    {{PEGÁ ACÁ LA DOCUMENTACIÓN: el texto, el README, el diagrama, el ticket
    o lo que haya que explicar. Puede ser largo; vos extraés la idea.}}

- **Duración:** {{60}} segundos exactos.
- **Audiencia:** {{a quién le habla: el equipo de QA, backend, alguien que
  recién entra al proyecto}}.
- **Idioma:** {{español rioplatense}}.
- **Voz en off:** {{sí, con subtítulos quemados | no, video mudo}}.
- **Nombre corto del video (slug):** {{mi-video}} — se usa para la carpeta,
  la composición y la carpeta de audio.

**Vos definís el guion visual.** Leé la documentación, decidí qué historia
cuenta mejor la idea en esa duración y proponé las escenas con sus ventanas en
segundos. Regla: las ventanas cubren la duración total sin huecos ni
solapamientos, y ninguna escena es una pared de texto — si algo se puede
mostrar con un diagrama animado, se muestra.

Antes de escribir código, mostrame el guion propuesto: escenas, ventanas y qué
se ve en cada una. Si hay una decisión que cambia el resultado y no está en la
documentación, preguntame en vez de asumir.

---

## 2. Metodología

Estas reglas no son estilo personal: cada una evita una clase de bug que en
video se paga caro, porque el error recién se ve en el render final.

### Línea de tiempo

- Declarar los tiempos en SEGUNDOS y convertirlos con el `fps` real de
  `useVideoConfig()`. Nunca frames hardcodeados dentro de los componentes: el
  video tiene que seguir siendo correcto si se renderiza a 60fps.
- Cada `<Sequence>` lleva `durationInFrames` — si falta, la escena queda montada
  hasta el final del video y se pisa con las siguientes — y un `name` legible
  para la timeline del Studio.
- Cross-fade sin mover el guion: `getSceneTiming(scene, fps, {overlapsNextScene:
  true})` extiende la Sequence más allá de su ventana para que conviva con la
  entrante, que igual arranca en su segundo exacto. La última escena usa
  `overlapsNextScene: false` para que el fundido final entre en la duración
  total. Sin esto hay un bajón a negro entre escenas.
- `premountFor` en las escenas pesadas, para que el primer frame visible no
  tenga flicker de layout ni de fuentes.
- Lo que da continuidad visual (el fondo) se monta FUERA de las Sequences: así
  no se desmonta nunca y los cortes se leen como transiciones.

### Animación

- Todo se deriva de `useCurrentFrame()`. Prohibido `setInterval`, `setTimeout`,
  `useState` para animar, animaciones CSS y `<animate>` de SVG: se desincronizan
  del frame que se está renderizando y rompen tanto el scrubbing hacia atrás
  como el render distribuido.
- `interpolate` siempre con `extrapolateLeft` y `extrapolateRight` en `'clamp'`.
- `spring` siempre recibe el `fps` de la composición.
- Nada de `Math.random()`: si hace falta azar, `random()` de Remotion con seed.
- Los bucles continuos se derivan del resto de `frame` sobre un período fijo.
- El contenido de una escena que entra por cross-fade tiene que esperar a que
  termine el encadenado, o se dibuja encima de la escena que todavía se ve.
- Con `strokeLinecap="round"`, un trazo de longitud cero igual pinta un punto:
  hay que ocultarlo hasta que el trazo empiece.

### Estilos

- TailwindCSS v4 para lo estático; todo lo que cambia frame a frame va en
  `style` inline. Tailwind no puede generar clases por frame ni detectar clases
  construidas dinámicamente.
- Colores y tipografías como tokens en `@theme` (`src/styles.css`): los
  compartidos con prefijo `ui-`, el acento propio del video con su prefijo.
- Nada de reflow durante las animaciones de texto: altura fija en las filas y
  que cambie sólo el contenido visible.

### Props

- `defaultProps` tipadas y serializables: así se editan en vivo en el Studio y
  se sobreescriben en el render con `--props`.
- Los textos y datos van por props, no hardcodeados en el JSX.

### Voz y subtítulos

- El guion vive en UN solo archivo `src/<slug>/narration.json`, con
  `{id, startInSeconds, endInSeconds, text}` por locución. De ahí salen las tres
  cosas: los mp3, los `<Audio>` y los subtítulos. Nunca duplicar el texto.
- Un `<Audio>` por locución, cada uno en su `<Sequence from={...}>`, en vez de
  un mp3 largo: así regenerar una línea suelta —o cambiar de voz— no
  desincroniza al resto.
- Generar con `npm run voz -- --video=<slug>`. Por defecto Piper neuronal
  offline; `--speed` ajusta el ritmo (menor = más lento).
- Dejar aire: apuntar a llenar ~80% de cada ventana, no al ras. VITS usa un
  predictor de duración estocástico y la misma frase varía ~5% entre corridas,
  así que una locución al límite falla una de cada tantas veces.
- Escribir el texto para el ritmo real de la voz: **medí las duraciones, no las
  estimes**. Cada proveedor habla a distinta velocidad. Si sobra silencio, no
  dejes el hueco: ampliá el guion y decí más en el mismo tiempo.
- Los subtítulos se montan fuera de las Sequences (usan el frame global) y las
  escenas reservan el espacio de abajo (`pb-52`) para no pisarlos.

---

## 3. Andamiaje

Creá estos archivos **tal cual**. Ya están probados de punta a punta en un
proyecto vacío: instalan, tipan, bundlean, generan voz y renderizan. No los
reescribas ni los "mejores" — si algo te parece que falta, es porque pertenece
al código específico de tu video, no acá.

Después de crearlos: `npm install`.

#### `package.json`

```json
{
  "name": "videos-documentacion",
  "version": "1.0.0",
  "private": true,
  "description": "Videos de documentación técnica (Remotion + TailwindCSS)",
  "type": "module",
  "scripts": {
    "dev": "remotion studio",
    "studio": "remotion studio",
    "voz": "node scripts/generate-voiceover.mjs",
    "typecheck": "tsc --noEmit",
    "upgrade": "remotion upgrade"
  },
  "dependencies": {
    "@remotion/bundler": "4.0.516",
    "@remotion/cli": "4.0.516",
    "@remotion/google-fonts": "4.0.516",
    "@remotion/tailwind-v4": "4.0.516",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "remotion": "4.0.516"
  },
  "devDependencies": {
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0",
    "mespeak": "^2.0.2",
    "sherpa-onnx-node": "^1.13.6",
    "typescript": "^5.9.0"
  }
}
```

#### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "remotion.config.ts"]
}
```

#### `remotion.config.ts`

```ts
import {Config} from '@remotion/cli/config';
import {enableTailwind} from '@remotion/tailwind-v4';

/**
 * Buena práctica: la configuración del proyecto vive en un solo lugar.
 * `enableTailwind` inyecta el loader de Tailwind v4 en el Webpack de Remotion
 * tanto para el Studio como para el render.
 */
Config.overrideWebpackConfig(enableTailwind);

Config.setVideoImageFormat('jpeg');
Config.setChromiumOpenGlRenderer('angle');
```

#### `.gitignore`

```text
node_modules/
out/
.remotion/
```

#### `src/index.ts`

```ts
import {registerRoot} from 'remotion';
import {RemotionRoot} from './Root';

registerRoot(RemotionRoot);
```

#### `src/styles.css`

```css
@import "tailwindcss";

/**
 * Tokens de diseño compartidos por los videos del proyecto.
 * Se declaran con @theme (Tailwind v4) para poder usarlos como clases
 * estáticas: bg-ui-ink, text-ui-cloud, border-ui-line, text-accent, etc.
 *
 * Buena práctica: los colores/tipografías son ESTÁTICOS (Tailwind los detecta
 * en build). Todo lo que cambia frame a frame va en `style` inline.
 *
 * Cada video suma su propio acento con su prefijo (por ejemplo --color-kf-*)
 * en vez de pisar estos.
 */
@theme {
  --color-ui-ink: #05070d;
  --color-ui-ink-soft: #0b1020;
  --color-ui-panel: #0f1626;
  --color-ui-line: #1e2a44;
  --color-ui-mint: #34d399;
  --color-ui-amber: #fbbf24;
  --color-ui-violet: #a78bfa;
  --color-ui-slate: #64748b;
  --color-ui-cloud: #e8eefc;

  /* Acento por defecto; cambialo o agregá el de tu video. */
  --color-accent: #8b5cf6;
  --color-accent-soft: #c4b5fd;
}
```

#### `src/lib/timing.ts`

```ts
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
```

#### `src/lib/fonts.ts`

```ts
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadJetBrainsMono} from '@remotion/google-fonts/JetBrainsMono';

/**
 * Buena práctica: cargar las fuentes con @remotion/google-fonts en lugar de
 * un <link> a Google Fonts. El paquete usa delayRender()/continueRender()
 * internamente, así que el render nunca captura un frame con la fuente
 * todavía sin cargar (FOUT).
 *
 * Los archivos se descargan de fonts.gstatic.com: si el entorno de render no
 * tiene salida a esa CDN, conviene servir los .woff2 desde public/ con
 * `staticFile()` + @remotion/fonts.
 *
 * Se ejecuta a nivel de módulo (una sola vez), no dentro de un componente.
 */
const {fontFamily: interFamily} = loadInter('normal', {
  weights: ['400', '600', '800'],
  subsets: ['latin'],
});

const {fontFamily: jetBrainsFamily} = loadJetBrainsMono('normal', {
  weights: ['400', '700'],
  subsets: ['latin'],
});

export const SANS_FONT_FAMILY = `${interFamily}, system-ui, sans-serif`;
export const MONO_FONT_FAMILY = `${jetBrainsFamily}, ui-monospace, monospace`;
```

#### `src/lib/narration.ts`

```ts
/**
 * Tipos y helpers del guion narrado.
 *
 * El guion de cada video vive en UN solo archivo `<slug>/narration.json`.
 * De ahí salen tres cosas —los archivos de audio, los <Audio> de la
 * composición y los subtítulos en pantalla—, así que no pueden
 * desincronizarse entre sí.
 */

export type NarrationSegment = {
  /** Identificador estable: da nombre al archivo de audio. */
  readonly id: string;
  /** Segundo en el que arranca la locución. */
  readonly startInSeconds: number;
  /** Segundo en el que debe terminar como muy tarde (lo valida el script). */
  readonly endInSeconds: number;
  /** Texto que se locuta Y que se muestra como subtítulo. */
  readonly text: string;
};

/** Ruta del audio de un segmento dentro de public/. */
export const narrationSrc = (slug: string, segment: NarrationSegment): string =>
  `voz/${slug}/${segment.id}.mp3`;
```

#### `src/components/SceneTransition.tsx`

```tsx
import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';

type SceneTransitionProps = {
  /** Frame —relativo a la escena— en el que arranca el fundido de salida. */
  readonly exitStartFrame: number;
  readonly exitDurationInFrames: number;
  readonly enterDurationInFrames?: number;
  /** Desplazamiento vertical inicial, en px. */
  readonly translateY?: number;
  /** Escala inicial (1 = sin zoom). */
  readonly scaleFrom?: number;
  readonly children: React.ReactNode;
};

/**
 * Envoltorio de entrada/salida reutilizable.
 *
 * Vive DENTRO de una <Sequence>, así que `useCurrentFrame()` ya viene
 * desplazado: el frame 0 es el primer frame de la escena. Los tiempos se
 * reciben por props en vez de leerse del contexto — queda explícito,
 * testeable y reutilizable en un <Still>.
 */
export const SceneTransition: React.FC<SceneTransitionProps> = ({
  exitStartFrame,
  exitDurationInFrames,
  enterDurationInFrames = 14,
  translateY = 34,
  scaleFrom = 0.965,
  children,
}) => {
  const frame = useCurrentFrame();

  const enter = interpolate(frame, [0, enterDurationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const exit = interpolate(
    frame,
    [exitStartFrame, exitStartFrame + exitDurationInFrames],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.in(Easing.quad),
    },
  );

  const opacity = enter * (1 - exit);
  const offsetY = (1 - enter) * translateY - exit * translateY * 0.5;
  const scale = scaleFrom + (1 - scaleFrom) * enter - exit * 0.025;

  return (
    <AbsoluteFill
      // Los valores animados van inline: Tailwind no puede generar clases
      // dinámicas por frame y además así evitamos recalcular el CSS.
      style={{
        opacity,
        transform: `translateY(${offsetY}px) scale(${scale})`,
        willChange: 'transform, opacity',
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
```

#### `src/components/Backdrop.tsx`

```tsx
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

/** Cada video tiñe el fondo con su color de marca. */
const ACCENTS = {
  blue: {glow: '0,158,227', strength: 0.24},
  violet: {glow: '139,92,246', strength: 0.2},
} as const;

type BackdropProps = {
  readonly accent?: keyof typeof ACCENTS;
};

/**
 * Fondo continuo del video completo.
 *
 * Se monta FUERA de las <Sequence>, así que su `useCurrentFrame()` es el
 * frame global (0 → 449). Al no cortarse nunca, encadena las tres escenas y
 * hace que los cambios se lean como transiciones y no como cortes secos.
 */
export const Backdrop: React.FC<BackdropProps> = ({accent = 'blue'}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  const progress = frame / durationInFrames;

  const gridOffset = interpolate(progress, [0, 1], [0, -70]);
  const glowX = interpolate(progress, [0, 0.5, 1], [32, 52, 66]);
  const glowY = interpolate(progress, [0, 0.5, 1], [26, 44, 32]);

  const {glow, strength} = ACCENTS[accent];

  return (
    <AbsoluteFill className="bg-ui-ink">
      {/* Halo de marca que se desplaza lentamente. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(58% 58% at ${glowX}% ${glowY}%, rgba(${glow},${strength}) 0%, rgba(${glow},0.06) 45%, rgba(5,7,13,0) 72%)`,
        }}
      />

      {/* Retícula técnica sutil, con parallax vertical. */}
      <AbsoluteFill
        className="opacity-45"
        style={{
          backgroundImage:
            'linear-gradient(rgba(30,42,68,0.55) 1px, transparent 1px), linear-gradient(90deg, rgba(30,42,68,0.55) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          transform: `translateY(${gridOffset}px)`,
          maskImage:
            'radial-gradient(70% 70% at 50% 45%, black 0%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(70% 70% at 50% 45%, black 0%, transparent 100%)',
        }}
      />

      {/* Viñeta para dar profundidad. */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(100% 100% at 50% 50%, rgba(5,7,13,0) 40%, rgba(5,7,13,0.85) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};
```

#### `src/components/Narration.tsx`

```tsx
import React from 'react';
import {Audio, Sequence, staticFile, useVideoConfig} from 'remotion';
import {narrationSrc, type NarrationSegment} from '../lib/narration';
import {secondsToFrames} from '../lib/timing';

type NarrationProps = {
  readonly slug: string;
  readonly segments: readonly NarrationSegment[];
};

/**
 * Monta la voz en off: un <Audio> por segmento, cada uno dentro de su
 * <Sequence>.
 *
 * Por qué en piezas y no un mp3 largo: cada locución queda anclada al
 * segundo que dice el guion, así que regenerar una sola línea (o cambiar de
 * proveedor de TTS) no desincroniza al resto.
 */
export const Narration: React.FC<NarrationProps> = ({slug, segments}) => {
  const {fps} = useVideoConfig();

  return (
    <>
      {segments.map((segment) => (
        <Sequence
          key={segment.id}
          name={`voz · ${segment.id}`}
          from={secondsToFrames(segment.startInSeconds, fps)}
        >
          <Audio src={staticFile(narrationSrc(slug, segment))} />
        </Sequence>
      ))}
    </>
  );
};
```

#### `src/components/Subtitles.tsx`

```tsx
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {SANS_FONT_FAMILY} from '../lib/fonts';
import type {NarrationSegment} from '../lib/narration';
import {secondsToFrames} from '../lib/timing';

const FADE_IN_FRAMES = 6;
const FADE_OUT_FRAMES = 8;

type SubtitlesProps = {
  readonly segments: readonly NarrationSegment[];
};

/**
 * Subtítulos quemados, con el mismo texto que la locución.
 *
 * Vive fuera de las <Sequence> de las escenas, así que su `useCurrentFrame()`
 * es el frame global y puede decidir por sí mismo qué línea toca. Las escenas
 * reservan el espacio de abajo para que nunca se pisen.
 */
export const Subtitles: React.FC<SubtitlesProps> = ({segments}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const active = segments
    .map((segment) => {
      const from = secondsToFrames(segment.startInSeconds, fps);
      const to = secondsToFrames(segment.endInSeconds, fps);

      const opacity =
        interpolate(frame, [from, from + FADE_IN_FRAMES], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }) *
        interpolate(frame, [to - FADE_OUT_FRAMES, to], [1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

      return {segment, opacity};
    })
    .find(({opacity}) => opacity > 0);

  if (!active) {
    return null;
  }

  return (
    <AbsoluteFill className="items-center justify-end pb-16">
      <p
        className="max-w-[1360px] rounded-2xl bg-ui-ink/75 px-9 py-5 text-center text-[32px] leading-snug text-ui-cloud"
        style={{
          fontFamily: SANS_FONT_FAMILY,
          opacity: active.opacity,
          backdropFilter: 'blur(6px)',
        }}
      >
        {active.segment.text}
      </p>
    </AbsoluteFill>
  );
};
```

#### `scripts/generate-voiceover.mjs`

```js
/**
 * Genera los archivos de voz a partir de src/<video>/narration.json.
 *
 *   node scripts/generate-voiceover.mjs --video=<slug>    # Piper neuronal, offline (default)
 *   node scripts/generate-voiceover.mjs --provider=espeak      # robótico, sin descargas
 *   node scripts/generate-voiceover.mjs --provider=elevenlabs
 *   node scripts/generate-voiceover.mjs --provider=openai
 *   node scripts/generate-voiceover.mjs --speed=0.95           # sólo Piper: <1 más lento (default 0.85)
 *
 * Escribe public/voz/<video>/<id>.mp3 y avisa si alguna locución no entra en su
 * ventana del guion — que es lo único que puede desincronizar el video.
 */
import {execFileSync, spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VIDEO = process.argv
  .find((a) => a.startsWith('--video='))
  ?.split('=')[1];

if (!VIDEO) {
  console.error('Falta --video=<slug> (la carpeta del video dentro de src/).');
  process.exit(1);
}

const OUT_DIR = join(ROOT, 'public', 'voz', VIDEO);
const TMP_DIR = join(ROOT, 'node_modules', '.voiceover-tmp');

const arg = (name, fallback) => {
  const found = process.argv.find((a) => a.startsWith(`--${name}=`));
  return found ? found.split('=')[1] : fallback;
};

const provider = arg('provider', 'piper');
const speed = Number(arg('speed', '0.85'));
const segments = JSON.parse(
  readFileSync(join(ROOT, 'src', VIDEO, 'narration.json'), 'utf-8'),
);

/** Convierte con el ffmpeg que ya trae Remotion: una dependencia menos. */
const toMp3 = (inputPath, outputPath) => {
  execFileSync(
    'npx',
    ['remotion', 'ffmpeg', '-y', '-i', inputPath, '-codec:a', 'libmp3lame',
     '-b:a', '96k', '-ar', '44100', '-ac', '1', outputPath],
    {stdio: 'pipe', cwd: ROOT},
  );
};

const probeDurationInSeconds = (path) => {
  // ffprobe escribe la metadata en stderr, no en stdout.
  const {stdout, stderr} = spawnSync('npx', ['remotion', 'ffprobe', path], {
    cwd: ROOT,
    encoding: 'utf-8',
  });
  const match = /Duration: (\d+):(\d+):([\d.]+)/.exec(`${stdout}${stderr}`);
  if (!match) return null;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
};

/* ----------------------------------------------------------------- Piper -- */

/**
 * Voz neuronal (VITS) en español rioplatense, corriendo 100% local.
 *
 * El modelo son ~110 MB, así que no se versiona: se baja una sola vez a
 * node_modules/.tts-models (ya ignorado por git) y de ahí en adelante el
 * script funciona sin red.
 *
 * OJO: VITS usa un predictor de duración estocástico, así que dos corridas
 * sobre el mismo texto dan audios ~5% más largos o más cortos. Por eso el
 * guion deja aire en cada ventana y por eso este script valida siempre: si
 * una locución quedara al borde, fallaría una de cada tantas corridas.
 */
const PIPER_VOICE = {
  id: 'vits-piper-es_AR-daniela-high',
  model: 'es_AR-daniela-high.onnx',
  url: 'https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-es_AR-daniela-high.tar.bz2',
};

const MODELS_DIR = join(ROOT, 'node_modules', '.tts-models');

const ensurePiperVoice = () => {
  const voiceDir = join(MODELS_DIR, PIPER_VOICE.id);
  if (existsSync(join(voiceDir, PIPER_VOICE.model))) {
    return voiceDir;
  }

  console.log(`Descargando la voz ${PIPER_VOICE.id} (~110 MB, una sola vez)...`);
  mkdirSync(MODELS_DIR, {recursive: true});

  const tarball = join(MODELS_DIR, `${PIPER_VOICE.id}.tar.bz2`);
  execFileSync('curl', ['-sSL', '--fail', '-o', tarball, PIPER_VOICE.url], {
    stdio: 'inherit',
  });
  execFileSync('tar', ['xjf', tarball, '-C', MODELS_DIR], {stdio: 'inherit'});
  rmSync(tarball, {force: true});

  return voiceDir;
};

let piper = null;
const speakWithPiper = (text) => {
  if (!piper) {
    const voiceDir = ensurePiperVoice();
    const sherpa = require('sherpa-onnx-node');
    piper = {
      sherpa,
      tts: new sherpa.OfflineTts({
        model: {
          vits: {
            model: join(voiceDir, PIPER_VOICE.model),
            tokens: join(voiceDir, 'tokens.txt'),
            dataDir: join(voiceDir, 'espeak-ng-data'),
          },
          numThreads: 2,
          debug: false,
        },
        maxNumSentences: 1,
      }),
    };
  }

  const audio = piper.tts.generate({text, sid: 0, speed});

  // sherpa escribe WAV a disco; se lee de vuelta para unificar el flujo.
  const wavPath = join(TMP_DIR, 'piper.wav');
  piper.sherpa.writeWave(wavPath, {
    samples: audio.samples,
    sampleRate: audio.sampleRate,
  });
  return readFileSync(wavPath);
};

/* ---------------------------------------------------------------- eSpeak -- */

let espeak = null;
const speakWithEspeak = (text) => {
  if (!espeak) {
    espeak = require('mespeak');
    espeak.loadConfig(require('mespeak/src/mespeak_config.json'));
    espeak.loadVoice(require('mespeak/voices/es-la.json'));
  }
  // `speed` en palabras por minuto: 150 da ~2,3 palabras/s en español.
  return espeak.speak(text, {
    rawdata: 'buffer',
    speed: 150,
    pitch: 45,
    variant: 'm3',
  });
};

/* ------------------------------------------------------------ ElevenLabs -- */

const speakWithElevenLabs = async (text) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('Falta ELEVENLABS_API_KEY');

  // Voz por defecto: cambiala por la que elijas en tu cuenta.
  const voiceId = process.env.ELEVENLABS_VOICE_ID ?? 'onwK4e9ZLuTAKqWW03F9';

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: {'xi-api-key': apiKey, 'content-type': 'application/json'},
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {stability: 0.45, similarity_boost: 0.75},
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`ElevenLabs ${response.status}: ${await response.text()}`);
  }
  return Buffer.from(await response.arrayBuffer());
};

/* ---------------------------------------------------------------- OpenAI -- */

const speakWithOpenAi = async (text) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('Falta OPENAI_API_KEY');

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {authorization: `Bearer ${apiKey}`, 'content-type': 'application/json'},
    body: JSON.stringify({
      model: 'gpt-4o-mini-tts',
      voice: process.env.OPENAI_TTS_VOICE ?? 'onyx',
      input: text,
      instructions: 'Narración de documentación técnica en español rioplatense. Tono calmo, claro y didáctico.',
      response_format: 'mp3',
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI ${response.status}: ${await response.text()}`);
  }
  return Buffer.from(await response.arrayBuffer());
};

/* ------------------------------------------------------------------ main -- */

const main = async () => {
  mkdirSync(OUT_DIR, {recursive: true});
  mkdirSync(TMP_DIR, {recursive: true});

  console.log(`Generando ${segments.length} locuciones con "${provider}"\n`);
  let tooLong = 0;

  for (const segment of segments) {
    const outputPath = join(OUT_DIR, `${segment.id}.mp3`);

    if (provider === 'piper' || provider === 'espeak') {
      // Los motores locales devuelven WAV: hay un paso de conversión.
      const speak = provider === 'piper' ? speakWithPiper : speakWithEspeak;
      const wavPath = join(TMP_DIR, `${segment.id}.wav`);
      writeFileSync(wavPath, speak(segment.text));
      toMp3(wavPath, outputPath);
    } else if (provider === 'elevenlabs' || provider === 'openai') {
      const speak =
        provider === 'elevenlabs' ? speakWithElevenLabs : speakWithOpenAi;
      writeFileSync(outputPath, await speak(segment.text));
    } else {
      throw new Error(
        `Proveedor desconocido: "${provider}". ` +
          `Usá piper, espeak, elevenlabs u openai.`,
      );
    }

    const duration = probeDurationInSeconds(outputPath);
    const budget = segment.endInSeconds - segment.startInSeconds;
    // Si no se pudo medir, se reporta como fallo: un ✓ a ciegas es peor que
    // un error, porque el desfasaje recién se vería en el render final.
    const fits = duration !== null && duration <= budget;
    if (!fits) tooLong += 1;

    console.log(
      `${fits ? '✓' : '✗'} ${segment.id.padEnd(14)} ` +
        `${duration === null ? 'no medible' : `${duration.toFixed(2)}s`}` +
        ` / ${budget.toFixed(2)}s disponibles`,
    );
  }

  rmSync(TMP_DIR, {recursive: true, force: true});

  if (tooLong > 0) {
    console.error(
      `\n${tooLong} locución(es) no entran en su ventana (o no se pudieron ` +
        `medir). Acortá el texto en ` +
        `src/${VIDEO}/narration.json o bajá la velocidad, y volvé a correr.`,
    );
    process.exit(1);
  }

  console.log(`\nListo. Los archivos quedaron en public/voz/${VIDEO}/`);
};

await main();
```
---

## 4. El código de tu video

Todo lo específico va en `src/<slug>/`:

    src/<slug>/
    ├── <Nombre>Video.tsx     la composición: las <Sequence> de cada escena
    ├── script.ts             ventanas de escena, duración, import del guion
    ├── narration.json        el guion narrado (si hay voz)
    └── scenes/               una escena por archivo

Y además:

- Registrá la `<Composition>` en `src/Root.tsx`, dentro de su `<Folder>`.
- Agregá el script `render:<slug>` en `package.json`.
- Si un componente tuyo sirve para cualquier video, va en `src/components/`;
  si es de este video, en `src/<slug>/components/`.

`script.ts` de referencia:

```ts
import type {NarrationSegment} from '../lib/narration';
import {FPS, secondsToFrames, type SceneWindows} from '../lib/timing';
import narrationJson from './narration.json';

export const SLUG = 'mi-video';
export const TOTAL_DURATION_IN_SECONDS = 60;
export const DURATION_IN_FRAMES = secondsToFrames(TOTAL_DURATION_IN_SECONDS, FPS);

export const SCENES = {
  intro: {from: 0, to: 6},
  // ...las ventanas cubren la duración total, sin huecos
} as const satisfies SceneWindows;

export const NARRATION = narrationJson satisfies NarrationSegment[];
```

Y en la composición, cada escena:

```tsx
const intro = getSceneTiming(SCENES.intro, fps, {
  exitInSeconds: CROSS_FADE_IN_SECONDS,
  overlapsNextScene: true,   // false sólo en la última
});

<Sequence name="01 · Intro" {...intro.sequence} premountFor={premount}>
  <IntroScene timing={intro} {...props} />
</Sequence>

{/* fuera de las Sequences: usan el frame global */}
<Narration slug={SLUG} segments={NARRATION} />
<Subtitles segments={NARRATION} />
```

---

## 5. Definición de terminado

No lo des por terminado sin haber CORRIDO —y mirado— esto:

1. `npm run typecheck` limpio.
2. `npx remotion bundle` sin errores. Valida la cadena Webpack + Tailwind, que
   el typecheck no cubre.
3. **Un still renderizado POR ESCENA, y abrirlo.** Es el paso que más errores
   atrapa: texto que se corta, elementos encimados, espacio muerto. Corregí lo
   que se vea mal antes de entregar, no después.
4. **Un still en cada transición**, para confirmar que encadena y no hay un
   bajón a negro entre escenas.
5. Render completo y duración verificada con `npx remotion ffprobe`: tiene que
   dar los segundos pedidos.
6. Con voz: `silencedetect` sobre el render final, para confirmar que cada
   locución cae en su ventana:

       npx remotion ffmpeg -y -i out/video.mp4 -vn \
         -af "silencedetect=noise=-45dB:d=0.6" -f wav /dev/null

   Los tramos con voz tienen que coincidir con los `startInSeconds` del guion.
7. Si tocaste código compartido, re-renderizá un frame de los videos que ya
   existían para descartar regresiones.

---

## 6. Entregables

- El código, commiteado, con un mensaje que explique las decisiones y no sólo
  qué archivos cambiaron.
- El mp4 renderizado.
- Un resumen corto de: qué decidiste y por qué, qué verificaste, y **qué no
  pudiste verificar**. Si algo quedó sin probar —una API sin credenciales, el
  ritmo de una voz que no podés escuchar, una fuente que el entorno no baja—
  decilo explícitamente en vez de darlo por bueno.

---

## Apéndice: entornos con red restringida

Dos cosas del andamiaje necesitan salir a internet. Si fallan, el síntoma no
siempre es obvio:

- **Las fuentes.** `@remotion/google-fonts` baja los `.woff2` de
  `fonts.gstatic.com` en tiempo de render. Si el entorno no llega —o no confía
  en el certificado de un proxy—, el render se cuelga en "Getting composition"
  en vez de dar un error claro. Solución: servir los `.woff2` desde `public/`
  con `staticFile()` y `@remotion/fonts`, o usar fuentes del sistema.
- **El modelo de voz.** Piper se baja de GitHub releases (~110 MB, una sola
  vez). Sin acceso, queda `--provider=espeak`, que no necesita descargar nada
  pero suena robótico.

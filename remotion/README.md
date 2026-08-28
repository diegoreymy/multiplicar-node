# Videos de documentación técnica

Videos hechos con [Remotion](https://remotion.dev) + TailwindCSS v4, 1920×1080 @ 30fps.

| Composición | Duración | Tema |
| --- | --- | --- |
| `KafkaIntro` | 60s | ¿Qué es Apache Kafka? — **con voz en off neuronal y subtítulos** |
| `MercadoPagoWebhook` | 15s | Flujo del webhook de Mercado Pago (pago aprobado) |

## Cómo verlos

```bash
cd remotion
npm install
npm run dev      # Remotion Studio en http://localhost:3000
```

En el Studio se hace scrubbing por la timeline, cada `<Sequence>` aparece
etiquetada (incluidas las pistas de voz) y los textos se editan en vivo desde
el panel de props.

Renderizar:

```bash
npm run render:kafka          # → out/kafka-que-es.mp4
npm run render:mercadopago    # → out/mercadopago-webhook.mp4
npm run typecheck
```

## La voz en off

El guion vive en **`src/kafka/narration.json`** y es la única fuente de verdad:
de ahí salen los archivos de audio, los `<Audio>` de la composición y los
subtítulos en pantalla. Si cambiás una línea ahí, se actualizan las tres cosas.

```bash
npm run voz                              # Piper neuronal, offline (default)
npm run voz -- --speed=0.8               # más lento (default 0.85)
npm run voz -- --provider=espeak         # robótico, sin descargas
npm run voz -- --provider=elevenlabs     # necesita ELEVENLABS_API_KEY
npm run voz -- --provider=openai         # necesita OPENAI_API_KEY
```

### Piper (el default)

Voz neuronal **es_AR** (`daniela`, high) corriendo 100% local con
`sherpa-onnx-node`: sin claves de API, sin mandar el guion a ningún servidor.
La primera corrida baja el modelo (~110 MB) a `node_modules/.tts-models`, que
ya está fuera de git; después funciona sin red.

El **ritmo se ajusta con `--speed`** (menor = más lento). El default de 0.85
es un ritmo de documental; si te suena apurado o arrastrado, movelo y volvé a
generar — es el parámetro que conviene calibrar de oído.

> VITS usa un predictor de duración estocástico: dos corridas sobre el mismo
> texto dan audios ~5% más largos o más cortos. Por eso el guion deja aire en
> cada ventana en vez de llenarla al ras.

### La validación

El script escribe `public/voz/kafka/<id>.mp3` y **valida que cada locución
entre en su ventana del guion**, que es lo único que puede desincronizar el
video. Si alguna se pasa, falla y dice cuál:

```
✓ 03-solucion    8.25s / 10.20s disponibles
✗ 04-anatomia   12.43s / 12.20s disponibles
```

Esto importa al cambiar de proveedor o de velocidad: una voz más lenta puede
no entrar, y el guion está escrito para llenar ~80% de cada ventana con la
configuración por defecto.

## Agregar otro video

`PROMPT-video-documentacion.md` es un prompt **autocontenido** que encapsula
esta metodología. Se pega entero en una sesión nueva de Claude Code, en un
directorio vacío y sin acceso a este repo: incluye el andamiaje completo
(config, `lib/`, `components/`, el generador de voz), las reglas de tiempo,
animación, estilos y voz, y la checklist de verificación.

Para agregar un video *acá dentro*, sirve igual: saltate la sección 3, que es
el andamiaje que este repo ya tiene.

## Estructura

```
src/
├── index.ts / Root.tsx        registerRoot() y las <Composition>
├── styles.css                 Tailwind v4 + tokens de color (@theme)
├── lib/                       COMPARTIDO
│   ├── timing.ts              segundos → frames, cross-fade entre escenas
│   └── fonts.ts               Inter + JetBrains Mono
├── components/                COMPARTIDO
│   ├── Backdrop.tsx           fondo continuo (fuera de las Sequences)
│   ├── SceneTransition.tsx    entrada/salida reutilizable
│   └── CheckIcon.tsx          check SVG que se dibuja solo
├── kafka/
│   ├── KafkaIntroVideo.tsx    las seis <Sequence>
│   ├── narration.json         guion: texto + tiempos
│   ├── script.ts              ventanas de escena y tipos del guion
│   ├── components/            Narration (audio) · Subtitles · SceneHeading
│   └── scenes/                Intro · Problem · Solution · Anatomy · Consumer · Closing
└── mercadopago/
    ├── MercadoPagoWebhookVideo.tsx
    ├── payload.ts / tokenize.ts
    ├── components/            TerminalWindow · TypewriterCode
    └── scenes/                Title · Terminal · Outro
scripts/
└── generate-voiceover.mjs     genera public/voz/kafka/*.mp3
```

## Guion del video de Kafka

| Escena | Tiempo | Contenido |
| --- | --- | --- |
| `01 · Portada` | 0s → 6s | "¿Qué es Apache Kafka?" |
| `02 · El problema` | 6s → 17s | 6 servicios punto a punto: 15 integraciones que se tejen en pantalla |
| `03 · La solución` | 17s → 28s | Kafka en el medio; productores y consumidores desacoplados |
| `04 · Anatomía` | 28s → 41s | Topic → particiones → offsets, escribiéndose append-only |
| `05 · Consumo` | 41s → 52s | Dos grupos avanzando con su propio offset; leer no borra |
| `06 · Cierre` | 52s → 60s | Resumen y "Documentado para el equipo" |

## Buenas prácticas aplicadas

- **Todo se deriva del frame.** Los caracteres tipeados, el parpadeo del cursor,
  los paquetes que viajan por los cables y el trazo del check son funciones
  puras de `useCurrentFrame()` — nada de `setInterval`, `useState` ni
  animaciones CSS, que se desincronizan del frame que se está renderizando.
- **Tiempos en segundos, no en frames.** `lib/timing.ts` convierte con el `fps`
  real de `useVideoConfig()`; los videos no se rompen si se pasan a 60fps.
- **`durationInFrames` en cada `<Sequence>`** (si falta, la escena queda montada
  hasta el final) y `name` para que la timeline del Studio sea legible.
- **Cross-fade sin mover el guion.** Cada escena se extiende medio segundo más
  allá de su ventana para encadenarse con la siguiente; la entrante igual
  arranca en su segundo exacto.
- **Un `<Audio>` por locución, no un mp3 largo.** Cada pista queda anclada a su
  segundo: regenerar una línea suelta —o cambiar de voz— no desincroniza al
  resto.
- **`premountFor`** en las escenas pesadas: se montan antes de entrar, así el
  primer frame visible no tiene flicker.
- **Tailwind para lo estático, `style` para lo animado.** Tailwind no puede
  generar clases que cambian frame a frame ni detectar clases dinámicas.
- **Fuentes con `@remotion/google-fonts`**, que maneja `delayRender()` solo y
  evita capturar frames con la fuente sin cargar.
- **`interpolate` siempre con `extrapolateLeft/Right: 'clamp'`** y `spring()`
  recibiendo el `fps` de la composición.
- **Props tipadas y serializables** en `defaultProps`: editables en el Studio y
  sobreescribibles en el render con `--props`.

# Prompt: nuevo video de documentación técnica

Plantilla para generar otro video con la misma metodología que `KafkaIntro` y
`MercadoPagoWebhook`. Reemplazá los `{{...}}`, borrá lo que no aplique y pasáselo
a Claude Code parado en la raíz del repo.

---

## Encargo

Actuá como experto en React y Remotion. Generá un video de documentación técnica
sobre **{{TEMA}}**, de **{{DURACIÓN}} segundos exactos**, para **{{AUDIENCIA}}**.

Escenas — las ventanas van en segundos y tienen que cubrir la duración total sin
huecos ni solapamientos:

    1. {{0}}s → {{X}}s   {{qué se ve y qué idea explica}}
    2. {{X}}s → {{Y}}s   {{...}}
    3. {{Y}}s → {{N}}s   {{...}}

Voz: **{{CON voz en off y subtítulos quemados | SIN voz, video mudo}}**.
Idioma: **{{español rioplatense}}**.

## Dónde vive

Es un video más del proyecto `remotion/`. Reutilizá lo compartido, no dupliques:

- `src/lib/timing.ts` — segundos → frames y cross-fade entre escenas
- `src/lib/fonts.ts` — Inter + JetBrains Mono
- `src/components/` — `Backdrop`, `SceneTransition`, `CheckIcon`
- Lo propio del video nuevo va en `src/{{slug}}/`: composición, escenas,
  componentes y guion
- Registrá la `<Composition>` en `src/Root.tsx`, dentro de su `<Folder>`
- Agregá el script `render:{{slug}}` en `package.json`

Si algo que ya existe te sirve pero está atado a un video, extraelo a la carpeta
compartida en vez de copiarlo.

## Metodología

### Línea de tiempo

- Declarar los tiempos en SEGUNDOS y convertirlos con el `fps` real de
  `useVideoConfig()`. Nunca frames hardcodeados dentro de los componentes: el
  video tiene que seguir siendo correcto si se renderiza a 60fps.
- Cada `<Sequence>` lleva `durationInFrames` — si falta, la escena queda montada
  hasta el final del video y se pisa con la siguiente — y un `name` legible para
  la timeline del Studio.
- Cross-fade sin mover el guion: `getSceneTiming(scene, fps, {overlapsNextScene:
  true})` extiende la Sequence más allá de su ventana para que conviva con la
  entrante, que igual arranca en su segundo exacto. La última escena usa
  `overlapsNextScene: false` para que el fundido final entre en la duración total.
- `premountFor` en las escenas pesadas, para que el primer frame visible no
  tenga flicker de layout ni de fuentes.
- Lo que da continuidad visual (fondo) se monta FUERA de las Sequences: así no
  se desmonta nunca y los cortes se leen como transiciones.

### Animación

- Todo se deriva de `useCurrentFrame()`. Prohibido `setInterval`, `setTimeout`,
  `useState` para animar, animaciones CSS y `<animate>` de SVG: se desincronizan
  del frame que se está renderizando y rompen el scrubbing hacia atrás y el
  render distribuido.
- `interpolate` siempre con `extrapolateLeft` y `extrapolateRight` en `'clamp'`.
- `spring` siempre recibe el `fps` de la composición.
- Nada de `Math.random()`: si hace falta azar, `random()` de Remotion con seed.
- Los bucles continuos se derivan del resto de `frame` sobre un período fijo.
- El contenido de una escena que entra por cross-fade tiene que esperar a que
  termine el encadenado, o se dibuja encima de la escena que todavía se ve.

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

- El guion vive en UN solo archivo `src/{{slug}}/narration.json`, con
  `{id, startInSeconds, endInSeconds, text}` por locución. De ahí salen las tres
  cosas: los mp3, los `<Audio>` y los subtítulos. Nunca duplicar el texto.
- Un `<Audio>` por locución, cada uno en su `<Sequence from={...}>`, en vez de un
  mp3 largo: así regenerar una línea suelta —o cambiar de voz— no desincroniza
  al resto.
- Generar con `scripts/generate-voiceover.mjs`. Por defecto Piper neuronal
  offline; `--speed` ajusta el ritmo.
- El generador DEBE validar que cada locución entre en su ventana y fallar
  diciendo cuál se pasa. Es lo único que puede desincronizar el video.
- Dejar aire: apuntar a llenar ~80% de cada ventana, no al ras. VITS usa un
  predictor de duración estocástico y la misma frase varía ~5% entre corridas.
- Los subtítulos se montan fuera de las Sequences (usan el frame global) y las
  escenas reservan el espacio de abajo para no pisarlos.
- Escribir el texto para el ritmo real de la voz: medí las duraciones, no las
  estimes. Cambiar de proveedor cambia el ritmo y puede romper las ventanas.

## Definición de terminado

No lo des por terminado sin haber CORRIDO —y mirado— esto:

1. `npm run typecheck` limpio.
2. `npx remotion bundle` sin errores. Valida la cadena Webpack + Tailwind, que
   el typecheck no cubre.
3. Un still renderizado POR ESCENA, y abrirlo. Corregir lo que se vea mal antes
   de entregar, no después.
4. Un still en cada transición, para confirmar que encadena y no hay un bajón a
   negro entre escenas.
5. Render completo y duración verificada con `ffprobe`: tiene que dar los
   {{DURACIÓN}}s exactos.
6. Con voz: `silencedetect` sobre el render final, para confirmar que cada
   locución cae en su ventana.
7. Si tocaste código compartido, re-renderizar un frame de los videos que ya
   existían para descartar regresiones.

## Entregables

- Código commiteado en la rama de trabajo, con un mensaje que explique las
  decisiones —no sólo qué archivos cambiaron.
- El mp4 renderizado.
- Un resumen corto de: qué decidiste y por qué, qué verificaste, y **qué no
  pudiste verificar**. Si algo quedó sin probar —una API sin credenciales, el
  ritmo de una voz que no podés escuchar, una fuente que el entorno no baja—
  decilo explícitamente en vez de darlo por bueno.

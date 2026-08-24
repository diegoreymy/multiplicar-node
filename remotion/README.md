# Video de documentación · Webhook de Mercado Pago

Video técnico de **15 segundos exactos** (1920×1080 @ 30fps) hecho con
[Remotion](https://remotion.dev) + TailwindCSS v4.

## Cómo verlo

```bash
cd remotion
npm install
npm run dev      # abre el Remotion Studio en http://localhost:3000
```

En el Studio se puede hacer scrubbing por la timeline, ver cada `<Sequence>`
etiquetada y editar en vivo los textos/payload desde el panel de props.

Renderizar el MP4:

```bash
npm run render   # → out/mercadopago-webhook.mp4
npm run still    # → out/frame.png (un frame suelto, útil para thumbnails)
npm run typecheck
```

## Guion

| Escena | Tiempo | Contenido |
| --- | --- | --- |
| `01 · Título` | 0s → 3s | "Flujo de Webhook: Pago Aprobado" sobre fondo oscuro |
| `02 · Terminal · payload` | 3s → 11s | Terminal simulada tipeando el payload JSON con `status: "approved"` |
| `03 · Cierre QA` | 11s → 15s | "Documentado para el equipo de QA" + check animado |

## Estructura

```
src/
├── index.ts                      registerRoot()
├── Root.tsx                      <Composition> (id: MercadoPagoWebhook)
├── MercadoPagoWebhookVideo.tsx   las tres <Sequence>
├── styles.css                    Tailwind v4 + tokens de color (@theme)
├── lib/
│   ├── timing.ts                 línea de tiempo en segundos → frames
│   ├── fonts.ts                  Inter + JetBrains Mono vía @remotion/google-fonts
│   ├── payload.ts                el JSON que se tipea (editable por props)
│   └── tokenize.ts               coloreado de JSON + recorte por caracteres
├── components/
│   ├── Backdrop.tsx              fondo continuo (fuera de las Sequences)
│   ├── SceneTransition.tsx       entrada/salida reutilizable
│   ├── TerminalWindow.tsx        cromo de la ventana
│   ├── TypewriterCode.tsx        efecto máquina de escribir
│   └── CheckIcon.tsx             check SVG que se dibuja solo
└── scenes/
    ├── TitleScene.tsx
    ├── TerminalScene.tsx
    └── OutroScene.tsx
```

## Buenas prácticas aplicadas

- **Todo se deriva del frame.** Ni `setInterval`, ni `useState`, ni animaciones
  CSS: la cantidad de caracteres tipeados, el parpadeo del cursor y el trazo
  del check son funciones puras de `useCurrentFrame()`. Así el scrubbing hacia
  atrás y el render distribuido dan siempre el mismo resultado.
- **Tiempos en segundos, no en frames.** `lib/timing.ts` es la única fuente de
  verdad y convierte con el `fps` real de `useVideoConfig()`; el video no se
  rompe si se pasa a 60fps.
- **`durationInFrames` en cada `<Sequence>`** (si falta, la escena queda montada
  hasta el final del video) y `name` para que la timeline del Studio sea legible.
- **Cross-fade sin mover el guion.** Las dos primeras Sequences se extienden
  0,5s más allá de su ventana para encadenarse con la siguiente; la escena
  entrante arranca igual en su segundo exacto.
- **`premountFor`** en las escenas pesadas: se montan antes de entrar, así el
  primer frame visible no tiene flicker de layout.
- **Tailwind para lo estático, `style` para lo animado.** Tailwind no puede
  generar clases que cambian frame a frame, y las clases dinámicas no las
  detecta en build.
- **Sin reflow durante el tipeo.** Todas las líneas se montan con altura fija y
  sólo cambia el texto visible.
- **Fuentes con `@remotion/google-fonts`**, que maneja `delayRender()` solo y
  evita capturar frames con la fuente sin cargar.
- **`interpolate` siempre con `extrapolateLeft/Right: 'clamp'`** y `spring()`
  recibiendo el `fps` de la composición.
- **Props tipadas y serializables** en `defaultProps`: editables en el Studio y
  sobreescribibles en el render con `--props`.

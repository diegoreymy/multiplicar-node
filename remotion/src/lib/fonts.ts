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

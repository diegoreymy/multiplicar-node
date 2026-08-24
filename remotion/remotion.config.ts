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

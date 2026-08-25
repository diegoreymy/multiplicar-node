/**
 * Genera los archivos de voz de la narración a partir de src/kafka/narration.json.
 *
 *   node scripts/generate-voiceover.mjs                   # Piper neuronal, offline (default)
 *   node scripts/generate-voiceover.mjs --provider=espeak      # robótico, sin descargas
 *   node scripts/generate-voiceover.mjs --provider=elevenlabs
 *   node scripts/generate-voiceover.mjs --provider=openai
 *   node scripts/generate-voiceover.mjs --speed=0.95           # sólo Piper: <1 más lento (default 0.85)
 *
 * Escribe public/voz/kafka/<id>.mp3 y avisa si alguna locución no entra en su
 * ventana del guion — que es lo único que puede desincronizar el video.
 */
import {execFileSync, spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'public', 'voz', 'kafka');
const TMP_DIR = join(ROOT, 'node_modules', '.voiceover-tmp');

const arg = (name, fallback) => {
  const found = process.argv.find((a) => a.startsWith(`--${name}=`));
  return found ? found.split('=')[1] : fallback;
};

const provider = arg('provider', 'piper');
const speed = Number(arg('speed', '0.85'));
const segments = JSON.parse(
  readFileSync(join(ROOT, 'src', 'kafka', 'narration.json'), 'utf-8'),
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
        `src/kafka/narration.json o bajá la velocidad, y volvé a correr.`,
    );
    process.exit(1);
  }

  console.log('\nListo. Los archivos quedaron en public/voz/kafka/');
};

await main();

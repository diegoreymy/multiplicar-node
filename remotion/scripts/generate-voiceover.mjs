/**
 * Genera los archivos de voz de la narración a partir de src/kafka/narration.json.
 *
 *   node scripts/generate-voiceover.mjs                   # eSpeak offline (voz guía)
 *   node scripts/generate-voiceover.mjs --provider=elevenlabs
 *   node scripts/generate-voiceover.mjs --provider=openai
 *
 * Escribe public/voz/kafka/<id>.mp3 y avisa si alguna locución no entra en su
 * ventana del guion — que es lo único que puede desincronizar el video.
 */
import {execFileSync, spawnSync} from 'node:child_process';
import {mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
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

const provider = arg('provider', 'espeak');
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

    if (provider === 'espeak') {
      // eSpeak devuelve WAV, así que hay un paso de conversión.
      const wavPath = join(TMP_DIR, `${segment.id}.wav`);
      writeFileSync(wavPath, speakWithEspeak(segment.text));
      toMp3(wavPath, outputPath);
    } else {
      const speak =
        provider === 'elevenlabs' ? speakWithElevenLabs : speakWithOpenAi;
      writeFileSync(outputPath, await speak(segment.text));
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

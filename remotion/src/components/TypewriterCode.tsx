import React, {useMemo} from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {MONO_FONT_FAMILY} from '../lib/fonts';
import {TOKEN_CLASS_NAMES, type TerminalLine} from '../lib/payload';
import {sliceTokens, tokenizeJson, type Token} from '../lib/tokenize';

type TypewriterCodeProps = {
  readonly lines: TerminalLine[];
  /** Frame (relativo a la escena) en el que empieza a escribirse. */
  readonly startFrame: number;
  /** Frames disponibles para escribir TODO el bloque. */
  readonly revealDurationInFrames: number;
};

/** "Coste" extra por salto de línea: genera una micro-pausa natural. */
const NEWLINE_COST = 2;

const buildTokens = (line: TerminalLine): Token[] => {
  if (line.kind === 'json') {
    return tokenizeJson(line.text);
  }

  if (line.kind === 'prompt') {
    return [{text: line.text, kind: 'prompt'}];
  }

  return [{text: line.text, kind: 'comment'}];
};

/**
 * Efecto máquina de escribir determinista.
 *
 * Nada de setInterval / useState / requestAnimationFrame: la cantidad de
 * caracteres visibles se DERIVA del frame actual. Eso garantiza que el
 * frame 200 se vea igual en el Studio, en el render y si se hace scrubbing
 * hacia atrás en la línea de tiempo.
 *
 * Todas las líneas se montan siempre (con altura fija) y sólo cambia el
 * texto visible, así el bloque no reflowea mientras escribe.
 */
export const TypewriterCode: React.FC<TypewriterCodeProps> = ({
  lines,
  startFrame,
  revealDurationInFrames,
}) => {
  const frame = useCurrentFrame();

  // El tokenizado no depende del frame: memorizarlo evita rehacerlo 240 veces.
  const tokenizedLines = useMemo(() => lines.map(buildTokens), [lines]);

  const lineCosts = useMemo(
    () => lines.map((line) => line.text.length + NEWLINE_COST),
    [lines],
  );

  const totalChars = useMemo(
    () => lineCosts.reduce((total, cost) => total + cost, 0),
    [lineCosts],
  );

  const visibleChars = Math.round(
    interpolate(
      frame,
      [startFrame, startFrame + revealDurationInFrames],
      [0, totalChars],
      {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
    ),
  );

  // Parpadeo del cursor derivado del frame (2 parpadeos por segundo a 30fps).
  const cursorVisible = Math.floor(frame / 15) % 2 === 0;

  let consumed = 0;

  return (
    <pre
      className="text-[27px] leading-[44px] tracking-tight"
      style={{fontFamily: MONO_FONT_FAMILY}}
    >
      {lines.map((line, index) => {
        const offset = consumed;
        consumed += lineCosts[index];

        const charsForLine = Math.min(
          Math.max(visibleChars - offset, 0),
          line.text.length,
        );
        const isTyping =
          visibleChars > offset && visibleChars < offset + lineCosts[index];
        const visibleTokens = sliceTokens(tokenizedLines[index], charsForLine);

        return (
          <div key={index} className="flex h-[44px] items-center">
            {line.kind === 'prompt' && charsForLine > 0 ? (
              <span className="mr-3 text-mp-mint">$</span>
            ) : null}

            {visibleTokens.map((token, tokenIndex) => (
              <span
                key={tokenIndex}
                className={TOKEN_CLASS_NAMES[token.kind]}
                style={
                  token.kind === 'highlight'
                    ? {textShadow: '0 0 22px rgba(52,211,153,0.55)'}
                    : undefined
                }
              >
                {token.text}
              </span>
            ))}

            {isTyping && cursorVisible ? (
              <span className="ml-0.5 inline-block h-[26px] w-[13px] bg-mp-blue-soft align-middle" />
            ) : null}
          </div>
        );
      })}
    </pre>
  );
};

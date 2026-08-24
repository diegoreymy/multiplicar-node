/**
 * Tokenizador mínimo para colorear el payload JSON.
 *
 * Es una función pura y determinista: dada la misma línea devuelve siempre
 * los mismos tokens. Eso importa en Remotion, porque cada frame se puede
 * renderizar en un worker distinto y todo debe ser reproducible.
 */

export type TokenKind =
  | 'key'
  | 'string'
  | 'number'
  | 'literal'
  | 'punctuation'
  | 'prompt'
  | 'comment'
  | 'highlight';

export type Token = {
  readonly text: string;
  readonly kind: TokenKind;
};

const JSON_PATTERN =
  /("(?:[^"\\]|\\.)*")(\s*:)|("(?:[^"\\]|\\.)*")|(-?\d+(?:\.\d+)?)|(true|false|null)/g;

/** Valores que queremos resaltar (el estado que documenta el video). */
const HIGHLIGHTED_VALUES = new Set(['"approved"', '"accredited"']);

export const tokenizeJson = (line: string): Token[] => {
  const tokens: Token[] = [];
  let lastIndex = 0;

  // `matchAll` crea su propio iterador, así evitamos el estado mutable de
  // `lastIndex` que tiene una regex global compartida entre llamadas.
  for (const match of line.matchAll(JSON_PATTERN)) {
    const index = match.index ?? 0;

    if (index > lastIndex) {
      tokens.push({text: line.slice(lastIndex, index), kind: 'punctuation'});
    }

    const [full, keyName, colon, stringValue, numberValue, literalValue] = match;

    if (keyName) {
      tokens.push({text: keyName, kind: 'key'});
      tokens.push({text: colon, kind: 'punctuation'});
    } else if (stringValue) {
      tokens.push({
        text: stringValue,
        kind: HIGHLIGHTED_VALUES.has(stringValue) ? 'highlight' : 'string',
      });
    } else if (numberValue) {
      tokens.push({text: numberValue, kind: 'number'});
    } else if (literalValue) {
      tokens.push({text: literalValue, kind: 'literal'});
    }

    lastIndex = index + full.length;
  }

  if (lastIndex < line.length) {
    tokens.push({text: line.slice(lastIndex), kind: 'punctuation'});
  }

  return tokens;
};

/**
 * Recorta una lista de tokens a los primeros `visibleChars` caracteres.
 * Es el corazón del efecto máquina de escribir: no mutamos nada ni usamos
 * estado, sólo derivamos el corte a partir del frame actual.
 */
export const sliceTokens = (tokens: Token[], visibleChars: number): Token[] => {
  if (visibleChars <= 0) {
    return [];
  }

  const visible: Token[] = [];
  let remaining = visibleChars;

  for (const token of tokens) {
    if (remaining <= 0) {
      break;
    }

    if (token.text.length <= remaining) {
      visible.push(token);
      remaining -= token.text.length;
    } else {
      visible.push({text: token.text.slice(0, remaining), kind: token.kind});
      remaining = 0;
    }
  }

  return visible;
};

import type {TokenKind} from './tokenize';

export type TerminalLine = {
  /**
   * `prompt`  → el comando que escribe la persona.
   * `meta`    → salida del proceso (no se colorea como JSON).
   * `json`    → línea del payload, pasa por el tokenizador.
   * `spacer`  → línea vacía, se "escribe" instantáneamente.
   */
  readonly kind: 'prompt' | 'meta' | 'json' | 'spacer';
  readonly text: string;
};

/**
 * Payload de respuesta del webhook de Mercado Pago (versión reducida para
 * documentación). Va en `defaultProps` de la composición, así que se puede
 * editar en vivo desde el panel de props del Remotion Studio.
 */
export const DEFAULT_PAYLOAD_LINES: TerminalLine[] = [
  {kind: 'prompt', text: 'curl -s $MP_WEBHOOK_URL/payments/1327908543'},
  {kind: 'meta', text: 'HTTP/1.1 200 OK'},
  {kind: 'spacer', text: ''},
  {kind: 'json', text: '{'},
  {kind: 'json', text: '  "action": "payment.updated",'},
  {kind: 'json', text: '  "type": "payment",'},
  {kind: 'json', text: '  "data": {'},
  {kind: 'json', text: '    "id": "1327908543",'},
  {kind: 'json', text: '    "status": "approved",'},
  {kind: 'json', text: '    "transaction_amount": 4990'},
  {kind: 'json', text: '  }'},
  {kind: 'json', text: '}'},
];

/** Clases de Tailwind por tipo de token (estáticas, nunca interpoladas). */
export const TOKEN_CLASS_NAMES: Record<TokenKind, string> = {
  key: 'text-mp-blue-soft',
  string: 'text-mp-mint/80',
  number: 'text-mp-amber',
  literal: 'text-mp-violet',
  punctuation: 'text-mp-slate',
  prompt: 'text-mp-cloud',
  comment: 'text-mp-slate',
  highlight: 'text-mp-mint font-bold',
};

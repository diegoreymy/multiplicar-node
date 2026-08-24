import React from 'react';
import {SANS_FONT_FAMILY} from '../../lib/fonts';

type TerminalWindowProps = {
  readonly title: string;
  /** Progreso 0→1 de la apertura de la ventana (lo controla la escena). */
  readonly openProgress: number;
  readonly children: React.ReactNode;
};

const TRAFFIC_LIGHTS = [
  {className: 'bg-[#ff5f57]'},
  {className: 'bg-[#febc2e]'},
  {className: 'bg-[#28c840]'},
] as const;

/**
 * Cromo de una ventana de terminal. Es puramente presentacional:
 * no lee el frame, recibe el progreso ya calculado. Así se puede reutilizar
 * en otra escena (o en un <Still>) sin arrastrar dependencias de tiempo.
 */
export const TerminalWindow: React.FC<TerminalWindowProps> = ({
  title,
  openProgress,
  children,
}) => {
  return (
    <div
      className="w-[1180px] overflow-hidden rounded-2xl border border-ui-line bg-ui-panel/95"
      style={{
        transform: `scale(${0.94 + 0.06 * openProgress})`,
        opacity: openProgress,
        boxShadow:
          '0 60px 120px -30px rgba(0,0,0,0.85), 0 0 0 1px rgba(0,158,227,0.14), 0 0 90px -40px rgba(0,158,227,0.55)',
      }}
    >
      <div className="flex items-center gap-4 border-b border-ui-line bg-ui-ink-soft/90 px-6 py-4">
        <div className="flex gap-2.5">
          {TRAFFIC_LIGHTS.map((light, index) => (
            <span
              key={index}
              className={`h-3.5 w-3.5 rounded-full ${light.className}`}
            />
          ))}
        </div>

        <span
          className="flex-1 text-center text-[19px] font-semibold tracking-wide text-ui-slate"
          style={{fontFamily: SANS_FONT_FAMILY}}
        >
          {title}
        </span>

        {/* Espaciador del mismo ancho que los semáforos: mantiene el título
            centrado sin usar position:absolute. */}
        <div className="w-[62px]" />
      </div>

      <div className="px-10 py-8">{children}</div>
    </div>
  );
};

import React from 'react';
import {Audio, Sequence, staticFile, useVideoConfig} from 'remotion';
import {secondsToFrames} from '../../lib/timing';
import {NARRATION, narrationSrc} from '../script';

/**
 * Monta la voz en off: un <Audio> por segmento, cada uno dentro de su
 * <Sequence>.
 *
 * Por qué en piezas y no un mp3 largo: cada locución queda anclada al
 * segundo que dice el guion, así que regenerar una sola línea (o cambiar de
 * proveedor de TTS) no desincroniza al resto. Remotion además sabe recortar
 * y mezclar cada pista sin que haya que tocar offsets a mano.
 */
export const Narration: React.FC = () => {
  const {fps} = useVideoConfig();

  return (
    <>
      {NARRATION.map((segment) => (
        <Sequence
          key={segment.id}
          name={`voz · ${segment.id}`}
          from={secondsToFrames(segment.startInSeconds, fps)}
        >
          <Audio src={staticFile(narrationSrc(segment))} />
        </Sequence>
      ))}
    </>
  );
};

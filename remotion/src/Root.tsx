import React from 'react';
import {Composition, Folder} from 'remotion';
import './styles.css';
import {FPS, VIDEO_HEIGHT, VIDEO_WIDTH} from './lib/timing';
import {
  DEFAULT_KAFKA_PROPS,
  DURATION_IN_FRAMES as KAFKA_DURATION,
  KafkaIntroVideo,
} from './kafka/KafkaIntroVideo';
import {
  DEFAULT_VIDEO_PROPS,
  DURATION_IN_FRAMES as MP_DURATION,
  MercadoPagoWebhookVideo,
} from './mercadopago/MercadoPagoWebhookVideo';

/**
 * Las <Composition> declaran los videos disponibles. Comparten fps y tamaño
 * (lib/timing.ts) pero cada una trae su propia duración y sus defaultProps.
 * Los <Folder> son sólo organización para la barra lateral del Studio.
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Kafka">
        <Composition
          id="KafkaIntro"
          component={KafkaIntroVideo}
          durationInFrames={KAFKA_DURATION}
          fps={FPS}
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
          defaultProps={DEFAULT_KAFKA_PROPS}
        />
      </Folder>

      <Folder name="MercadoPago">
        <Composition
          id="MercadoPagoWebhook"
          component={MercadoPagoWebhookVideo}
          durationInFrames={MP_DURATION}
          fps={FPS}
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
          defaultProps={DEFAULT_VIDEO_PROPS}
        />
      </Folder>
    </>
  );
};

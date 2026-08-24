import React from 'react';
import {Composition} from 'remotion';
import './styles.css';
import {
  DEFAULT_VIDEO_PROPS,
  MercadoPagoWebhookVideo,
} from './MercadoPagoWebhookVideo';
import {
  DURATION_IN_FRAMES,
  FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from './lib/timing';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="MercadoPagoWebhook"
      component={MercadoPagoWebhookVideo}
      durationInFrames={DURATION_IN_FRAMES}
      fps={FPS}
      width={VIDEO_WIDTH}
      height={VIDEO_HEIGHT}
      defaultProps={DEFAULT_VIDEO_PROPS}
    />
  );
};

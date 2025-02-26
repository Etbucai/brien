import { Effect } from 'effect';
import { CanvasService, CanvasServiceConfig, make as makeCanvasService } from './context/canvas';
import { renderFps } from './widgets/fps';
import { makeTheme, Theme } from './context/theme';

function updateFrame(canvas: CanvasRenderingContext2D, canvasConfig: CanvasServiceConfig) {
  return Effect.succeedNone.pipe(
    Effect.andThen(() => {
      canvas.clearRect(0, 0, canvasConfig.width, canvasConfig.height);
    }),
    Effect.andThen(renderFps),
    Effect.provideService(CanvasService, makeCanvasService(canvas, canvasConfig)),
    Effect.provideService(Theme, makeTheme({ text: { fontFamily: 'PingFangHK', fontSize: 18 } })),
  );
}

export function getFrameUpdater(canvas: CanvasRenderingContext2D, canvasConfig: CanvasServiceConfig) {
  return () => Effect.runSync(updateFrame(canvas, canvasConfig));
}

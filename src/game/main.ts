import { Context, Effect, Ref } from 'effect';
import { CanvasService, CanvasServiceConfig, make as makeCanvasService } from './context/canvas';
import { FpsState, IFpsState, renderFps } from './widgets/fps';
import { makeTheme, Theme } from './context/theme';
import { Time } from './context/time';

type StaticService = CanvasService | Theme | FpsState;

export class Game {
  static create(canvas: CanvasRenderingContext2D, canvasConfig: CanvasServiceConfig) {
    return Effect.gen(function* () {
      const fpsState = yield* Ref.make<IFpsState>({
        frameCount: 0,
        lastFlushTime: Date.now(),
        lastFps: 0,
      });
      const staticContext = Context.empty().pipe(
        Context.add(CanvasService, makeCanvasService(canvas, canvasConfig)),
        Context.add(Theme, makeTheme({ text: { fontFamily: 'PingFangHK', fontSize: 16 } })),
        Context.add(FpsState, fpsState),
      );

      return new Game(canvas, canvasConfig, staticContext);
    });
  }

  constructor(
    readonly canvas: CanvasRenderingContext2D,
    readonly canvasConfig: CanvasServiceConfig,
    readonly staticContext: Context.Context<StaticService>,
  ) {}

  private updateFrame() {
    const { canvas, canvasConfig } = this;
    return Effect.sync(() => {
      canvas.clearRect(0, 0, canvasConfig.width, canvasConfig.height);
    }).pipe(
      //
      Effect.andThen(renderFps),
      Effect.provideService(Time, { timestamp: Date.now() }),
    );
  }

  private rafId = -1;

  start() {
    const loopFn = () => {
      Effect.runSync(
        this.updateFrame().pipe(
          //
          Effect.provide(this.staticContext),
        ),
      );
      this.rafId = requestAnimationFrame(loopFn);
    };

    loopFn();
  }

  pause() {
    cancelAnimationFrame(this.rafId);
    this.rafId = -1;
  }
}

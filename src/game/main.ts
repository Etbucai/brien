import { Context, Effect, Ref } from 'effect';
import { CanvasContext, ICanvas } from './context/canvas';
import { ThemeContext } from './context/theme';
import { TimeContext } from './context/time';
import { FpsContext, FpsState } from './context/fps';
import { renderFps } from './widgets/fps';

type StaticService = CanvasContext | ThemeContext | FpsContext;

export interface IGame {
  canvas: ICanvas;
  staticContext: Context.Context<StaticService>;
  rafId: Ref.Ref<number>;
}

export const createGame = (canvas: ICanvas) =>
  Effect.gen(function* () {
    const fpsState = yield* Ref.make<FpsState>({
      frameCount: 0,
      lastFlushTime: Date.now(),
      lastFps: 0,
    });

    const rafId = yield* Ref.make(-1);

    const staticContext = Context.empty().pipe(
      Context.add(CanvasContext, canvas),
      Context.add(ThemeContext, { text: { fontFamily: 'PingFangHK', fontSize: 16 } }),
      Context.add(FpsContext, fpsState),
    );

    const game: IGame = { canvas, staticContext, rafId };
    return game;
  });

const updateFrame = ({ canvas }: IGame) =>
  Effect.sync(() => {
    canvas.context.clearRect(0, 0, canvas.width, canvas.height);
  }).pipe(
    //
    Effect.andThen(renderFps),
    Effect.provideService(TimeContext, { timestamp: Date.now() }),
  );

export const startGame = (game: IGame) => {
  const loopFn = () => {
    Effect.runSync(
      updateFrame(game).pipe(
        Effect.andThen(Ref.set(game.rafId, requestAnimationFrame(loopFn))),
        Effect.provide(game.staticContext),
      ),
    );
  };

  loopFn();
};

export const pauseGame = (game: IGame) =>
  Effect.runSync(
    Ref.update(game.rafId, rafId => {
      cancelAnimationFrame(rafId);
      return -1;
    }),
  );

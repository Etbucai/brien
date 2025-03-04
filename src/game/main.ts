import { Context, Effect, Ref, Schedule } from 'effect';
import { CanvasContext, ICanvas } from './context/canvas';
import { ThemeContext } from './context/theme';
import { TimeContext } from './context/time';
import { FpsContext, FpsState } from './context/fps';
import { renderFps } from './widgets/fps';

type StaticContext = CanvasContext | ThemeContext | FpsContext;

export interface IGame {
  canvas: ICanvas;
  staticContext: Context.Context<StaticContext>;
}

export const createGame = (canvas: ICanvas) =>
  Effect.gen(function* () {
    const fpsState = yield* Ref.make<FpsState>({
      frameCount: 0,
      lastFlushTime: Date.now(),
      lastFps: 0,
    });

    const staticContext = Context.empty().pipe(
      Context.add(CanvasContext, canvas),
      Context.add(ThemeContext, { text: { fontFamily: 'PingFangHK', fontSize: 16 } }),
      Context.add(FpsContext, fpsState),
    );

    const game: IGame = { canvas, staticContext };
    return game;
  });

const updateFrame = ({ canvas }: IGame) =>
  Effect.gen(function* () {
    canvas.context.clearRect(0, 0, canvas.width, canvas.height);
    yield* renderFps();
  }).pipe(
    Effect.provideServiceEffect(
      TimeContext,
      Effect.sync(() => ({ timestamp: Date.now() })),
    ),
  );

const nextAnimationFrame = () =>
  Effect.async(resume => {
    requestAnimationFrame(() => resume(Effect.succeedNone));
  });

export const startGame = (game: IGame) =>
  updateFrame(game).pipe(
    Effect.andThen(nextAnimationFrame()),
    Effect.repeat(Schedule.forever),
    Effect.provide(game.staticContext),
  );

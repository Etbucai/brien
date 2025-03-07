import { Context, Effect, Ref, Schedule } from 'effect';
import { CanvasContext, ICanvas } from './context/canvas';
import { ThemeContext } from './context/theme';
import { TimeContext } from './context/time';
import { FpsContext, FpsState } from './context/fps';
// import { renderFps } from './widgets/fps';
import {
  ChipConfigContext,
  ChipMatrixContext,
  generateChipMatrix,
  renderChipMatrix
} from './widgets/chip';

type StaticContext =
  | CanvasContext
  | ThemeContext
  | FpsContext
  | ChipConfigContext
  | ChipMatrixContext;

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

    const chipMatrix = yield* generateChipMatrix({ columnCount: 10, rowCount: 10 });

    const staticContext = Context.empty().pipe(
      Context.add(CanvasContext, canvas),
      Context.add(ThemeContext, { text: { fontFamily: 'PingFangHK', fontSize: 16 } }),
      Context.add(FpsContext, fpsState),
      Context.add(ChipConfigContext, { backgroundColor: 'gray', gap: 6, size: 16 }),
      Context.add(ChipMatrixContext, chipMatrix),
    );

    const game: IGame = { canvas, staticContext };
    return game;
  });

const updateFrame = ({ canvas }: IGame) =>
  Effect.gen(function* () {
    canvas.context.clearRect(0, 0, canvas.width, canvas.height);
    // yield* renderFps();
    yield* renderChipMatrix();
  }).pipe(
    Effect.provideServiceEffect(
      TimeContext,
      Effect.sync(() => ({ timestamp: Date.now() })),
    ),
  );

const nextAnimationFrame = (): Effect.Effect<void> =>
  Effect.async(resume => {
    requestAnimationFrame(() => resume(Effect.succeedNone));
  });

export const startGame = (game: IGame) =>
  updateFrame(game).pipe(
    Effect.andThen(nextAnimationFrame()),
    Effect.repeat(Schedule.forever),
    Effect.provide(game.staticContext),
  );

type A = typeof startGame;
type B = ReturnType<A>;
type C = B extends Effect.Effect<unknown, unknown, infer R> ? R : never;
const n = 1 as unknown as C;
export const $internalCheck: never = n;

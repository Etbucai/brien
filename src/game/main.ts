import { Context, Effect, Random, Ref, Schedule, Stream } from 'effect';
import { CanvasContext, ICanvas } from './context/canvas';
import { ThemeContext } from './context/theme';
import { TimeContext } from './context/time';
import { FpsContext, FpsState } from './context/fps';
// import { renderFps } from './widgets/fps';
import { handleClickEvent } from './click';
import { ChipConfig, ChipConfigContext } from './widgets/chip/config';
import { ChipMatrixContext, makeChipMatrixState, renderChipMatrix } from './widgets/chip/matrix';
import { ChipManager, ChipManagerContext } from './widgets/chip/manager';

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

type EnsureClearRequirement<T> = T extends (...args: never[]) => unknown
  ? ReturnType<T> extends Effect.Effect<unknown, unknown, infer R>
    ? [R] extends [never]
      ? true
      : [R]
    : false
  : false;

export const createGame = (canvas: ICanvas, clickStream: Stream.Stream<MouseEvent>) =>
  Effect.gen(function* () {
    const fpsState = yield* Ref.make<FpsState>({
      frameCount: 0,
      lastFlushTime: Date.now(),
      lastFps: 0,
    });

    const chipConfig: ChipConfig = {
      backgroundColor: 'gray',
      gap: 8,
      size: 20,
      columnCount: 10,
      rowCount: 10,
    };

    const chipManager: ChipManager = {
      nextChipId: yield* Ref.make(0),
    };

    const configContext = Context.empty().pipe(
      Context.add(CanvasContext, canvas),
      Context.add(ThemeContext, { text: { fontFamily: 'PingFangHK', fontSize: 16 } }),
      Context.add(FpsContext, fpsState),
      Context.add(ChipConfigContext, chipConfig),
      Context.add(Random.Random, Random.make('love')),
      Context.add(ChipManagerContext, chipManager),
    );

    const chipState = Context.make(
      ChipMatrixContext,
      yield* makeChipMatrixState().pipe(Effect.provide(configContext)),
    );

    const staticContext = configContext.pipe(Context.merge(chipState));

    Effect.runFork(
      clickStream.pipe(Stream.runForEach(handleClickEvent), Effect.provide(staticContext)),
    );

    const game: IGame = { canvas, staticContext };
    return game;
  });

export const CREATE_GAME_GUARD: EnsureClearRequirement<typeof createGame> = true;

const updateFrame = ({ canvas }: IGame) =>
  Effect.gen(function* () {
    canvas.context.clearRect(0, 0, canvas.width * canvas.scale, canvas.height * canvas.scale);
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

export const START_GAME_GUARD: EnsureClearRequirement<typeof startGame> = true;

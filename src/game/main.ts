import { Context, Effect, Option, Random, Ref, Schedule, Stream } from 'effect';
import { CanvasContext, ICanvas } from './context/canvas';
import { ThemeContext } from './context/theme';
import { TimeContext } from './context/time';
import { FpsContext, FpsState } from './context/fps';
// import { renderFps } from './widgets/fps';
import {
  ChipConfig,
  ChipConfigContext,
  ChipMatrixContext,
  ChipMatrixStateContext,
  generateChipMatrix,
  renderChipMatrix,
} from './widgets/chip';

type StaticContext =
  | CanvasContext
  | ThemeContext
  | FpsContext
  | ChipConfigContext
  | ChipMatrixContext
  | ChipMatrixStateContext;

export interface IGame {
  canvas: ICanvas;
  staticContext: Context.Context<StaticContext>;
}

const handleClickEvent = Effect.serviceFunctionEffect(
  Effect.all([CanvasContext, ChipConfigContext, ChipMatrixStateContext]),
  ([canvas, chipConfig, chipMatrixState]) =>
    (event: MouseEvent) =>
      Effect.gen(function* () {
        const { x, y } = event;
        const rect = canvas.context.canvas.getBoundingClientRect();
        const offsetX = x - rect.x;
        const offsetY = y - rect.y;
        const isXHit = offsetX % (chipConfig.gap + chipConfig.size) < chipConfig.size;
        const isYHit = offsetY % (chipConfig.gap + chipConfig.size) < chipConfig.size;
        if (isXHit && isYHit) {
          const targetColumnIndex = Math.ceil(offsetX / (chipConfig.gap + chipConfig.size)) - 1;
          const targetRowIndex = Math.ceil(offsetY / (chipConfig.gap + chipConfig.size)) - 1;
          const pos: [x: number, y: number] = [targetColumnIndex, targetRowIndex];
          yield* Ref.set(chipMatrixState.selected, Option.some(pos));
        } else {
          yield* Ref.set(chipMatrixState.selected, Option.none());
        }
      }),
);

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

    const selectedChip = yield* Ref.make(Option.none<[x: number, y: number]>());

    const chipState = Context.make(ChipMatrixStateContext, {
      selected: selectedChip,
    });

    const configContext = Context.empty().pipe(
      Context.add(CanvasContext, canvas),
      Context.add(ThemeContext, { text: { fontFamily: 'PingFangHK', fontSize: 16 } }),
      Context.add(FpsContext, fpsState),
      Context.add(ChipConfigContext, chipConfig),
      Context.add(Random.Random, Random.make('love')),
      Context.merge(chipState),
    );

    Effect.runFork(
      clickStream.pipe(Stream.runForEach(handleClickEvent), Effect.provide(configContext)),
    );

    const chipMatrix = yield* generateChipMatrix().pipe(Effect.provide(configContext));

    const staticContext = configContext.pipe(Context.add(ChipMatrixContext, chipMatrix));

    const game: IGame = { canvas, staticContext };
    return game;
  });

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

type A = typeof startGame;
type B = ReturnType<A>;
type C = B extends Effect.Effect<unknown, unknown, infer R> ? R : never;
const n = 1 as unknown as C;
export const $internalCheck: never = n;

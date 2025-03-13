import { Context, Effect, Option, Random, Ref, Array, HashMap, Order } from 'effect';
import { pipe } from 'effect/Function';
import { fillRect } from '@context/canvas';
import { TimeContext } from '@context/time';
import { Matrix } from '@utils/matrix';
import { emptyVec2, Vec2 } from '@utils/vec2';
import { chipMetaList, createChip } from './manager';
import { Chip } from './chip';
import { ChipConfigContext } from './config';

export type ChipMatrix = Matrix<Chip>;

export interface ChipTween {
  z: number;
  getOffset: Effect.Effect<Vec2, never, TimeContext>;
}

export interface ChipMatrixState {
  matrix: Ref.Ref<ChipMatrix>;
  selected: Ref.Ref<Option.Option<Vec2>>;
  tweenMap: Ref.Ref<HashMap.HashMap<number, ChipTween>>;
}

export class ChipMatrixContext extends Context.Tag('ChipMatrixContext')<
  ChipMatrixContext,
  ChipMatrixState
>() {}

export const makeChipMatrixState = () =>
  Effect.gen(function* () {
    const chipMatrix = yield* generateChipMatrix();
    const state: ChipMatrixState = {
      selected: yield* Ref.make(Option.none<Vec2>()),
      matrix: yield* Ref.make(chipMatrix),
      tweenMap: yield* Ref.make(HashMap.empty<number, ChipTween>()),
    };
    return state;
  });

const pureRandomChipMatrix = Effect.serviceFunctionEffect(
  Effect.all([ChipConfigContext, Random.Random]),
  ([chipConfig, random]) =>
    () => {
      const a = Array.makeBy(chipConfig.rowCount, () =>
        Array.makeBy(chipConfig.columnCount, () =>
          Effect.gen(function* () {
            const metaIdx = yield* random.nextIntBetween(0, chipMetaList.length);
            const meta = chipMetaList[metaIdx];
            const chip = yield* createChip(meta.type);
            return chip;
          }),
        ),
      );
      return Effect.all(a.map(it => Effect.all(it)));
    },
);

export const generateChipMatrix = Effect.serviceFunctionEffect(
  Random.Random,
  random => () =>
    Effect.gen(function* () {
      const s = yield* pureRandomChipMatrix();
      const b = s.map((row, rowIndex) =>
        row.map((chip, columnIndex) =>
          Effect.gen(function* () {
            const itemAt = (r: number, c: number) => s[r]?.[c];
            const top1 = itemAt(rowIndex - 1, columnIndex);
            const top2 = itemAt(rowIndex - 2, columnIndex);
            const left1 = itemAt(rowIndex, columnIndex - 1);
            const left2 = itemAt(rowIndex, columnIndex - 2);
            const blackList: string[] = [];
            const tryAddBlackList = (a: Chip | undefined, b: Chip | undefined) => {
              if (a && b && a.type === b.type) {
                blackList.push(a.type);
              }
            };
            tryAddBlackList(top1, top2);
            tryAddBlackList(left1, left2);

            if (blackList.every(type => type !== chip.type)) {
              return chip;
            }

            const metaList = chipMetaList.filter(it => !blackList.includes(it.type));
            const metaIndex = yield* random.nextIntBetween(0, metaList.length - 1);
            const meta = metaList[metaIndex];
            const newChip = yield* createChip(meta.type);
            return newChip;
          }),
        ),
      );
      const res = yield* Effect.all(b.map(it => Effect.all(it)));
      return res;
    }),
);

interface RenderChipOption {
  x: number;
  y: number;
  color: string;
  isSelected: boolean;
}

const renderChip = Effect.serviceFunctionEffect(
  ChipConfigContext,
  chipConfig =>
    ({ x, y, color, isSelected }: RenderChipOption) =>
      Effect.gen(function* () {
        if (isSelected) {
          yield* fillRect(x - 2, y - 2, chipConfig.size + 4, chipConfig.size + 4, 'yellow');
          yield* fillRect(x + 2, y + 2, chipConfig.size - 4, chipConfig.size - 4, color);
        } else {
          yield* fillRect(x, y, chipConfig.size, chipConfig.size, color);
        }
      }),
);

const iterateChip = <A, E, R>(
  f: (row: number, column: number, chip: Chip) => Effect.Effect<A, E, R>,
) =>
  Effect.gen(function* () {
    const chipMatrixState = yield* ChipMatrixContext;
    const matrix = yield* Ref.get(chipMatrixState.matrix);
    const resultEffectMatrix = matrix.map((row, rowIndex) =>
      row.map((chip, columnIndex) => f(rowIndex, columnIndex, chip)),
    );
    const resultMatrix = yield* Effect.all(resultEffectMatrix.map(it => Effect.all(it)));
    return resultMatrix;
  });

export const renderChipMatrix = () =>
  Effect.gen(function* () {
    const [chipConfig, chipMatrixState] = yield* Effect.all([ChipConfigContext, ChipMatrixContext]);
    const result = yield* iterateChip((row, column, chip) =>
      Effect.gen(function* () {
        const selectedPos = yield* Ref.get(chipMatrixState.selected);
        const isSelfSelected = selectedPos.pipe(
          Option.map(({ x, y }) => x === column && y === row),
          Option.getOrElse(() => false),
        );
        const tweenMap = yield* Ref.get(chipMatrixState.tweenMap);
        const tween = HashMap.get(tweenMap, chip.id);
        const r = tween.pipe(
          Option.map(it =>
            Effect.gen(function* () {
              return {
                z: it.z,
                offset: yield* it.getOffset,
              };
            }),
          ),
          Option.getOrElse(() => Effect.succeed({ z: 0, offset: emptyVec2() })),
        );
        const { z, offset } = yield* r;

        const render = renderChip({
          x: column * (chipConfig.size + chipConfig.gap) + offset.x,
          y: row * (chipConfig.size + chipConfig.gap) + offset.y,
          color: chip.color,
          isSelected: isSelfSelected,
        });
        return { render, z };
      }),
    );
    const renderEffects = pipe(
      result,
      Array.flatten,
      Array.sortBy(Order.mapInput(Order.number, it => it.z)),
      Array.map(it => it.render),
    );
    yield* Effect.all(renderEffects);
  });

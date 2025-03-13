import { Context, Effect, Option, Random, Ref, Array, HashMap } from 'effect';
import { Matrix } from '@utils/matrix';
import { emptyVec2, Vec2 } from '@utils/vec2';
import { fillRect } from '@context/canvas';
import { Chip } from './chip';
import { ChipConfigContext } from './config';
import { chipMetaList, createChip } from './manager';

export type ChipMatrix = Matrix<Chip>;

export interface ChipTween {
  offset: Vec2;
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

const iterateChip = Effect.serviceFunctionEffect(
  ChipMatrixContext,
  chipMatrixState =>
    <A, E, R>(f: (row: number, column: number, chip: Chip) => Effect.Effect<A, E, R>) =>
      Effect.gen(function* () {
        const matrix = yield* Ref.get(chipMatrixState.matrix);
        yield* Effect.forEach(matrix, (chipRow, row) =>
          Effect.forEach(chipRow, (chip, column) => f(row, column, chip)),
        );
      }),
);

export const renderChipMatrix = Effect.serviceFunctionEffect(
  Effect.all([ChipConfigContext, ChipMatrixContext]),
  ([chipConfig, chipMatrixState]) =>
    () =>
      iterateChip((row, column, chip) =>
        Effect.gen(function* () {
          const selectedPos = yield* Ref.get(chipMatrixState.selected);
          const isSelfSelected = selectedPos.pipe(
            Option.map(({ x, y }) => x === column && y === row),
            Option.getOrElse(() => false),
          );
          const tweenMap = yield* Ref.get(chipMatrixState.tweenMap);
          const offset = HashMap.get(tweenMap, chip.id).pipe(
            Option.map(it => it.offset),
            Option.getOrElse(emptyVec2),
          );
          
          yield* renderChip({
            x: column * (chipConfig.size + chipConfig.gap) + offset.x,
            y: row * (chipConfig.size + chipConfig.gap) + offset.y,
            color: chip.color,
            isSelected: isSelfSelected,
          });
        }),
      ),
);

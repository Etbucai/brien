import { Array, Context, Data, Effect, Option, Random, Ref } from 'effect';
import { fillRect } from '@context/canvas';

export interface Vec2 {
  x: number;
  y: number;
}

export const Vec2 = Data.case<Vec2>();

export interface ChipConfig {
  size: number;
  gap: number;
  backgroundColor: string;
  columnCount: number;
  rowCount: number;
}

export class ChipConfigContext extends Context.Tag('ChipConfigContext')<
  ChipConfigContext,
  ChipConfig
>() {}

export type Matrix<T> = T[][];

const getItem = <T>(matrix: Matrix<T>, pos: Vec2) =>
  Array.get(matrix, pos.y).pipe(Option.andThen(row => Array.get(row, pos.x)));

const setItem = <T>(matrix: Matrix<T>, pos: Vec2, item: T) => (matrix[pos.y][pos.x] = item);

export const Matrix = {
  getItem,
  setItem,
};

export interface Chip {
  id: number;
  type: string;
  color: string;
}

export type ChipMatrix = Matrix<Chip>;

interface ChipMeta {
  type: string;
  color: string;
}

const chipMetaList: ChipMeta[] = [
  { type: 'a', color: 'black' },
  { type: 'b', color: 'red' },
  { type: 'c', color: 'blue' },
  { type: 'd', color: 'white' },
];

export interface ChipManager {
  nextChipId: Ref.Ref<number>;
}

export class ChipManagerContext extends Context.Tag('ChipManagerContext')<
  ChipManagerContext,
  ChipManager
>() {}

export const createChip = Effect.serviceFunctionEffect(
  ChipManagerContext,
  chipManager => (type: string) =>
    Effect.gen(function* () {
      const meta = chipMetaList.find(it => it.type === type) || chipMetaList[0];
      const chipId = yield* Ref.getAndUpdate(chipManager.nextChipId, a => a + 1);
      const chip: Chip = {
        id: chipId,
        type: meta.type,
        color: meta.color,
      };
      return chip;
    }),
);

export interface ChipMatrixState {
  matrix: Ref.Ref<ChipMatrix>;
  selected: Ref.Ref<Option.Option<Vec2>>;
}

export class ChipMatrixContext extends Context.Tag('ChipMatrixContext')<
  ChipMatrixContext,
  ChipMatrixState
>() {}

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
          yield* renderChip({
            x: column * (chipConfig.size + chipConfig.gap),
            y: row * (chipConfig.size + chipConfig.gap),
            color: chip.color,
            isSelected: isSelfSelected,
          });
        }),
      ),
);

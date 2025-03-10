import { Array, Context, Effect, Option, Random, Ref } from 'effect';
import { fillRect } from '@context/canvas';

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

export interface Chip {
  type: string;
  color: string;
}

export type ChipMatrix = Matrix<Chip>;

export interface ChipMatrixState {
  selected: Ref.Ref<Option.Option<[x: number, y: number]>>;
}

export class ChipMatrixStateContext extends Context.Tag('ChipMatrixStateContext')<
  ChipMatrixStateContext,
  ChipMatrixState
>() {}

export class ChipMatrixContext extends Context.Tag('ChipMatrixContext')<
  ChipMatrixContext,
  ChipMatrix
>() {}

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

const pureRandomChipMatrix = Effect.serviceFunctionEffect(
  Effect.all([ChipConfigContext, Random.Random]),
  ([chipConfig, random]) =>
    (): Effect.Effect<ChipMatrix> => {
      const a = Array.makeBy(chipConfig.rowCount, () =>
        Array.makeBy(chipConfig.columnCount, () =>
          Effect.gen(function* () {
            const metaIdx = yield* random.nextIntBetween(0, chipMetaList.length);
            const meta = chipMetaList[metaIdx];
            const chip: Chip = {
              type: meta.type,
              color: meta.color,
            };
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
            const newChip: Chip = {
              type: meta.type,
              color: meta.color,
            };
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

export const renderChipMatrix = Effect.serviceFunctionEffect(
  Effect.all([ChipMatrixContext, ChipConfigContext, ChipMatrixStateContext]),
  ([chipMatrix, chipConfig, chipMatrixState]) =>
    () =>
      Effect.forEach(chipMatrix, (chipRow, row) =>
        Effect.forEach(chipRow, (chip, column) =>
          Effect.gen(function* () {
            const selectedPos = yield* Ref.get(chipMatrixState.selected);
            const isSelfSelected = selectedPos.pipe(
              Option.map(([x, y]) => x === column && y === row),
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
      ),
);

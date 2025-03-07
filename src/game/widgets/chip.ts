import { Array, Context, Effect, Random } from 'effect';
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

const renderChip = Effect.serviceFunctionEffect(
  ChipConfigContext,
  chipConfig => (x: number, y: number, fillStyle: string) =>
    fillRect(x, y, chipConfig.size, chipConfig.size, fillStyle),
);

export const renderChipMatrix = Effect.serviceFunctionEffect(
  Effect.all([ChipMatrixContext, ChipConfigContext]),
  ([chipMatrix, chipConfig]) =>
    () =>
      Effect.forEach(chipMatrix, (chipRow, row) =>
        Effect.forEach(chipRow, (chip, column) =>
          renderChip(
            column * (chipConfig.size + chipConfig.gap),
            row * (chipConfig.size + chipConfig.gap),
            chip.color,
          ),
        ),
      ),
);

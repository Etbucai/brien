import { Context, Effect } from 'effect';
import * as A from 'effect/Array';
import { fillRect } from '@context/canvas';

export interface ChipConfig {
  size: number;
  gap: number;
  backgroundColor: string;
}

export class ChipConfigContext extends Context.Tag('ChipConfigContext')<
  ChipConfigContext,
  ChipConfig
>() {}

export type Matrix<T> = T[][];

export interface Chip {
  color: string;
}

export type ChipMatrix = Matrix<Chip>;

export class ChipMatrixContext extends Context.Tag('ChipMatrixContext')<
  ChipMatrixContext,
  ChipMatrix
>() {}

export interface IGenerateChipMatrixOptions {
  columnCount: number;
  rowCount: number;
}

export function generateChipMatrix(options: IGenerateChipMatrixOptions): Effect.Effect<ChipMatrix> {
  return Effect.sync<ChipMatrix>(() => {
    const chipMatrix = A.makeBy(options.rowCount, () =>
      A.makeBy(options.columnCount, () => {
        const chip: Chip = {
          color: 'black',
        };
        return chip;
      }),
    );
    return chipMatrix;
  });
}

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

import { Context, Effect, Ref } from 'effect';
import { Chip } from './chip';

interface ChipMeta {
  type: string;
  color: string;
}

export const chipMetaList: ChipMeta[] = [
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

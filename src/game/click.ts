import { Effect, Equal, Option, Ref } from 'effect';
import { Vec2 } from '@utils/vec2';
import { Matrix } from '@utils/matrix';
import { CanvasContext } from './context/canvas';
import { updateRef } from './utils/updateRef';
import { ChipConfigContext } from './widgets/chip/config';
import { ChipMatrixContext } from './widgets/chip/matrix';

const getPointerTarget = (event: MouseEvent) =>
  Effect.gen(function* () {
    const [chipConfig, canvas] = yield* Effect.all([ChipConfigContext, CanvasContext]);
    const { x, y } = event;
    const rect = canvas.context.canvas.getBoundingClientRect();
    const offsetX = x - rect.x;
    const offsetY = y - rect.y;
    const isXHit = offsetX % (chipConfig.gap + chipConfig.size) < chipConfig.size;
    const isYHit = offsetY % (chipConfig.gap + chipConfig.size) < chipConfig.size;
    if (isXHit && isYHit) {
      const targetColumnIndex = Math.ceil(offsetX / (chipConfig.gap + chipConfig.size)) - 1;
      const targetRowIndex = Math.ceil(offsetY / (chipConfig.gap + chipConfig.size)) - 1;
      return Option.some(Vec2({ x: targetColumnIndex, y: targetRowIndex }));
    }
    return Option.none();
  });

const checkIsSibling = (a: Vec2, b: Vec2): boolean => {
  const xDistance = Math.abs(a.x - b.x);
  const yDistance = Math.abs(a.y - b.y);
  return (xDistance === 1 || yDistance === 1) && xDistance + yDistance === 1;
};

export const handleClickEvent = (event: MouseEvent) =>
  Effect.gen(function* () {
    const chipMatrix = yield* ChipMatrixContext;
    const target = yield* getPointerTarget(event);
    const current = yield* Ref.get(chipMatrix.selected);

    if (Option.isNone(target)) {
      return;
    }

    if (Option.isNone(current)) {
      yield* Ref.set(chipMatrix.selected, target);
      return;
    }

    const [targetPos, currentPos] = Option.all([target, current]).pipe(Option.getOrThrow);
    const isSame = Equal.equals(targetPos, currentPos);
    if (isSame) {
      yield* Ref.set(chipMatrix.selected, Option.none());
      return;
    }

    const isSibling = checkIsSibling(targetPos, currentPos);
    if (isSibling) {
      const matrix = yield* Ref.get(chipMatrix.matrix);
      const currentChip = Matrix.getItem(matrix, currentPos).pipe(Option.getOrThrow);
      const targetChip = Matrix.getItem(matrix, targetPos).pipe(Option.getOrThrow);
      yield* updateRef(chipMatrix.matrix, draft => {
        Matrix.setItem(draft, targetPos, currentChip);
        Matrix.setItem(draft, currentPos, targetChip);
      });
      yield* Ref.set(chipMatrix.selected, Option.none());
      return;
    }

    yield* Ref.set(chipMatrix.selected, Option.some(targetPos));
  });

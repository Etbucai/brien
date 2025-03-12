import { Effect, Equal, Option, Ref } from 'effect';
import { CanvasContext } from './context/canvas';
import { ChipConfigContext, ChipMatrixContext, Matrix, Vec2 } from './widgets/chip';
import { updateRef } from './utils/updateRef';

const getPointerTarget = Effect.serviceFunction(
  Effect.all([CanvasContext, ChipConfigContext]),
  ([canvas, chipConfig]) =>
    (event: MouseEvent): Option.Option<Vec2> => {
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
    },
);

const checkIsSibling = (a: Vec2, b: Vec2): boolean => {
  const xDistance = Math.abs(a.x - b.x);
  const yDistance = Math.abs(a.y - b.y);
  return (xDistance === 1 || yDistance === 1) && xDistance + yDistance === 1;
};

export const handleClickEvent = Effect.serviceFunctionEffect(
  ChipMatrixContext,
  chipMatrixState => (event: MouseEvent) =>
    Effect.gen(function* () {
      const target = yield* getPointerTarget(event);
      const current = yield* Ref.get(chipMatrixState.selected);

      if (Option.isNone(target)) {
        return;
      }

      if (Option.isNone(current)) {
        yield* Ref.set(chipMatrixState.selected, target);
        return;
      }

      const isSame = Option.all([target, current]).pipe(
        Option.andThen(([targetPos, currentPos]) => Equal.equals(targetPos, currentPos)),
        Option.getOrElse(() => false),
      );
      if (isSame) {
        yield* Ref.set(chipMatrixState.selected, Option.none());
        return;
      }

      const [targetPos, currentPos] = Option.all([target, current]).pipe(Option.getOrThrow);
      const isSibling = checkIsSibling(targetPos, currentPos);
      if (isSibling) {
        const matrix = yield* Ref.get(chipMatrixState.matrix);
        const currentChip = Matrix.getItem(matrix, currentPos).pipe(Option.getOrThrow);
        const targetChip = Matrix.getItem(matrix, targetPos).pipe(Option.getOrThrow);
        yield* updateRef(chipMatrixState.matrix, draft => {
          Matrix.setItem(draft, targetPos, currentChip);
          Matrix.setItem(draft, currentPos, targetChip);
        });
        yield* Ref.set(chipMatrixState.selected, Option.none());
        return;
      }

      yield* Ref.set(chipMatrixState.selected, Option.some(targetPos));
    }),
);

import { Effect, Option, Ref } from 'effect';
import { CanvasContext } from './context/canvas';
import { ChipConfigContext, ChipMatrixStateContext, Pos } from './widgets/chip';

const getPointerTarget = Effect.serviceFunction(
  Effect.all([CanvasContext, ChipConfigContext]),
  ([canvas, chipConfig]) =>
    (event: MouseEvent): Option.Option<Pos> => {
      const { x, y } = event;
      const rect = canvas.context.canvas.getBoundingClientRect();
      const offsetX = x - rect.x;
      const offsetY = y - rect.y;
      const isXHit = offsetX % (chipConfig.gap + chipConfig.size) < chipConfig.size;
      const isYHit = offsetY % (chipConfig.gap + chipConfig.size) < chipConfig.size;
      if (isXHit && isYHit) {
        const targetColumnIndex = Math.ceil(offsetX / (chipConfig.gap + chipConfig.size)) - 1;
        const targetRowIndex = Math.ceil(offsetY / (chipConfig.gap + chipConfig.size)) - 1;
        const pos: Pos = [targetColumnIndex, targetRowIndex];
        return Option.some(pos);
      }
      return Option.none();
    },
);

export const handleClickEvent = Effect.serviceFunctionEffect(
  ChipMatrixStateContext,
  chipMatrixState => (event: MouseEvent) =>
    Effect.gen(function* () {
      const target = yield* getPointerTarget(event);
      const current = yield* chipMatrixState.selected.get;

      yield* Option.all([target, current]).pipe(
        Option.andThen(
          ([targetPos, currentPos]) =>
            targetPos[0] === currentPos[0] && targetPos[1] === currentPos[1],
        ),
        Option.andThen(isSame => {
          if (isSame) {
            return Option.some(Ref.set(chipMatrixState.selected, Option.none()));
          }
          return Option.none();
        }),
        Option.getOrElse(() => Effect.void),
      );
    }),
);

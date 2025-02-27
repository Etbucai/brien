import { Effect, Ref } from 'effect';
import { CanvasService } from '../context/canvas';
import { Time } from '../context/time';
import { updateRef } from '../utils/updateRef';
import { FpsState } from '../context/fps';

const updateFps = Effect.serviceFunctionEffect(
  Effect.all([FpsState, Time]),
  ([fpsStateRef, { timestamp }]) =>
    () =>
      updateRef(fpsStateRef, draft => {
        if (timestamp - draft.lastFlushTime < 1000) {
          draft.frameCount += 1;
        } else {
          draft.lastFps = draft.frameCount;
          draft.frameCount = 0;
          draft.lastFlushTime = timestamp;
        }
      }),
);

const getLastFps = Effect.serviceFunctionEffect(
  FpsState,
  fpsState => () => Ref.get(fpsState).pipe(Effect.map(it => it.lastFps)),
);

const renderText = Effect.serviceFunction(CanvasService, canvas => (fps: number) => {
  const fontSize = 18;
  canvas.fillTextWithTheme(fps.toString(), 0, fontSize, {
    fontFamily: 'PingFangHK',
    fontSize,
  });
});

export const renderFps = updateFps().pipe(
  //
  Effect.andThen(getLastFps),
  Effect.andThen(renderText),
);

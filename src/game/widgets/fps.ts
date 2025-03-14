import { Effect, Ref } from 'effect';
import { fillTextWithTheme } from '@context/canvas';
import { getNow } from '@context/time';
import { FpsContext } from '@context/fps';
import { updateRef } from '../utils/updateRef';

const updateFps = () =>
  Effect.gen(function* () {
    const fpsStateRef = yield* FpsContext;
    const now = yield* getNow();
    updateRef(fpsStateRef, draft => {
      if (now - draft.lastFlushTime < 1000) {
        draft.frameCount += 1;
      } else {
        draft.lastFps = draft.frameCount;
        draft.frameCount = 0;
        draft.lastFlushTime = now;
      }
    });
  });

const getLastFps = Effect.serviceFunctionEffect(
  FpsContext,
  fpsState => () => Ref.get(fpsState).pipe(Effect.map(it => it.lastFps)),
);

const renderText = (fps: number) => {
  const fontSize = 18;
  return fillTextWithTheme(fps.toString(), 0, fontSize, {
    fontFamily: 'PingFangHK',
    fontSize,
  });
};

export const renderFps = () =>
  updateFps().pipe(
    //
    Effect.andThen(getLastFps),
    Effect.andThen(renderText),
  );

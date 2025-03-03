import { Effect, Ref } from 'effect';
import { fillTextWithTheme } from '@context/canvas';
import { TimeContext } from '@context/time';
import { FpsContext } from '@context/fps';
import { updateRef } from '../utils/updateRef';

const updateFps = Effect.serviceFunctionEffect(
  Effect.all([FpsContext, TimeContext]),
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

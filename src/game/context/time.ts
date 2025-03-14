import { Context, Effect, Ref } from 'effect';

export interface TimeState {
  now: Ref.Ref<number>;
}

export class TimeContext extends Context.Tag('TimeContext')<TimeContext, TimeState>() {}

export const makeTimeState = () =>
  Effect.gen(function* () {
    return {
      now: yield* Ref.make(Date.now()),
    };
  });

export const updateNow = () =>
  Effect.gen(function* () {
    const now = Date.now();
    const timeState = yield* TimeContext;
    yield* Ref.set(timeState.now, now);
    return now;
  });

export const getNow = () =>
  Effect.gen(function* () {
    const timeState = yield* TimeContext;
    const now = yield* Ref.get(timeState.now);
    return now;
  });

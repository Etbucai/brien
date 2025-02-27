import { Context, Ref } from 'effect';

export interface FpsState {
  frameCount: number;
  lastFlushTime: number;
  lastFps: number;
}

export class FpsContext extends Context.Tag('FpsContext')<FpsContext, Ref.Ref<FpsState>>() {}

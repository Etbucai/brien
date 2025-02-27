import { Context, Ref } from 'effect';

export interface IFpsState {
  frameCount: number;
  lastFlushTime: number;
  lastFps: number;
}

export class FpsState extends Context.Tag('FpsState')<FpsState, Ref.Ref<IFpsState>>() {}

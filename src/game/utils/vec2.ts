import { Data } from 'effect';

export interface Vec2 {
  x: number;
  y: number;
}

export const Vec2 = Data.case<Vec2>();

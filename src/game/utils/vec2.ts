import { Data } from 'effect';

export interface Vec2 {
  x: number;
  y: number;
}

export const Vec2 = Data.case<Vec2>();

export const subVec2 = (self: Vec2, target: Vec2): Vec2 =>
  Vec2({
    x: self.x - target.x,
    y: self.y - target.y,
  });

export const addVec2 = (self: Vec2, target: Vec2): Vec2 =>
  Vec2({
    x: self.x + target.x,
    y: self.y + target.y,
  });

export const scaleVec2 = (self: Vec2, factor: number): Vec2 =>
  Vec2({
    x: self.x * factor,
    y: self.y * factor,
  });

export const emptyVec2 = (): Vec2 => Vec2({ x: 0, y: 0 });

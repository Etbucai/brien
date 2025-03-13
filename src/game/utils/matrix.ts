import { Array, Option } from 'effect';
import { Vec2 } from './vec2';

export type Matrix<T> = T[][];

const getItem = <T>(matrix: Matrix<T>, pos: Vec2) =>
  Array.get(matrix, pos.y).pipe(Option.andThen(row => Array.get(row, pos.x)));

const setItem = <T>(matrix: Matrix<T>, pos: Vec2, item: T) => (matrix[pos.y][pos.x] = item);

export const Matrix = {
  getItem,
  setItem,
};

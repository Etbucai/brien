import { Context } from 'effect';

export interface TextTheme {
  fontSize: number;
  fontFamily: string;
}

export interface ITheme {
  text: TextTheme;
}

export class Theme extends Context.Tag('Theme')<Theme, ITheme>() {}

export function makeTheme(config: ITheme): ITheme {
  return config;
}

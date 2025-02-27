import { Context } from 'effect';

export interface TextTheme {
  fontSize: number;
  fontFamily: string;
}

export interface ITheme {
  text: TextTheme;
}

export class ThemeContext extends Context.Tag('ThemeContext')<ThemeContext, ITheme>() {}

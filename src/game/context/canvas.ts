import { Context, Effect } from 'effect';
import { TextTheme, ThemeContext } from './theme';

export interface ICanvas {
  width: number;
  height: number;
  scale: number;
  context: CanvasRenderingContext2D;
}

export class CanvasContext extends Context.Tag('CanvasContext')<CanvasContext, ICanvas>() {}

export const fillTextWithTheme = Effect.serviceFunction(
  CanvasContext,
  ({ context, scale }) =>
    (text: string, x: number, y: number, theme: TextTheme) => {
      const originFont = context.font;
      context.font = `${theme.fontSize * scale}px "${theme.fontFamily}"`;
      context.fillText(text, x * scale, y * scale);
      context.font = originFont;
    },
);

export const fillText = Effect.serviceFunctionEffect(
  ThemeContext,
  theme => (text: string, x: number, y: number, overwriteTextTheme?: Partial<TextTheme>) =>
    fillTextWithTheme(text, x, y, { ...theme.text, ...overwriteTextTheme }),
);

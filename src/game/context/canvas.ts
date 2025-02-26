import { Context, Effect } from 'effect';
import { TextTheme, Theme } from './theme';

export interface CanvasServiceConfig {
  width: number;
  height: number;
  scale: number;
}

export interface ICanvasService {
  readonly width: number;
  readonly height: number;

  readonly fillTextWithTheme: (text: string, x: number, y: number, textTheme: TextTheme) => void;
  readonly fillText: (
    text: string,
    x: number,
    y: number,
    theme?: Partial<TextTheme>,
  ) => Effect.Effect<void, void, Theme>;
}

export class CanvasService extends Context.Tag('CanvasService')<CanvasService, ICanvasService>() {}

export function make(
  canvas: CanvasRenderingContext2D,
  canvasServiceConfig: CanvasServiceConfig,
): ICanvasService {
  const { scale } = canvasServiceConfig;

  const fillTextWithTheme: ICanvasService['fillTextWithTheme'] = (text, x, y, theme) => {
    const originFont = canvas.font;
    canvas.font = `${theme.fontSize * scale}px "${theme.fontFamily}"`;
    canvas.fillText(text, x * scale, y * scale);
    canvas.font = originFont;
  };

  const fillText: ICanvasService['fillText'] = (text, x, y, overwriteTextTheme = {}) =>
    Theme.pipe(
      Effect.andThen(theme => {
        fillTextWithTheme(text, x, y, { ...theme.text, ...overwriteTextTheme });
      }),
    );

  return {
    width: canvasServiceConfig.width,
    height: canvasServiceConfig.height,
    fillTextWithTheme,
    fillText,
  };
}

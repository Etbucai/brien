import { Effect } from 'effect';
import { CanvasService } from '../context/canvas';

export const renderFps = CanvasService.pipe(
  Effect.andThen(canvas =>
    canvas.fillTextWithTheme('ciallo', 0, 18, {
      fontFamily: 'PingFangHK',
      fontSize: 18,
    }),
  ),
);

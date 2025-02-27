import { useEffect, useRef } from 'react';
import * as GameUtils from './game/main';
import { Effect } from 'effect';

const canvasWidth = 400;
const canvasHeight = 300;
const dpr = window.devicePixelRatio;
const canvasWidthPx = canvasWidth * dpr;
const canvasHeightPx = canvasHeight * dpr;

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const context = canvasRef.current?.getContext('2d');
    if (!context) {
      throw new Error('missing context');
    }

    let gameUtils = GameUtils;

    let game = Effect.runSync(
      gameUtils.createGame({
        context,
        width: canvasWidth,
        height: canvasHeight,
        scale: dpr,
      }),
    );
    gameUtils.startGame(game);

    if (import.meta.hot) {
      import.meta.hot.accept('./game/main', module => {
        if (module) {
          gameUtils.pauseGame(game);
          gameUtils = module as unknown as typeof import('./game/main');
          game = Effect.runSync(
            gameUtils.createGame({
              context,
              width: canvasWidth,
              height: canvasHeight,
              scale: dpr,
            }),
          );
          gameUtils.startGame(game);
        }
      });
    }
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidthPx}
      height={canvasHeightPx}
      style={{ backgroundColor: '#EEE', width: canvasWidth, height: canvasHeight }}
    />
  );
}

export default App;

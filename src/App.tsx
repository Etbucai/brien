import { useEffect, useRef } from 'react';
import { createGame, startGame } from './game/main';
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

    const program = Effect.gen(function* () {
      const game = yield* createGame({
        context,
        width: canvasWidth,
        height: canvasHeight,
        scale: dpr,
      });
      const fiber = Effect.runFork(startGame(game));
      const current = yield* Effect.fiberId;
      const pauseGame = () => {
        Effect.runFork(fiber.interruptAsFork(current));
      };
      return pauseGame;
    });

    const pauseGame = Effect.runSync(program);
    return pauseGame;
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

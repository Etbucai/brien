import { useEffect, useMemo, useRef } from 'react';
import { createGame, startGame } from './game/main';
import { Effect, PubSub, Stream } from 'effect';

const canvasWidth = 400;
const canvasHeight = 300;
const dpr = window.devicePixelRatio;
const canvasWidthPx = canvasWidth * dpr;
const canvasHeightPx = canvasHeight * dpr;

type EventBus<T> = {
  publish: (event: T) => Effect.Effect<void>;
  subscribe: () => Stream.Stream<T>;
};

function makeEventBus<T>(): Effect.Effect<EventBus<T>> {
  return Effect.gen(function* () {
    const pubSub = yield* PubSub.sliding<T>(1);
    return {
      publish: event => pubSub.offer(event),
      subscribe: () => Stream.fromPubSub(pubSub),
    };
  });
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const eventBus = useMemo(() => Effect.runSync(makeEventBus<MouseEvent>()), []);
  const eventStream = useMemo(() => eventBus.subscribe(), [eventBus]);

  useEffect(() => {
    const context = canvasRef.current?.getContext('2d');
    if (!context) {
      throw new Error('missing context');
    }

    const program = Effect.gen(function* () {
      const game = yield* createGame(
        {
          context,
          width: canvasWidth,
          height: canvasHeight,
          scale: dpr,
        },
        eventStream,
      );
      const fiber = Effect.runFork(startGame(game));
      const current = yield* Effect.fiberId;
      const pauseGame = () => {
        Effect.runFork(fiber.interruptAsFork(current));
      };
      return pauseGame;
    });

    const pauseGame = Effect.runSync(program);
    return pauseGame;
  }, [eventStream]);

  return (
    <canvas
      onClick={ev => {
        Effect.runFork(eventBus.publish(ev.nativeEvent));
      }}
      ref={canvasRef}
      width={canvasWidthPx}
      height={canvasHeightPx}
      style={{
        backgroundColor: '#EEE',
        width: canvasWidth,
        height: canvasHeight,
      }}
    />
  );
}

export default App;

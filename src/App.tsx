import { useEffect, useRef } from 'react';
import { getFrameUpdater } from './game/main';

const canvasWidth = 400;
const canvasHeight = 300;
const dpr = window.devicePixelRatio;
const canvasWidthPx = canvasWidth * dpr;
const canvasHeightPx = canvasHeight * dpr;

function startFrameLoop(
  getFrameUpdaterFn: typeof getFrameUpdater,
  context: CanvasRenderingContext2D,
) {
  const update = getFrameUpdaterFn(context, {
    width: canvasWidth,
    height: canvasHeight,
    scale: dpr,
  });

  let rafId = -1;

  const loopFn = () => {
    update();
    rafId = requestAnimationFrame(update);
  };

  loopFn();

  return () => {
    cancelAnimationFrame(rafId);
  };
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const context = canvasRef.current?.getContext('2d');
    if (!context) {
      throw new Error('missing context');
    }

    let cancel = startFrameLoop(getFrameUpdater, context);

    if (import.meta.hot) {
      import.meta.hot.accept('./game/main', module => {
        if (module) {
          const m = module as unknown as typeof import('./game/main');
          cancel();
          cancel = startFrameLoop(m.getFrameUpdater, context);
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

import { useEffect, useRef } from 'react';
import { mainGame } from './game/main';

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

    mainGame(context, { width: canvasWidth, height: canvasHeight, scale: dpr });
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

import { useRef } from 'react';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return <canvas ref={canvasRef} width={600} height={300} style={{ backgroundColor: '#EEE' }} />;
}

export default App;
